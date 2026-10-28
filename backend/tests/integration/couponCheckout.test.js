import crypto from 'node:crypto';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

// ESM: the mock must be registered before the app (and so the email module) is imported.
const outbox = [];
jest.unstable_mockModule('../../src/integrations/email/index.js', () => {
  const sendEmail = async (message) => {
    outbox.push(message);
  };
  return { sendEmail, default: sendEmail };
});

const { default: app } = await import('../../src/app.js');
const { env } = await import('../../src/config/env.js');
const { Address } = await import('../../src/modules/address/address.model.js');
const { Cart } = await import('../../src/modules/cart/cart.model.js');
const { Coupon } = await import('../../src/modules/coupon/coupon.model.js');
const { Order } = await import('../../src/modules/order/order.model.js');
const { Product } = await import('../../src/modules/product/product.model.js');
const { User } = await import('../../src/modules/user/user.model.js');
const { signAccessToken } = await import('../../src/utils/token.js');

const api = (path) => `${env.API_PREFIX}${path}`;
const bearer = (userId, role = 'user') => `Bearer ${signAccessToken({ sub: userId, role })}`;
const adminId = new mongoose.Types.ObjectId().toString();

const guestAddress = {
  name: 'Guest Shopper',
  phone: '9876543210',
  pincode: '500081',
  line1: 'House 12, Lake Road',
  city: 'Hyderabad',
  state: 'Telangana',
};

let productSeq = 0;
const makeProduct = (overrides = {}) => {
  productSeq += 1;
  return Product.create({
    name: `Coupon Chikki ${productSeq}`,
    sku: `CPN-${productSeq}`,
    category: new mongoose.Types.ObjectId(),
    mrp: 120,
    price: 100,
    packSize: { value: 100, unit: 'g' },
    images: [{ url: 'https://example.com/a.png', publicId: `test/${productSeq}`, alt: 'Front' }],
    stock: 20,
    ...overrides,
  });
};

let userSeq = 0;
/** A signed-in customer whose saved address uses the guest's phone, +919876543210, unless told otherwise. */
async function makeCustomer({ phone = '+919876543210' } = {}) {
  userSeq += 1;
  const user = await User.create({
    name: `Customer ${userSeq}`,
    email: `coupon-customer-${userSeq}@example.com`,
    password: 'Secret123',
  });
  const address = await Address.create({
    user: user._id,
    name: 'Renu Yadav',
    phone,
    pincode: '500081',
    line1: 'Flat 4B, Sunrise Apartments',
    city: 'Hyderabad',
    state: 'Telangana',
    isDefault: true,
  });
  return { userId: user.id, addressId: address.id };
}

const makeCoupon = (overrides = {}) =>
  Coupon.create({ code: 'WELCOME10', type: 'percent', value: 10, maxDiscount: 100, ...overrides });

const usedCountOf = async (code = 'WELCOME10') => (await Coupon.findOne({ code }).lean()).usedCount;
const stockOf = async (product) => (await Product.findById(product._id).lean()).stock;

const placeAs = (userId, body) => request(app).post(api('/orders')).set('Authorization', bearer(userId)).send(body);
const buyNow = (product, quantity = 1) => ({ productId: product.id, quantity });

let mongod;
let providerPayments;

function paymentDetailsFor(order, paymentId) {
  providerPayments.set(paymentId, {
    id: paymentId,
    order_id: order.checkout.orderId,
    amount: order.total * 100,
    currency: 'INR',
    status: 'captured',
  });
  return {
    razorpay_order_id: order.checkout.orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: crypto
      .createHmac('sha256', 'test_razorpay_secret')
      .update(`${order.checkout.orderId}|${paymentId}`)
      .digest('hex'),
  };
}

const verifyAs = (userId, order, paymentId) =>
  request(app)
    .post(api(`/orders/${order.id}/payment/verify`))
    .set('Authorization', bearer(userId))
    .send(paymentDetailsFor(order, paymentId));

