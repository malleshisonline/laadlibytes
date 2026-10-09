import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

const { default: app } = await import('../../src/app.js');
const { env } = await import('../../src/config/env.js');
const { Cart } = await import('../../src/modules/cart/cart.model.js');
const { Product } = await import('../../src/modules/product/product.model.js');
const { User } = await import('../../src/modules/user/user.model.js');
const { signAccessToken } = await import('../../src/utils/token.js');

const PASSWORD = 'Secret123';

const api = (path) => `${env.API_PREFIX}${path}`;
const cartCookie = (res) => res.headers['set-cookie']?.find((cookie) => cookie.startsWith('cartId='))?.split(';')[0];
const bearer = (userId) => `Bearer ${signAccessToken({ sub: userId, role: 'user' })}`;

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
    images: [{ url: 'https://example.com/a.png', publicId: `test/${productSeq}` }],
    stock: 20,
    ...overrides,
  });
};

/** Sends a cart request as a guest (optionally with a cookie) or as a signed-in user. */
const cartRequest = (method, path, { cookie, userId } = {}) => {
  const req = request(app)[method](api(`/cart${path}`));
  if (cookie) req.set('Cookie', cookie);
  if (userId) req.set('Authorization', bearer(userId));
  return req;
};

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([Cart.init(), Product.init(), User.init()]);
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await Promise.all([Cart.deleteMany({}), Product.deleteMany({}), User.deleteMany({})]);
});

describe('guest cart', () => {
  test('a guest with no cookie has an empty cart and gets no cookie from a read', async () => {
    const res = await cartRequest('get', '');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ items: [], itemCount: 0, subtotal: 0, mrpTotal: 0, savings: 0 });
    expect(cartCookie(res)).toBeUndefined();
    expect(await Cart.countDocuments()).toBe(0);
  });

  test('the first add sets a cookie; later adds reuse the same cart and sum quantities', async () => {
    const product = await makeProduct();

    const first = await cartRequest('post', '/items').send({ productId: product.id, quantity: 2 });
    expect(first.status).toBe(200);
    const cookie = cartCookie(first);
    expect(cookie).toMatch(/^cartId=[A-Za-z0-9_-]{43}$/);

    const second = await cartRequest('post', '/items', { cookie }).send({ productId: product.id });
    expect(second.status).toBe(200);
    expect(second.body.data).toMatchObject({ itemCount: 3, subtotal: 300, mrpTotal: 360, savings: 60 });
    expect(second.body.data.items[0]).toMatchObject({
      product: { id: product.id, name: product.name, price: 100, stock: 20 },
      quantity: 3,
      maxQuantity: 10,
      lineTotal: 300,
      issue: null,
    });

    const carts = await Cart.find().select('+guestToken').lean();
    expect(carts).toHaveLength(1);
    // Only the hash is stored, never the cookie value.
    expect(cookie).not.toContain(carts[0].guestToken);
    expect(carts[0].expiresAt).toBeInstanceOf(Date);
  });

  test('two guests never see each other’s carts', async () => {
    const product = await makeProduct();
    const a = cartCookie(await cartRequest('post', '/items').send({ productId: product.id }));
    const b = cartCookie(await cartRequest('post', '/items').send({ productId: product.id, quantity: 4 }));

    expect(a).not.toBe(b);
    expect((await cartRequest('get', '', { cookie: a })).body.data.itemCount).toBe(1);
    expect((await cartRequest('get', '', { cookie: b })).body.data.itemCount).toBe(4);
  });

  test('a malformed cookie is treated as no cart', async () => {
    const res = await cartRequest('get', '', { cookie: 'cartId=not-a-real-token' });
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });
});

describe('limits and validation', () => {
  test('refuses more than the stock, and more than 10 of one item', async () => {
    const scarce = await makeProduct({ stock: 3 });
    const plenty = await makeProduct({ stock: 50 });

    const overStock = await cartRequest('post', '/items').send({ productId: scarce.id, quantity: 4 });
    expect(overStock.status).toBe(409);
    expect(overStock.body.code).toBe('INSUFFICIENT_STOCK');
    expect(overStock.body.message).toBe('Only 3 left in stock');

    const cookie = cartCookie(await cartRequest('post', '/items').send({ productId: plenty.id, quantity: 8 }));
    const overLimit = await cartRequest('post', '/items', { cookie }).send({ productId: plenty.id, quantity: 3 });
    expect(overLimit.status).toBe(409);
    expect(overLimit.body.code).toBe('CART_LIMIT');
  });

  test('404s an unpublished or unknown product', async () => {
    const hidden = await makeProduct({ isActive: false });

    const res = await cartRequest('post', '/items').send({ productId: hidden.id });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('PRODUCT_NOT_FOUND');

    const unknown = await cartRequest('post', '/items').send({ productId: new mongoose.Types.ObjectId().toString() });
    expect(unknown.status).toBe(404);
  });

  test('rejects a bad product id or quantity', async () => {
    const res = await cartRequest('post', '/items').send({ productId: 'nope', quantity: 0 });

    expect(res.status).toBe(400);
    expect(res.body.errors.map((e) => e.field)).toEqual(
      expect.arrayContaining(['body.productId', 'body.quantity'])
    );
  });
});

