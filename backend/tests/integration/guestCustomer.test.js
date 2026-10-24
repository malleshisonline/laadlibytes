import crypto from 'node:crypto';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

// OTP codes are captured here instead of being sent. Mocks must be registered before the app is imported.
const outbox = [];
const capture = (to, text) => outbox.push({ to, code: String(text).match(/\b\d{6}\b/)[0] });

jest.unstable_mockModule('../../src/integrations/sms/index.js', () => {
  const sendOtpSms = jest.fn(async ({ to, code }) => capture(to, code));
  return { sendOtpSms, default: sendOtpSms };
});
jest.unstable_mockModule('../../src/integrations/email/index.js', () => {
  const sendEmail = jest.fn(async ({ to, text }) => capture(to, text));
  return { sendEmail, default: sendEmail };
});

const { default: app } = await import('../../src/app.js');
const { env } = await import('../../src/config/env.js');
const { Address } = await import('../../src/modules/address/address.model.js');
const { Order } = await import('../../src/modules/order/order.model.js');
const { OtpChallenge } = await import('../../src/modules/otp/otp.model.js');
const { Product } = await import('../../src/modules/product/product.model.js');
const { User } = await import('../../src/modules/user/user.model.js');
const { signAccessToken } = await import('../../src/utils/token.js');

const api = (path) => `${env.API_PREFIX}${path}`;
const adminId = new mongoose.Types.ObjectId().toString();
const asAdmin = (method, path) =>
  request(app)[method](api(`/admin${path}`)).set('Authorization', `Bearer ${signAccessToken({ sub: adminId, role: 'admin' })}`);

const GUEST_PHONE = '+919876501234';
const guestAddress = {
  name: 'Guest Shopper',
  phone: '9876501234',
  pincode: '500081',
  line1: 'House 12, Lake Road',
  city: 'Hyderabad',
  state: 'Telangana',
};

let productSeq = 0;
const makeProduct = () => {
  productSeq += 1;
  return Product.create({
    name: `Guest Chikki ${productSeq}`,
    sku: `GUEST-${productSeq}`,
    category: new mongoose.Types.ObjectId(),
    mrp: 120,
    price: 100,
    packSize: { value: 100, unit: 'g' },
    images: [{ url: 'https://example.com/a.png', publicId: `guest/${productSeq}` }],
    stock: 20,
  });
};

/** A Buy Now guest order; `overrides` replaces parts of the request body. */
async function placeGuestOrder(overrides = {}) {
  const product = await makeProduct();
  return request(app)
    .post(api('/orders/guest'))
    .send({ checkoutKey: crypto.randomUUID(), address: guestAddress, buyNow: { productId: product.id }, ...overrides });
}