const abandonAs = (userId, order) =>
  request(app)
    .post(api(`/orders/${order.id}/payment/status`))
    .set('Authorization', bearer(userId))
    .send({ abandon: true });

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([Address.init(), Cart.init(), Coupon.init(), Order.init(), Product.init(), User.init()]);
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  outbox.length = 0;
  providerPayments = new Map();
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
    if (String(url).endsWith('/orders')) {
      const body = JSON.parse(options.body);
      const providerOrder = { id: `order_${body.receipt}`, amount: body.amount, currency: body.currency, receipt: body.receipt };
      return new Response(JSON.stringify(providerOrder), { status: 200 });
    }
    const orderPayments = String(url).match(/\/orders\/([^/]+)\/payments$/);
    if (orderPayments) {
      const items = [...providerPayments.values()].filter((payment) => payment.order_id === orderPayments[1]);
      return new Response(JSON.stringify({ count: items.length, items }), { status: 200 });
    }
    if (String(url).includes('/payments/')) {
      const payment = providerPayments.get(String(url).split('/').at(-1));
      return new Response(JSON.stringify(payment ?? { error: { code: 'NOT_FOUND' } }), { status: payment ? 200 : 404 });
    }
    throw new Error(`Unexpected mocked Razorpay request: ${url}`);
  });
  await Promise.all([
    Address.deleteMany({}),
    Cart.deleteMany({}),
    Coupon.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
  ]);
  await User.create({ _id: adminId, name: 'Coupon Admin', email: 'coupon-admin@example.com', password: 'Secret123', role: 'admin' });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('POST /coupons/apply (preview)', () => {
  test('prices the signed-in cart with the code and takes no use', async () => {
    const { userId } = await makeCustomer();
    const product = await makeProduct();
    await Cart.create({ user: userId, items: [{ product: product._id, quantity: 3 }] });
    await makeCoupon();

    const res = await request(app)
      .post(api('/coupons/apply'))
      .set('Authorization', bearer(userId))
      .send({ code: 'welcome10' })
      .expect(200);

    expect(res.body.data).toMatchObject({ code: 'WELCOME10', subtotal: 300, discount: 30, total: 270 });
    expect(await usedCountOf()).toBe(0);
  });

  test('prices a guest Buy Now line', async () => {
    const product = await makeProduct({ price: 2000, mrp: 2000 });
    await makeCoupon();

    const res = await request(app)
      .post(api('/coupons/apply'))
      .send({ code: 'WELCOME10', buyNow: buyNow(product) })
      .expect(200);

    // 10% of ₹2000 is ₹200, capped at ₹100.
    expect(res.body.data).toMatchObject({ subtotal: 2000, discount: 100, total: 1900 });
  });

  test('refuses an unknown code', async () => {
    const product = await makeProduct();
    const res = await request(app).post(api('/coupons/apply')).send({ code: 'NOPE', buyNow: buyNow(product) });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('COUPON_INVALID');
  });
});

