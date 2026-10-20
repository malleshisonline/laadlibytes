import crypto from 'node:crypto';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

const { default: app } = await import('../../src/app.js');
const { env } = await import('../../src/config/env.js');
const { Address } = await import('../../src/modules/address/address.model.js');
const { Cart } = await import('../../src/modules/cart/cart.model.js');
const { Order } = await import('../../src/modules/order/order.model.js');
const { Product } = await import('../../src/modules/product/product.model.js');
const { User } = await import('../../src/modules/user/user.model.js');
const { signAccessToken } = await import('../../src/utils/token.js');

const api = (path) => `${env.API_PREFIX}${path}`;
const bearer = (userId, role = 'user') => `Bearer ${signAccessToken({ sub: userId, role })}`;
const adminId = new mongoose.Types.ObjectId().toString();

let productSeq = 0;
const makeProduct = (overrides = {}) => {
  productSeq += 1;
  return Product.create({
    name: `Test Chikki ${productSeq}`,
    sku: `TEST-${productSeq}`,
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
/** A customer with a saved address. Phone-only unless an email is given. */
async function makeCustomer({ email } = {}) {
  userSeq += 1;
  const user = await User.create({
    name: `Customer ${userSeq}`,
    ...(email ? { email } : { phone: `+9198765${String(userSeq).padStart(5, '0')}` }),
    password: 'Secret123',
  });
  const address = await Address.create({
    user: user._id,
    name: 'Renu Yadav',
    phone: '+919876543210',
    pincode: '500081',
    line1: 'Flat 4B, Sunrise Apartments',
    city: 'Hyderabad',
    state: 'Telangana',
    isDefault: true,
  });
  return { userId: user.id, addressId: address.id };
}

const asCustomer = (userId, method, path = '') =>
  request(app)[method](api(`/orders${path}`)).set('Authorization', bearer(userId));
const asAdmin = (method, path = '') =>
  request(app)[method](api(`/admin/orders${path}`)).set('Authorization', bearer(adminId, 'admin'));

const fillCart = (userId, lines) =>
  Cart.create({ user: userId, items: lines.map(({ product, quantity }) => ({ product: product._id, quantity })) });

const stockOf = async (product) => (await Product.findById(product._id).lean()).stock;

let mongod;
let providerOrders;
let providerPayments;

function paymentDetailsFor(order, paymentId = 'pay_test_payment') {
  const details = {
    razorpay_order_id: order.checkout.orderId,
    razorpay_payment_id: paymentId,
  };
  providerPayments.set(paymentId, {
    id: paymentId,
    order_id: details.razorpay_order_id,
    amount: order.total * 100,
    currency: 'INR',
    status: 'captured',
  });
  details.razorpay_signature = crypto
    .createHmac('sha256', 'test_razorpay_secret')
    .update(`${details.razorpay_order_id}|${paymentId}`)
    .digest('hex');
  return details;
}

async function verifyPayment(order, userId, paymentId) {
  return asCustomer(userId, 'post', `/${order.id}/payment/verify`).send(paymentDetailsFor(order, paymentId));
}

function signedWebhook(event) {
  const rawBody = JSON.stringify(event);
  const signature = crypto.createHmac('sha256', 'test_razorpay_webhook_secret').update(rawBody).digest('hex');
  return { rawBody, signature };
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([Address.init(), Cart.init(), Order.init(), Product.init(), User.init()]);
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  providerOrders = new Map();
  providerPayments = new Map();
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
    if (String(url).endsWith('/orders')) {
      const requestBody = JSON.parse(options.body);
      const providerOrder = {
        id: `order_${requestBody.receipt}`,
        amount: requestBody.amount,
        currency: requestBody.currency,
        receipt: requestBody.receipt,
      };
      providerOrders.set(providerOrder.id, providerOrder);
      return new Response(JSON.stringify(providerOrder), { status: 200 });
    }
    if (String(url).includes('/payments/')) {
      const paymentId = String(url).split('/').at(-1);
      const payment = providerPayments.get(paymentId);
      return new Response(JSON.stringify(payment ?? { error: { code: 'NOT_FOUND' } }), {
        status: payment ? 200 : 404,
      });
    }
    throw new Error(`Unexpected mocked Razorpay request: ${url}`);
  });
  await Promise.all([
    Address.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
  ]);
  await User.create({
    _id: adminId,
    name: 'Order Admin',
    email: 'order-admin@example.com',
    password: 'Secret123',
    role: 'admin',
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('placing an order', () => {
  test('orders the whole cart: copies the lines and the address, takes the stock and empties the cart', async () => {
    const { userId, addressId } = await makeCustomer({ email: 'renu@example.com' });
    const chikki = await makeProduct();
    const ladoo = await makeProduct({ price: 250, mrp: 250, stock: 5 });
    await fillCart(userId, [
      { product: chikki, quantity: 2 },
      { product: ladoo, quantity: 1 },
    ]);

    const res = await asCustomer(userId, 'post').send({ addressId });

    expect(res.status).toBe(201);
    const order = res.body.data;
    expect(order.orderNumber).toMatch(/^LB-\d{8}-[A-HJ-NP-Z2-9]{5}$/);
    expect(order).toMatchObject({
      status: 'placed',
      paymentStatus: 'pending',
      itemCount: 3,
      subtotal: 450,
      mrpTotal: 490,
      savings: 40,
      total: 450,
      contact: { phone: '+919876543210', email: 'renu@example.com' },
      address: { name: 'Renu Yadav', pincode: '500081', city: 'Hyderabad', state: 'Telangana' },
    });
    expect(order.items).toEqual([
      expect.objectContaining({ name: chikki.name, sku: chikki.sku, price: 100, mrp: 120, quantity: 2, lineTotal: 200 }),
      expect.objectContaining({ name: ladoo.name, price: 250, quantity: 1, lineTotal: 250 }),
    ]);
    expect(order.items[0].image).toEqual({ url: 'https://example.com/a.png', alt: 'Front' });
    expect(order).not.toHaveProperty('shippingCharge');
    expect(order).not.toHaveProperty('user');
    expect(order.history).toEqual([{ event: 'status', value: 'placed', at: expect.any(String) }]);

    expect(await stockOf(chikki)).toBe(18);
    expect(await stockOf(ladoo)).toBe(4);
    expect((await Cart.findOne({ user: userId }).lean()).items).toHaveLength(2);
  });

  test('a phone-only customer has no contact email', async () => {
    const { userId, addressId } = await makeCustomer();
    await fillCart(userId, [{ product: await makeProduct(), quantity: 1 }]);

    const res = await asCustomer(userId, 'post').send({ addressId });

    expect(res.status).toBe(201);
    expect(res.body.data.contact).toEqual({ phone: '+919876543210', email: null });
  });

  test('Buy Now orders one product and leaves the cart alone', async () => {
    const { userId, addressId } = await makeCustomer();
    const inCart = await makeProduct();
    const bought = await makeProduct({ stock: 3 });
    await fillCart(userId, [{ product: inCart, quantity: 2 }]);

    const res = await asCustomer(userId, 'post').send({ addressId, buyNow: { productId: bought.id, quantity: 3 } });

    expect(res.status).toBe(201);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0]).toMatchObject({ sku: bought.sku, quantity: 3 });
    expect(await stockOf(bought)).toBe(0);
    expect(await stockOf(inCart)).toBe(20);
    expect((await Cart.findOne({ user: userId }).lean()).items).toHaveLength(1);
  });

  test('a later price change never alters a placed order', async () => {
    const { userId, addressId } = await makeCustomer();
    const product = await makeProduct();
    const placed = await asCustomer(userId, 'post').send({ addressId, buyNow: { productId: product.id, quantity: 1 } });

    await Product.updateOne({ _id: product._id }, { price: 999, name: 'Renamed' });
    const res = await asCustomer(userId, 'get', `/${placed.body.data.id}`);

    expect(res.body.data.items[0]).toMatchObject({ name: product.name, price: 100 });
    expect(res.body.data.total).toBe(100);
  });

  test('refuses an empty cart', async () => {
    const { userId, addressId } = await makeCustomer();

    const res = await asCustomer(userId, 'post').send({ addressId });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CART_EMPTY');
  });

  test('leaves out cart lines whose product was unpublished', async () => {
    const { userId, addressId } = await makeCustomer();
    const live = await makeProduct();
    const retired = await makeProduct({ isActive: false });
    await fillCart(userId, [
      { product: live, quantity: 1 },
      { product: retired, quantity: 1 },
    ]);

    const res = await asCustomer(userId, 'post').send({ addressId });

    expect(res.status).toBe(201);
    expect(res.body.data.items.map((item) => item.sku)).toEqual([live.sku]);
  });

  test("refuses another user's address with a 404", async () => {
    const { userId } = await makeCustomer();
    const other = await makeCustomer();
    await fillCart(userId, [{ product: await makeProduct(), quantity: 1 }]);

    const res = await asCustomer(userId, 'post').send({ addressId: other.addressId });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ADDRESS_NOT_FOUND');
    expect(await Order.countDocuments()).toBe(0);
  });

  test('when one line is short of stock, saves nothing and puts back the stock already taken', async () => {
    const { userId, addressId } = await makeCustomer();
    const plenty = await makeProduct();
    const scarce = await makeProduct({ name: 'Rare Chikki', stock: 1 });
    await fillCart(userId, [
      { product: plenty, quantity: 4 },
      { product: scarce, quantity: 2 },
    ]);

    const res = await asCustomer(userId, 'post').send({ addressId });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INSUFFICIENT_STOCK');
    expect(res.body.message).toBe('Only 1 left of Rare Chikki');
    expect(await Order.countDocuments()).toBe(0);
    expect(await stockOf(plenty)).toBe(20);
    expect(await stockOf(scarce)).toBe(1);
    expect((await Cart.findOne({ user: userId }).lean()).items).toHaveLength(2);
  });

  test('says when a product is out of stock or no longer sold', async () => {
    const { userId, addressId } = await makeCustomer();
    const soldOut = await makeProduct({ name: 'Sold Out Chikki', stock: 0 });
    const retired = await makeProduct({ isActive: false });

    const out = await asCustomer(userId, 'post').send({ addressId, buyNow: { productId: soldOut.id } });
    expect(out.status).toBe(409);
    expect(out.body.message).toBe('Sold Out Chikki is out of stock');

    const gone = await asCustomer(userId, 'post').send({ addressId, buyNow: { productId: retired.id } });
    expect(gone.status).toBe(404);
    expect(gone.body.code).toBe('PRODUCT_NOT_FOUND');
  });

  test('two shoppers racing for the last pack: exactly one gets it', async () => {
    const first = await makeCustomer();
    const second = await makeCustomer();
    const lastPack = await makeProduct({ stock: 1 });
    const buy = ({ userId, addressId }) =>
      asCustomer(userId, 'post').send({ addressId, buyNow: { productId: lastPack.id, quantity: 1 } });

    const results = await Promise.all([buy(first), buy(second)]);

    expect(results.map((res) => res.status).sort()).toEqual([201, 409]);
    expect(await stockOf(lastPack)).toBe(0);
    expect(await Order.countDocuments()).toBe(1);
  });

  test('validates the body and needs a signed-in user', async () => {
    const { userId } = await makeCustomer();

    const invalid = await asCustomer(userId, 'post').send({ addressId: 'nope', buyNow: { productId: 'x', quantity: 11 } });
    expect(invalid.status).toBe(400);
    expect(invalid.body.code).toBe('VALIDATION_ERROR');

    const guest = await request(app).post(api('/orders')).send({});
    expect(guest.status).toBe(401);
  });
});

describe('Razorpay checkout and verification', () => {
  test('allows Razorpay Checkout under the existing Content Security Policy', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.headers['content-security-policy']).toContain('https://checkout.razorpay.com');
    expect(res.headers['content-security-policy']).toContain('frame-src');
  });

  test('creates a gateway order using the server-priced total in paise', async () => {
    const customer = await makeCustomer();
    const product = await makeProduct({ price: 250, mrp: 300 });
    await fillCart(customer.userId, [{ product, quantity: 2 }]);

    const res = await asCustomer(customer.userId, 'post').send({ addressId: customer.addressId });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      total: 500,
      paymentStatus: 'pending',
      checkout: { amount: 50_000, currency: 'INR', keyId: 'rzp_test_key' },
    });
    const saved = await Order.findById(res.body.data.id).select('+razorpayOrderId').lean();
    expect(saved.razorpayOrderId).toBe(res.body.data.checkout.orderId);
  });

  test('reuses the same Razorpay order for an idempotent checkout retry', async () => {
    const customer = await makeCustomer();
    const product = await makeProduct();
    await fillCart(customer.userId, [{ product, quantity: 1 }]);
    const payload = { addressId: customer.addressId, checkoutKey: 'c70daf4e-bd25-4f17-8f21-51d8950571a1' };

    const first = await asCustomer(customer.userId, 'post').send(payload);
    const retry = await asCustomer(customer.userId, 'post').send(payload);

    expect(first.status).toBe(201);
    expect(retry.status).toBe(201);
    expect(retry.body.data.id).toBe(first.body.data.id);
    expect(retry.body.data.checkout.orderId).toBe(first.body.data.checkout.orderId);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  test('allows an unpaid order owner to resume the same Razorpay checkout', async () => {
    const customer = await makeCustomer();
    const checkout = await asCustomer(customer.userId, 'post').send({
      addressId: customer.addressId,
      buyNow: { productId: (await makeProduct()).id },
    });

    const resumed = await asCustomer(customer.userId, 'post', `/${checkout.body.data.id}/payment/checkout`).send({});

    expect(resumed.status).toBe(200);
    expect(resumed.body.data.id).toBe(checkout.body.data.id);
    expect(resumed.body.data.checkout.orderId).toBe(checkout.body.data.checkout.orderId);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  test('releases reserved stock and leaves the cart intact if Razorpay order creation fails', async () => {
    const customer = await makeCustomer();
    const product = await makeProduct({ stock: 5 });
    await fillCart(customer.userId, [{ product, quantity: 2 }]);
    globalThis.fetch.mockImplementationOnce(async () =>
      new Response(JSON.stringify({ id: 'order_invalid', amount: 1, currency: 'INR', receipt: 'bad' }), { status: 200 }),
    );

    const res = await asCustomer(customer.userId, 'post').send({ addressId: customer.addressId });

    expect(res.status).toBe(500);
    expect(await Order.countDocuments()).toBe(0);
    expect(await stockOf(product)).toBe(5);
    expect((await Cart.findOne({ user: customer.userId }).lean()).items).toHaveLength(1);
  });

  test('verifies a captured payment, clears only the paid cart order, and is idempotent', async () => {
    const customer = await makeCustomer();
    const product = await makeProduct();
    await fillCart(customer.userId, [{ product, quantity: 2 }]);
    const checkout = await asCustomer(customer.userId, 'post').send({ addressId: customer.addressId });
    const paymentDetails = paymentDetailsFor(checkout.body.data, 'pay_verified');

    const [first, retry] = await Promise.all([
      asCustomer(customer.userId, 'post', `/${checkout.body.data.id}/payment/verify`).send(paymentDetails),
      asCustomer(customer.userId, 'post', `/${checkout.body.data.id}/payment/verify`).send(paymentDetails),
    ]);

    expect(first.status).toBe(200);
    expect(retry.status).toBe(200);
    expect(first.body.data).toMatchObject({
      paymentStatus: 'paid',
      paymentReference: 'pay_verified',
      status: 'placed',
    });
    expect(first.body.data.paidAt).toEqual(expect.any(String));
    const saved = await Order.findById(checkout.body.data.id).lean();
    expect(saved.history.filter(({ event, value }) => event === 'payment' && value === 'paid')).toHaveLength(1);
    expect(saved.history.filter(({ event, value }) => event === 'status' && value === 'confirmed')).toHaveLength(0);
    expect((await Cart.findOne({ user: customer.userId }).lean()).items).toHaveLength(0);
  });

  test('rejects an invalid checkout signature without contacting Razorpay', async () => {
    const customer = await makeCustomer();
    const checkout = await asCustomer(customer.userId, 'post').send({
      addressId: customer.addressId,
      buyNow: { productId: (await makeProduct()).id },
    });
    const details = paymentDetailsFor(checkout.body.data, 'pay_invalid_signature');
    details.razorpay_signature = '0'.repeat(64);
    const callsBefore = globalThis.fetch.mock.calls.length;

    const res = await asCustomer(customer.userId, 'post', `/${checkout.body.data.id}/payment/verify`).send(details);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PAYMENT_SIGNATURE_INVALID');
    expect(globalThis.fetch).toHaveBeenCalledTimes(callsBefore);
  });

  test('accepts signed capture webhooks and ignores duplicate delivery', async () => {
    const customer = await makeCustomer();
    const checkout = await asCustomer(customer.userId, 'post').send({
      addressId: customer.addressId,
      buyNow: { productId: (await makeProduct()).id },
    });
    const payment = {
      id: 'pay_from_webhook',
      order_id: checkout.body.data.checkout.orderId,
      amount: checkout.body.data.total * 100,
      currency: 'INR',
      status: 'captured',
    };
    const event = { event: 'payment.captured', payload: { payment: { entity: payment } } };
    const { rawBody, signature } = signedWebhook(event);

    const sendWebhook = () =>
      request(app)
        .post(api('/payments/webhook'))
        .set('Content-Type', 'application/json')
        .set('x-razorpay-signature', signature)
        .send(rawBody);
    const first = await sendWebhook();
    const retry = await sendWebhook();

    expect(first.status).toBe(200);
    expect(retry.status).toBe(200);
    const saved = await Order.findById(checkout.body.data.id).lean();
    expect(saved.status).toBe('placed');
    expect(saved.paymentStatus).toBe('paid');
    expect(saved.history.filter(({ event, value }) => event === 'payment' && value === 'paid')).toHaveLength(1);
    expect(saved.history.filter(({ event, value }) => event === 'status' && value === 'confirmed')).toHaveLength(0);
    expect(await Cart.findOne({ user: customer.userId }).lean()).toBeNull();
  });

  test('keeps the order placed when Razorpay reports a failed payment', async () => {
    const customer = await makeCustomer();
    const checkout = await asCustomer(customer.userId, 'post').send({
      addressId: customer.addressId,
      buyNow: { productId: (await makeProduct()).id },
    });
    const payment = {
      id: 'pay_failed_webhook',
      order_id: checkout.body.data.checkout.orderId,
      amount: checkout.body.data.total * 100,
      currency: 'INR',
      status: 'failed',
    };
    const { rawBody, signature } = signedWebhook({
      event: 'payment.failed',
      payload: { payment: { entity: payment } },
    });

    const res = await request(app)
      .post(api('/webhooks/razorpay'))
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);
    const saved = await Order.findById(checkout.body.data.id).lean();
    expect(saved.status).toBe('placed');
    expect(saved.paymentStatus).toBe('failed');
  });

  test('accepts order.paid at the configured Razorpay webhook URL', async () => {
    const customer = await makeCustomer();
    const checkout = await asCustomer(customer.userId, 'post').send({
      addressId: customer.addressId,
      buyNow: { productId: (await makeProduct()).id },
    });
    const payment = {
      id: 'pay_order_paid_webhook',
      order_id: checkout.body.data.checkout.orderId,
      amount: checkout.body.data.total * 100,
      currency: 'INR',
      status: 'captured',
    };
    const { rawBody, signature } = signedWebhook({
      event: 'order.paid',
      payload: { payment: { entity: payment } },
    });

    const res = await request(app)
      .post(api('/webhooks/razorpay'))
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', signature)
      .send(rawBody);

    expect(res.status).toBe(200);
    const saved = await Order.findById(checkout.body.data.id).lean();
    expect(saved.status).toBe('placed');
    expect(saved.paymentStatus).toBe('paid');
    expect(saved.paymentReference).toBe(payment.id);
  });

  test('rejects a webhook with an invalid raw-body signature', async () => {
    const res = await request(app)
      .post(api('/payments/webhook'))
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', '0'.repeat(64))
      .send(JSON.stringify({ event: 'payment.captured' }));

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_WEBHOOK_SIGNATURE');
  });
});

describe('guest checkout (no account)', () => {
  const guestAddress = {
    name: 'Guest Shopper',
    phone: '9876501234',
    pincode: '500081',
    line1: 'House 12, Lake Road',
    city: 'Hyderabad',
    state: 'Telangana',
  };
  const asGuest = (path = '') => request(app).post(api(`/orders/guest${path}`));
  const guestCartToken = 'g'.repeat(43);
  const guestCartHash = crypto.createHash('sha256').update(guestCartToken).digest('hex');

  test('Buy Now: saves the address and contact on an order with no user', async () => {
    const product = await makeProduct({ stock: 5 });
    const checkoutKey = crypto.randomUUID();

    const res = await asGuest().send({
      checkoutKey,
      address: guestAddress,
      email: 'Guest@Example.com',
      buyNow: { productId: product.id, quantity: 2 },
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      total: 200,
      paymentStatus: 'pending',
      address: { name: 'Guest Shopper', phone: '+919876501234', city: 'Hyderabad' },
      contact: { phone: '+919876501234', email: 'guest@example.com' },
      checkout: { amount: 20_000, prefill: { name: 'Guest Shopper', contact: '+919876501234' } },
    });
    expect(res.body.data).not.toHaveProperty('checkoutKey');
    expect(res.body.data).not.toHaveProperty('user');
    expect(await stockOf(product)).toBe(3);
    const saved = await Order.findById(res.body.data.id).lean();
    expect(saved.user).toBeUndefined();
  });

  test('orders the guest cart from the cartId cookie and clears it only after payment', async () => {
    const product = await makeProduct();
    await Cart.create({ guestToken: guestCartHash, items: [{ product: product._id, quantity: 3 }] });
    const checkoutKey = crypto.randomUUID();

    const placed = await asGuest()
      .set('Cookie', `cartId=${guestCartToken}`)
      .send({ checkoutKey, address: guestAddress });

    expect(placed.status).toBe(201);
    expect(placed.body.data.items[0]).toMatchObject({ sku: product.sku, quantity: 3 });
    expect(placed.body.data.contact.email).toBeNull();
    expect((await Cart.findOne({ guestToken: guestCartHash }).lean()).items).toHaveLength(1);

    const verified = await asGuest(`/${placed.body.data.id}/payment/verify`).send({
      checkoutKey,
      ...paymentDetailsFor(placed.body.data, 'pay_guest_cart'),
    });

    expect(verified.status).toBe(200);
    expect(verified.body.data).toMatchObject({ paymentStatus: 'paid', paymentReference: 'pay_guest_cart' });
    expect((await Cart.findOne({ guestToken: guestCartHash }).lean()).items).toHaveLength(0);
  });

  test('a guest with no cart cookie and no Buy Now has an empty cart', async () => {
    const res = await asGuest().send({ checkoutKey: crypto.randomUUID(), address: guestAddress });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CART_EMPTY');
  });

  test('verifying needs the same checkoutKey, and never reaches a signed-in customer\'s order', async () => {
    const product = await makeProduct();
    const placed = await asGuest().send({
      checkoutKey: crypto.randomUUID(),
      address: guestAddress,
      buyNow: { productId: product.id },
    });
    const wrongKey = await asGuest(`/${placed.body.data.id}/payment/verify`).send({
      checkoutKey: crypto.randomUUID(),
      ...paymentDetailsFor(placed.body.data, 'pay_wrong_key'),
    });
    expect(wrongKey.status).toBe(404);
    expect(wrongKey.body.code).toBe('ORDER_NOT_FOUND');

    const customer = await makeCustomer();
    const customerKey = crypto.randomUUID();
    const theirs = await asCustomer(customer.userId, 'post').send({
      addressId: customer.addressId,
      checkoutKey: customerKey,
      buyNow: { productId: product.id },
    });
    const asGuestOnTheirs = await asGuest(`/${theirs.body.data.id}/payment/verify`).send({
      checkoutKey: customerKey,
      ...paymentDetailsFor(theirs.body.data, 'pay_not_theirs'),
    });
    expect(asGuestOnTheirs.status).toBe(404);
  });

  test('validates the guest details', async () => {
    const res = await asGuest().send({
      checkoutKey: 'not-a-uuid',
      address: { ...guestAddress, phone: '123', state: 'Atlantis' },
      email: 'nope',
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(await Order.countDocuments()).toBe(0);
  });

  test('the admin sees a guest order with its contact details and no user', async () => {
    const placed = await asGuest().send({
      checkoutKey: crypto.randomUUID(),
      address: guestAddress,
      buyNow: { productId: (await makeProduct()).id },
    });

    const res = await asAdmin('get', `/${placed.body.data.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toBeUndefined();
    expect(res.body.data.address.name).toBe('Guest Shopper');
    expect((await asAdmin('get', '?search=9876501234')).body.meta.total).toBe(1);
  });
});

describe("a customer's own orders", () => {
  test('lists only their orders, newest first, without admin-only history fields', async () => {
    const me = await makeCustomer();
    const other = await makeCustomer();
    const product = await makeProduct();
    const place = ({ userId, addressId }) =>
      asCustomer(userId, 'post').send({ addressId, buyNow: { productId: product.id } });

    const older = await place(me);
    const newer = await place(me);
    await place(other);

    const res = await asCustomer(me.userId, 'get');

    expect(res.status).toBe(200);
    expect(res.body.data.map((order) => order.id)).toEqual([newer.body.data.id, older.body.data.id]);
    expect(res.body.meta).toMatchObject({ page: 1, total: 2 });
    expect(res.body.data[0].history[0]).not.toHaveProperty('by');
  });

  test("another user's order is a 404", async () => {
    const me = await makeCustomer();
    const other = await makeCustomer();
    const product = await makeProduct();
    const theirs = await asCustomer(other.userId, 'post').send({
      addressId: other.addressId,
      buyNow: { productId: product.id },
    });

    const res = await asCustomer(me.userId, 'get', `/${theirs.body.data.id}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ORDER_NOT_FOUND');
  });
});

describe('admin order management', () => {
  async function placeOne({ stock = 20, quantity = 2 } = {}) {
    const customer = await makeCustomer();
    const product = await makeProduct({ stock });
    const res = await asCustomer(customer.userId, 'post').send({
      addressId: customer.addressId,
      buyNow: { productId: product.id, quantity },
    });
    return { order: res.body.data, product, customer };
  }

  test('only admins can reach /admin/orders', async () => {
    const { customer } = await placeOne();

    expect((await request(app).get(api('/admin/orders'))).status).toBe(401);
    const asCustomerRes = await request(app).get(api('/admin/orders')).set('Authorization', bearer(customer.userId));
    expect(asCustomerRes.status).toBe(403);
  });

  test('lists orders filtered by status and searched by order number or phone', async () => {
    const { order } = await placeOne();
    const { order: packedOrder, customer } = await placeOne();
    await verifyPayment(packedOrder, customer.userId, 'pay_admin_filter');
    await asAdmin('patch', `/${packedOrder.id}/status`).send({ status: 'packed' });

    const placed = await asAdmin('get', '?status=placed');
    expect(placed.body.data.map((o) => o.id)).toEqual([order.id]);
    expect(placed.body.data[0]).not.toHaveProperty('history');
    expect((await asAdmin('get', '?status=packed')).body.data.map((o) => o.id)).toEqual([packedOrder.id]);

    const byNumber = await asAdmin('get', `?search=${order.orderNumber.slice(-5)}`);
    expect(byNumber.body.data.map((o) => o.id)).toEqual([order.id]);

    const byPhone = await asAdmin('get', '?search=9876543210');
    expect(byPhone.body.meta.total).toBe(2);
  });

  test('the detail shows the customer and who made each change', async () => {
    const { order, customer } = await placeOne();

    const res = await asAdmin('get', `/${order.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ id: customer.userId, name: expect.any(String) });
    expect(res.body.data.history[0].by).toMatchObject({ id: customer.userId });
  });

  test('moves an order forward one step at a time and records each change', async () => {
    const { order, customer } = await placeOne();
    await verifyPayment(order, customer.userId, 'pay_status_transition');

    for (const status of ['packed', 'shipped', 'delivered']) {
      const res = await asAdmin('patch', `/${order.id}/status`).send({ status, note: `now ${status}` });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(status);
    }

    const saved = await Order.findById(order.id).lean();
    expect(saved.history.map((entry) => entry.value)).toEqual(['placed', 'paid', 'packed', 'shipped', 'delivered']);
    expect(saved.history.at(-1)).toMatchObject({ note: 'now delivered', by: new mongoose.Types.ObjectId(adminId) });
  });

  test('refuses to skip a step, go backwards or leave a final status', async () => {
    const { order } = await placeOne();

    const unpaidPacking = await asAdmin('patch', `/${order.id}/status`).send({ status: 'packed' });
    expect(unpaidPacking.status).toBe(409);
    expect(unpaidPacking.body.code).toBe('PAYMENT_REQUIRED');

    const skip = await asAdmin('patch', `/${order.id}/status`).send({ status: 'shipped' });
    expect(skip.status).toBe(409);
    expect(skip.body.code).toBe('INVALID_STATUS_TRANSITION');

    await Order.updateOne({ _id: order.id }, { status: 'shipped' });
    const back = await asAdmin('patch', `/${order.id}/status`).send({ status: 'packed' });
    expect(back.status).toBe(409);

  });

  test('does not expose the retired manual-payment endpoint', async () => {
    const { order } = await placeOne();

    const res = await asAdmin('patch', `/${order.id}/payment`).send({
      paymentStatus: 'paid',
    });

    expect(res.status).toBe(404);
    expect((await Order.findById(order.id).lean()).paymentStatus).toBe('pending');
  });

  test('refuses removed and unsupported statuses', async () => {
    const { order } = await placeOne();

    expect((await asAdmin('patch', `/${order.id}/status`).send({ status: 'cancelled' })).status).toBe(400);
    expect((await asAdmin('patch', `/${order.id}/status`).send({ status: 'confirmed' })).status).toBe(400);
    expect((await asAdmin('patch', `/${order.id}/status`).send({ status: 'voided' })).status).toBe(400);
  });

  test('the dashboard summary counts orders by status and the unpaid ones', async () => {
    const { order: shipped } = await placeOne();
    const { order: packed } = await placeOne();
    await placeOne();
    await Order.updateOne({ _id: shipped.id }, { status: 'shipped', paymentStatus: 'paid' });
    await Order.updateOne({ _id: packed.id }, { status: 'packed', paymentStatus: 'paid' });

    const res = await request(app).get(api('/admin/summary')).set('Authorization', bearer(adminId, 'admin'));

    expect(res.body.data.orders).toEqual({
      total: 3,
      byStatus: { placed: 1, packed: 1, shipped: 1, delivered: 0 },
      unpaid: 1,
      toPackAndShip: 1,
    });
  });
});
