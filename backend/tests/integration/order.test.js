import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
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
  await Promise.all([
    Address.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
  ]);
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
    expect((await Cart.findOne({ user: userId }).lean()).items).toEqual([]);
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
    await placeOne();
    await Order.updateOne({ _id: order.id }, { status: 'confirmed' });

    const confirmed = await asAdmin('get', '?status=confirmed');
    expect(confirmed.body.data.map((o) => o.id)).toEqual([order.id]);
    expect(confirmed.body.data[0]).not.toHaveProperty('history');

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
    const { order } = await placeOne();

    for (const status of ['confirmed', 'packed', 'shipped', 'delivered']) {
      const res = await asAdmin('patch', `/${order.id}/status`).send({ status, note: `now ${status}` });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(status);
    }

    const saved = await Order.findById(order.id).lean();
    expect(saved.history.map((entry) => entry.value)).toEqual(['placed', 'confirmed', 'packed', 'shipped', 'delivered']);
    expect(saved.history.at(-1)).toMatchObject({ note: 'now delivered', by: new mongoose.Types.ObjectId(adminId) });
  });

  test('refuses to skip a step, go backwards or leave a final status', async () => {
    const { order } = await placeOne();

    const skip = await asAdmin('patch', `/${order.id}/status`).send({ status: 'shipped' });
    expect(skip.status).toBe(409);
    expect(skip.body.code).toBe('INVALID_STATUS_TRANSITION');

    await Order.updateOne({ _id: order.id }, { status: 'shipped' });
    const back = await asAdmin('patch', `/${order.id}/status`).send({ status: 'packed' });
    expect(back.status).toBe(409);

    const voidShipped = await asAdmin('patch', `/${order.id}/status`).send({ status: 'voided' });
    expect(voidShipped.status).toBe(409);
  });

  test('voiding an unpaid order puts its stock back, once', async () => {
    const { order, product } = await placeOne({ stock: 5, quantity: 2 });
    expect(await stockOf(product)).toBe(3);

    const [first, second] = await Promise.all([
      asAdmin('patch', `/${order.id}/status`).send({ status: 'voided', note: 'never paid' }),
      asAdmin('patch', `/${order.id}/status`).send({ status: 'voided' }),
    ]);

    expect([first.status, second.status].sort()).toEqual([200, 409]);
    expect(await stockOf(product)).toBe(5);

    const payment = await asAdmin('patch', `/${order.id}/payment`).send({ paymentStatus: 'paid' });
    expect(payment.status).toBe(409);
    expect(payment.body.code).toBe('ORDER_VOIDED');
  });

  test('a paid order cannot be voided', async () => {
    const { order, product } = await placeOne({ stock: 5, quantity: 2 });
    await asAdmin('patch', `/${order.id}/payment`).send({ paymentStatus: 'paid' });

    const res = await asAdmin('patch', `/${order.id}/status`).send({ status: 'voided' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ORDER_PAID');
    expect(await stockOf(product)).toBe(3);
  });

  test('marks an order paid by hand with a UPI reference', async () => {
    const { order } = await placeOne();

    const res = await asAdmin('patch', `/${order.id}/payment`).send({
      paymentStatus: 'paid',
      reference: 'UPI-427381920011',
      note: 'Seen in the bank app',
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ paymentStatus: 'paid', paymentReference: 'UPI-427381920011' });
    expect(res.body.data.paidAt).toEqual(expect.any(String));
    expect(res.body.data.history.at(-1)).toMatchObject({ event: 'payment', value: 'paid', note: 'Seen in the bank app' });

    // Saying "paid" again records nothing new.
    const again = await asAdmin('patch', `/${order.id}/payment`).send({ paymentStatus: 'paid' });
    expect(again.body.data.history).toHaveLength(res.body.data.history.length);
  });

  test('refuses statuses that do not exist (no cancellations or refunds)', async () => {
    const { order } = await placeOne();

    expect((await asAdmin('patch', `/${order.id}/status`).send({ status: 'cancelled' })).status).toBe(400);
    expect((await asAdmin('patch', `/${order.id}/payment`).send({ paymentStatus: 'refunded' })).status).toBe(400);
  });

  test('the dashboard summary counts orders by status and the unpaid ones', async () => {
    const { order: shipped } = await placeOne();
    const { order: voided } = await placeOne();
    await placeOne();
    await Order.updateOne({ _id: shipped.id }, { status: 'shipped', paymentStatus: 'paid' });
    await Order.updateOne({ _id: voided.id }, { status: 'voided' });

    const res = await request(app).get(api('/admin/summary')).set('Authorization', bearer(adminId, 'admin'));

    expect(res.body.data.orders).toEqual({
      total: 3,
      byStatus: { placed: 1, confirmed: 0, packed: 0, shipped: 1, delivered: 0, voided: 1 },
      unpaid: 1,
    });
  });
});