describe('checkout with a coupon', () => {
  test('charges the discounted total, keeps a copy of the coupon and counts the use', async () => {
    const { userId, addressId } = await makeCustomer();
    const product = await makeProduct();
    await makeCoupon();

    const res = await placeAs(userId, { addressId, buyNow: buyNow(product, 5), couponCode: 'welcome10' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      subtotal: 500,
      discount: 50,
      total: 450,
      coupon: { code: 'WELCOME10', type: 'percent', value: 10, maxDiscount: 100 },
      checkout: { amount: 45_000 },
    });
    expect(res.body.data).not.toHaveProperty('couponId');
    expect(await usedCountOf()).toBe(1);

    // Changing the coupon later never changes the order.
    await Coupon.updateOne({ code: 'WELCOME10' }, { $set: { value: 50 } });
    const paid = await verifyAs(userId, res.body.data, 'pay_coupon').expect(200);
    expect(paid.body.data).toMatchObject({ paymentStatus: 'paid', total: 450, coupon: { value: 10 } });

    const email = outbox.at(-1);
    expect(email.text).toContain('Coupon WELCOME10: −₹50');
    expect(email.text).toContain('Total: ₹450');

    const admin = await request(app)
      .get(api(`/admin/coupons/${(await Coupon.findOne().lean())._id}`))
      .set('Authorization', bearer(adminId, 'admin'))
      .expect(200);
    expect(admin.body.data).toMatchObject({ usedCount: 1, paidOrders: 1, totalDiscount: 50 });
  });

  test('without a coupon the order is unchanged: no discount, total is the subtotal', async () => {
    const { userId, addressId } = await makeCustomer();
    const product = await makeProduct();

    const res = await placeAs(userId, { addressId, buyNow: buyNow(product, 2) }).expect(201);

    expect(res.body.data).toMatchObject({ subtotal: 200, discount: 0, total: 200, checkout: { amount: 20_000 } });
    expect(res.body.data.coupon).toBeUndefined();
    await verifyAs(userId, res.body.data, 'pay_plain').expect(200);
    expect(outbox.at(-1).text).not.toContain('Subtotal');
  });

  test('always leaves ₹1 to pay', async () => {
    const { userId, addressId } = await makeCustomer();
    const product = await makeProduct();
    await makeCoupon({ code: 'FLAT500', type: 'flat', value: 500, maxDiscount: null });

    const res = await placeAs(userId, { addressId, buyNow: buyNow(product), couponCode: 'FLAT500' }).expect(201);
    expect(res.body.data).toMatchObject({ discount: 99, total: 1, checkout: { amount: 100 } });
  });

  test('a guest order takes the coupon too', async () => {
    const product = await makeProduct();
    await makeCoupon({ code: 'FLAT50', type: 'flat', value: 50, maxDiscount: null });

    const res = await request(app)
      .post(api('/orders/guest'))
      .send({ checkoutKey: crypto.randomUUID(), address: guestAddress, buyNow: buyNow(product, 2), couponCode: 'FLAT50' })
      .expect(201);

    expect(res.body.data).toMatchObject({ discount: 50, total: 150, coupon: { code: 'FLAT50' } });
  });

  test('an invalid code places nothing and takes no stock', async () => {
    const { userId, addressId } = await makeCustomer();
    const product = await makeProduct({ stock: 5 });
    await makeCoupon({ minOrderValue: 1000 });

    const res = await placeAs(userId, { addressId, buyNow: buyNow(product), couponCode: 'WELCOME10' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('COUPON_MIN_ORDER');
    expect(await stockOf(product)).toBe(5);
    expect(await Order.countDocuments()).toBe(0);
  });

  test('gives the use back when the stock cannot be taken', async () => {
    const { userId, addressId } = await makeCustomer();
    const product = await makeProduct({ stock: 1 });
    await makeCoupon();

    const res = await placeAs(userId, { addressId, buyNow: buyNow(product, 2), couponCode: 'WELCOME10' });

    expect(res.status).toBe(409);
    expect(await usedCountOf()).toBe(0);
  });

  test('two shoppers racing for the last use: exactly one gets it', async () => {
    const [first, second] = await Promise.all([
      makeCustomer({ phone: '+919800000001' }),
      makeCustomer({ phone: '+919800000002' }),
    ]);
    const product = await makeProduct({ stock: 10 });
    await makeCoupon({ maxUses: 1 });

    const results = await Promise.all(
      [first, second].map(({ userId, addressId }) =>
        placeAs(userId, { addressId, buyNow: buyNow(product), couponCode: 'WELCOME10' })
      )
    );

    expect(results.map((r) => r.status).sort()).toEqual([201, 400]);
    expect(results.find((r) => r.status === 400).body.code).toBe('COUPON_USAGE_LIMIT');
    expect(await usedCountOf()).toBe(1);
    expect(await stockOf(product)).toBe(9);
  });

  test('closing the payment window gives the use back; a late payment takes it again', async () => {
    const { userId, addressId } = await makeCustomer();
    const product = await makeProduct();
    await makeCoupon();

    const { body } = await placeAs(userId, { addressId, buyNow: buyNow(product), couponCode: 'WELCOME10' }).expect(201);
    expect(await usedCountOf()).toBe(1);

    await abandonAs(userId, body.data).expect(200);
    expect(await usedCountOf()).toBe(0);

    await verifyAs(userId, body.data, 'pay_late_coupon').expect(200);
    expect(await usedCountOf()).toBe(1);
  });
});

describe('per-customer limit', () => {
  test('counts the signed-in customer’s open and paid orders, not abandoned ones', async () => {
    const { userId, addressId } = await makeCustomer();
    const product = await makeProduct();
    await makeCoupon({ maxUsesPerCustomer: 1 });

    const { body } = await placeAs(userId, { addressId, buyNow: buyNow(product), couponCode: 'WELCOME10' }).expect(201);

    const again = await placeAs(userId, { addressId, buyNow: buyNow(product), couponCode: 'WELCOME10' });
    expect(again.status).toBe(400);
    expect(again.body.code).toBe('COUPON_CUSTOMER_LIMIT');

    await abandonAs(userId, body.data).expect(200);
    await placeAs(userId, { addressId, buyNow: buyNow(product), couponCode: 'WELCOME10' }).expect(201);
  });

  test('one customer racing two checkouts: exactly one gets it', async () => {
    const { userId, addressId } = await makeCustomer();
    const product = await makeProduct({ stock: 10 });
    await makeCoupon({ maxUsesPerCustomer: 1 });

    const results = await Promise.all(
      [1, 2].map(() => placeAs(userId, { addressId, buyNow: buyNow(product), couponCode: 'WELCOME10' }))
    );

    expect(results.map((r) => r.status).sort()).toEqual([201, 400]);
    expect(results.find((r) => r.status === 400).body.code).toBe('COUPON_CUSTOMER_LIMIT');
    expect(await usedCountOf()).toBe(1);
    expect(await stockOf(product)).toBe(9);
    expect(await Order.countDocuments({ 'coupon.code': 'WELCOME10' })).toBe(1);
  });

  test('a guest is matched by phone, so signing in does not reset the limit', async () => {
    const product = await makeProduct();
    await makeCoupon({ maxUsesPerCustomer: 1 });
    await request(app)
      .post(api('/orders/guest'))
      .send({ checkoutKey: crypto.randomUUID(), address: guestAddress, buyNow: buyNow(product), couponCode: 'WELCOME10' })
      .expect(201);

    // Same phone as the guest's delivery number.
    const { userId, addressId } = await makeCustomer({ phone: '+919876543210' });
    const res = await placeAs(userId, { addressId, buyNow: buyNow(product), couponCode: 'WELCOME10' });
    expect(res.body.code).toBe('COUPON_CUSTOMER_LIMIT');

    const preview = await request(app)
      .post(api('/coupons/apply'))
      .send({ code: 'WELCOME10', buyNow: buyNow(product), phone: '9876543210' });
    expect(preview.body.code).toBe('COUPON_CUSTOMER_LIMIT');
  });
});

test('deleting a customer gives back the use their open checkout held', async () => {
  const { userId, addressId } = await makeCustomer();
  const product = await makeProduct();
  await makeCoupon();
  await placeAs(userId, { addressId, buyNow: buyNow(product), couponCode: 'WELCOME10' }).expect(201);
  expect(await usedCountOf()).toBe(1);

  await request(app).delete(api(`/admin/users/${userId}`)).set('Authorization', bearer(adminId, 'admin')).expect(204);

  expect(await usedCountOf()).toBe(0);
});

describe('admin changes to a used coupon', () => {
  test('cannot change the code, and delete switches it off instead', async () => {
    const { userId, addressId } = await makeCustomer();
    const product = await makeProduct();
    const coupon = await makeCoupon({ isFeatured: true });
    await placeAs(userId, { addressId, buyNow: buyNow(product), couponCode: 'WELCOME10' }).expect(201);
    const asAdmin = (method) =>
      request(app)[method](api(`/admin/coupons/${coupon.id}`)).set('Authorization', bearer(adminId, 'admin'));

    const rename = await asAdmin('patch').send({ code: 'HELLO10' });
    expect(rename.status).toBe(409);
    expect(rename.body.code).toBe('COUPON_IN_USE');

    const removed = await asAdmin('delete').expect(200);
    expect(removed.body.data).toEqual({ deleted: false });
    expect(await Coupon.findById(coupon.id).lean()).toMatchObject({ isActive: false, isFeatured: false });
  });
});