async function signUp(identifier) {
  const started = await request(app)
    .post(api('/auth/register'))
    .send({ identifier, name: 'Renu Yadav', password: 'Secret123', confirmPassword: 'Secret123' });
  expect(started.status).toBe(200);
  return request(app)
    .post(api('/auth/otp/verify'))
    .send({ verificationId: started.body.data.verificationId, otp: outbox.at(-1).code });
}

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([Address.init(), Order.init(), OtpChallenge.init(), Product.init(), User.init()]);
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  outbox.length = 0;
  // Razorpay's order API, answered locally.
  jest.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
    if (!String(url).endsWith('/orders')) throw new Error(`Unexpected mocked Razorpay request: ${url}`);
    const { amount, currency, receipt } = JSON.parse(options.body);
    return new Response(JSON.stringify({ id: `order_${receipt}`, amount, currency, receipt }), { status: 200 });
  });
  await Promise.all([
    Address.deleteMany({}),
    Order.deleteMany({}),
    OtpChallenge.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
  ]);
  await User.create({ _id: adminId, name: 'Admin', email: 'admin@example.com', password: 'Secret123', role: 'admin' });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('guest checkout saves a guest customer', () => {
  test('creates the guest customer with the address and links the order', async () => {
    const res = await placeGuestOrder({ email: 'Guest@Example.com' });

    expect(res.status).toBe(201);
    expect(res.body.data).not.toHaveProperty('guestCustomer');

    const guest = await User.findOne({ phone: GUEST_PHONE }).lean();
    expect(guest).toMatchObject({ name: 'Guest Shopper', email: 'guest@example.com', isGuest: true });
    expect(guest.password).toBeUndefined();

    const order = await Order.findById(res.body.data.id).lean();
    expect(order.user).toBeUndefined();
    expect(order.guestCustomer).toEqual(guest._id);

    const addresses = await Address.find({ user: guest._id }).lean();
    expect(addresses).toHaveLength(1);
    expect(addresses[0]).toMatchObject({ line1: 'House 12, Lake Road', phone: GUEST_PHONE, isDefault: true });
  });

  test('a second order reuses the guest customer and does not save the same address twice', async () => {
    await placeGuestOrder();
    await placeGuestOrder({ email: 'later@example.com' });
    await placeGuestOrder({ address: { ...guestAddress, line1: 'Office 3, Hitech City' } });

    const guests = await User.find({ phone: GUEST_PHONE }).lean();
    expect(guests).toHaveLength(1);
    // The email arrived with the second order, and fills the empty field.
    expect(guests[0].email).toBe('later@example.com');
    expect(await Address.countDocuments({ user: guests[0]._id })).toBe(2);
    expect(await Order.countDocuments({ guestCustomer: guests[0]._id })).toBe(3);
  });

  test("leaves a registered account alone when the guest uses that account's phone", async () => {
    const owner = await User.create({ name: 'Owner', phone: GUEST_PHONE, password: 'Secret123' });

    const res = await placeGuestOrder();

    expect(res.status).toBe(201);
    const order = await Order.findById(res.body.data.id).lean();
    expect(order.user).toBeUndefined();
    expect(order.guestCustomer).toBeUndefined();
    expect(await Address.countDocuments({ user: owner._id })).toBe(0);
    expect(await User.countDocuments({ phone: GUEST_PHONE })).toBe(1);
  });

  test('the admin lists guest customers apart and cannot make one an admin', async () => {
    await placeGuestOrder();
    await User.create({ name: 'Registered', email: 'registered@example.com', password: 'Secret123' });

    const guests = await asAdmin('get', '/users?accountType=guest');
    expect(guests.status).toBe(200);
    expect(guests.body.data.map((user) => user.name)).toEqual(['Guest Shopper']);

    const registered = await asAdmin('get', '/users?accountType=registered');
    expect(registered.body.data.map((user) => user.name).sort()).toEqual(['Admin', 'Registered']);

    const guestId = guests.body.data[0]._id;
    const promote = await asAdmin('patch', `/users/${guestId}`).send({ role: 'admin' });
    expect(promote.status).toBe(400);
    expect(promote.body.code).toBe('GUEST_CANNOT_BE_ADMIN');
  });
});

describe('a guest customer is not an account', () => {
  test('identify reports no account, and neither password nor OTP sign-in works', async () => {
    await placeGuestOrder();

    const identify = await request(app).post(api('/auth/identify')).send({ identifier: GUEST_PHONE });
    expect(identify.body.data.exists).toBe(false);

    const login = await request(app).post(api('/auth/login')).send({ identifier: GUEST_PHONE, password: 'anything1' });
    expect(login.status).toBe(401);

    const otp = await request(app).post(api('/auth/login/otp')).send({ identifier: GUEST_PHONE });
    expect(otp.status).toBe(404);
    expect(outbox).toHaveLength(0);
  });

  test('signing up with the phone turns it into the account, with its orders and addresses', async () => {
    const placed = await placeGuestOrder({ email: 'someone-else@example.com' });
    // Only a paid order is listed under My Orders.
    await Order.updateOne({ _id: placed.body.data.id }, { paymentStatus: 'paid' });
    const guest = await User.findOne({ phone: GUEST_PHONE }).lean();

    const res = await signUp(GUEST_PHONE);

    expect(res.status).toBe(201);
    expect(res.body.data.user.id).toBe(guest._id.toString());

    const account = await User.findById(guest._id).lean();
    expect(account).toMatchObject({ name: 'Renu Yadav', isGuest: false });
    expect(account.phoneVerifiedAt).toBeInstanceOf(Date);
    // The email was typed at checkout and never proven, so it is not kept as a way into the account.
    expect(account.email).toBeUndefined();

    const order = await Order.findById(placed.body.data.id).lean();
    expect(order.user).toEqual(guest._id);
    expect(order.guestCustomer).toBeUndefined();

    const mine = await request(app)
      .get(api('/orders'))
      .set('Authorization', `Bearer ${res.body.data.accessToken}`);
    expect(mine.body.data.map((item) => item.id)).toEqual([placed.body.data.id]);
    expect(await Address.countDocuments({ user: guest._id })).toBe(1);
  });
});