describe('changing the cart', () => {
  test('PATCH sets the quantity, DELETE removes a line, DELETE /cart empties it', async () => {
    const one = await makeProduct();
    const two = await makeProduct();
    const cookie = cartCookie(await cartRequest('post', '/items').send({ productId: one.id }));
    await cartRequest('post', '/items', { cookie }).send({ productId: two.id });

    const patched = await cartRequest('patch', `/items/${one.id}`, { cookie }).send({ quantity: 5 });
    expect(patched.status).toBe(200);
    expect(patched.body.data.itemCount).toBe(6);

    const removed = await cartRequest('delete', `/items/${two.id}`, { cookie });
    expect(removed.body.data.items.map((i) => i.product.id)).toEqual([one.id]);

    const cleared = await cartRequest('delete', '', { cookie });
    expect(cleared.body.data.items).toEqual([]);
    expect((await cartRequest('get', '', { cookie })).body.data.itemCount).toBe(0);
  });

  test('PATCH 404s a product that is not in the cart', async () => {
    const product = await makeProduct();
    const user = await User.create({ name: 'Cart User', email: 'cart-patch@example.com', password: PASSWORD });
    const res = await cartRequest('patch', `/items/${product.id}`, { userId: user.id }).send({ quantity: 2 });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CART_ITEM_NOT_FOUND');
  });

  test('drops unpublished products on read and flags lines above the stock', async () => {
    const hidden = await makeProduct();
    const shrinking = await makeProduct({ stock: 10 });
    const cookie = cartCookie(await cartRequest('post', '/items').send({ productId: hidden.id }));
    await cartRequest('post', '/items', { cookie }).send({ productId: shrinking.id, quantity: 5 });

    await Product.updateOne({ _id: hidden.id }, { isActive: false });
    await Product.updateOne({ _id: shrinking.id }, { stock: 2 });

    const res = await cartRequest('get', '', { cookie });
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0]).toMatchObject({ quantity: 5, maxQuantity: 2, issue: 'INSUFFICIENT_STOCK' });
    expect((await Cart.findOne().lean()).items).toHaveLength(1);
  });
});

describe('signed-in cart', () => {
  test('a user gets their own cart and no guest cookie', async () => {
    const product = await makeProduct();
    const user = await User.create({ name: 'Cart User', email: 'signed-in@example.com', password: PASSWORD });

    const res = await cartRequest('post', '/items', { userId: user.id }).send({ productId: product.id });
    expect(res.status).toBe(200);
    expect(cartCookie(res)).toBeUndefined();

    const cart = await Cart.findOne().lean();
    expect(String(cart.user)).toBe(user.id);
    expect(cart.expiresAt).toBeUndefined();
  });

  test('an expired or forged token is a 401, not a silent fall-back to the guest cart', async () => {
    const res = await request(app).get(api('/cart')).set('Authorization', 'Bearer not.a.jwt');
    expect(res.status).toBe(401);
  });
});

describe('merge on sign-in', () => {
  test('login moves the guest cart into the account cart, capped at stock, and clears the cookie', async () => {
    const shared = await makeProduct({ stock: 6 });
    const guestOnly = await makeProduct();
    const user = await User.create({ name: 'Cart User', email: 'cart@example.com', password: PASSWORD });

    await cartRequest('post', '/items', { userId: user.id }).send({ productId: shared.id, quantity: 4 });

    const cookie = cartCookie(await cartRequest('post', '/items').send({ productId: shared.id, quantity: 5 }));
    await cartRequest('post', '/items', { cookie }).send({ productId: guestOnly.id, quantity: 2 });

    const login = await request(app)
      .post(api('/auth/login'))
      .set('Cookie', cookie)
      .send({ identifier: 'cart@example.com', password: PASSWORD });

    expect(login.status).toBe(200);
    expect(login.headers['set-cookie'].some((c) => /^cartId=;/.test(c))).toBe(true);

    const cart = await cartRequest('get', '', { userId: user.id });
    const quantities = Object.fromEntries(cart.body.data.items.map((i) => [i.product.id, i.quantity]));
    expect(quantities).toEqual({ [shared.id]: 6, [guestOnly.id]: 2 });
    expect(await Cart.countDocuments()).toBe(1);
  });

  test('login without a guest cart leaves the account cart alone', async () => {
    await User.create({ name: 'Cart User', email: 'cart@example.com', password: PASSWORD });

    const login = await request(app).post(api('/auth/login')).send({ identifier: 'cart@example.com', password: PASSWORD });

    expect(login.status).toBe(200);
    expect(await Cart.countDocuments()).toBe(0);
  });
});