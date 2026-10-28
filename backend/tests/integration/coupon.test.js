import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

const { default: app } = await import('../../src/app.js');
const { env } = await import('../../src/config/env.js');
const { Coupon } = await import('../../src/modules/coupon/coupon.model.js');
const { couponService, discountFor } = await import('../../src/modules/coupon/coupon.service.js');
const { User } = await import('../../src/modules/user/user.model.js');
const { signAccessToken } = await import('../../src/utils/token.js');

const api = (path) => `${env.API_PREFIX}${path}`;
const adminApi = (path) => api(`/admin${path}`);
const adminId = new mongoose.Types.ObjectId().toString();
const customerId = new mongoose.Types.ObjectId().toString();
const ADMIN = () => `Bearer ${signAccessToken({ sub: adminId, role: 'admin' })}`;
const CUSTOMER = () => `Bearer ${signAccessToken({ sub: customerId, role: 'user' })}`;

const DAY = 24 * 60 * 60 * 1000;

const percentCoupon = (overrides = {}) => ({
  code: 'welcome10',
  description: '10% off, up to ₹100',
  type: 'percent',
  value: 10,
  maxDiscount: 100,
  ...overrides,
});

const createCoupon = (body) => request(app).post(adminApi('/coupons')).set('Authorization', ADMIN()).send(body);

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([Coupon.init(), User.init()]);
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await Promise.all([Coupon.deleteMany({}), User.deleteMany({})]);
  await User.create([
    { _id: adminId, name: 'Coupon Admin', email: 'coupon-admin@example.com', password: 'Secret123', role: 'admin' },
    { _id: customerId, name: 'Coupon Customer', email: 'coupon-customer@example.com', password: 'Secret123' },
  ]);
});

describe('discountFor', () => {
  test('percent rounds down and stops at maxDiscount', () => {
    expect(discountFor({ type: 'percent', value: 10, maxDiscount: null }, 555)).toBe(55);
    expect(discountFor({ type: 'percent', value: 10, maxDiscount: 100 }, 5000)).toBe(100);
  });

  test('flat takes its value off', () => {
    expect(discountFor({ type: 'flat', value: 100 }, 500)).toBe(100);
  });

  test('always leaves at least ₹1 to pay', () => {
    expect(discountFor({ type: 'flat', value: 500 }, 300)).toBe(299);
    expect(discountFor({ type: 'percent', value: 100, maxDiscount: null }, 300)).toBe(299);
  });
});

describe('/admin/coupons', () => {
  test('needs an admin', async () => {
    await request(app).get(adminApi('/coupons')).expect(401);
    await request(app).get(adminApi('/coupons')).set('Authorization', CUSTOMER()).expect(403);
  });

  test('creates a coupon with the code uppercased and usage counters', async () => {
    const res = await createCoupon(percentCoupon()).expect(201);

    expect(res.body.data).toMatchObject({
      code: 'WELCOME10',
      type: 'percent',
      value: 10,
      maxDiscount: 100,
      usedCount: 0,
      paidOrders: 0,
      totalDiscount: 0,
      isActive: true,
      createdBy: { name: 'Coupon Admin' },
    });
  });

  test('refuses a duplicate code, case-insensitively', async () => {
    await createCoupon(percentCoupon()).expect(201);
    const res = await createCoupon(percentCoupon({ code: 'Welcome10' }));
    expect(res.status).toBe(409);
  });

  test.each([
    ['a percentage over 100', { value: 120 }, 'value'],
    ['a cap on a flat coupon', { type: 'flat', value: 50, maxDiscount: 20 }, 'maxDiscount'],
    [
      'an end before the start',
      { startsAt: new Date(Date.now() + 2 * DAY).toISOString(), endsAt: new Date(Date.now() + DAY).toISOString() },
      'endsAt',
    ],
  ])('refuses %s', async (_label, overrides, field) => {
    const res = await createCoupon(percentCoupon(overrides));
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field })]));
  });

  test('refuses a code that is not safe in a link', async () => {
    const res = await createCoupon(percentCoupon({ code: 'TEN OFF!' }));
    expect(res.status).toBe(400);
  });

  test('a PATCH is checked against the merged coupon', async () => {
    const { body } = await createCoupon(percentCoupon()).expect(201);
    const res = await request(app)
      .patch(adminApi(`/coupons/${body.data.id}`))
      .set('Authorization', ADMIN())
      .send({ value: 150 });
    expect(res.status).toBe(400);
  });

  test('switching to flat drops the old cap', async () => {
    const { body } = await createCoupon(percentCoupon()).expect(201);
    const res = await request(app)
      .patch(adminApi(`/coupons/${body.data.id}`))
      .set('Authorization', ADMIN())
      .send({ type: 'flat', value: 50 })
      .expect(200);
    expect(res.body.data).toMatchObject({ type: 'flat', value: 50, maxDiscount: null });
  });

  test('lists with search and the active filter', async () => {
    await createCoupon(percentCoupon()).expect(201);
    await createCoupon({ code: 'DIWALI100', type: 'flat', value: 100, isActive: false }).expect(201);

    const all = await request(app).get(adminApi('/coupons')).set('Authorization', ADMIN()).expect(200);
    expect(all.body.meta.total).toBe(2);

    const active = await request(app)
      .get(adminApi('/coupons?isActive=true'))
      .set('Authorization', ADMIN())
      .expect(200);
    expect(active.body.data.map((c) => c.code)).toEqual(['WELCOME10']);

    const search = await request(app).get(adminApi('/coupons?search=diwali')).set('Authorization', ADMIN()).expect(200);
    expect(search.body.data.map((c) => c.code)).toEqual(['DIWALI100']);
  });

  test('deletes a coupon no order has used', async () => {
    const { body } = await createCoupon(percentCoupon()).expect(201);
    const res = await request(app)
      .delete(adminApi(`/coupons/${body.data.id}`))
      .set('Authorization', ADMIN())
      .expect(200);
    expect(res.body.data).toEqual({ deleted: true });
    expect(await Coupon.countDocuments()).toBe(0);
  });
});

describe('GET /coupons/featured', () => {
  test('is null until a coupon is featured', async () => {
    const res = await request(app).get(api('/coupons/featured')).expect(200);
    expect(res.body.data).toBeNull();
  });

  test('returns the featured coupon, and featuring another moves the flag', async () => {
    await createCoupon(percentCoupon({ isFeatured: true })).expect(201);
    let res = await request(app).get(api('/coupons/featured')).expect(200);
    expect(res.body.data).toMatchObject({ code: 'WELCOME10', type: 'percent', value: 10 });
    expect(res.body.data).not.toHaveProperty('usedCount');

    await createCoupon({ code: 'FLAT50', type: 'flat', value: 50, isFeatured: true }).expect(201);
    res = await request(app).get(api('/coupons/featured')).expect(200);
    expect(res.body.data.code).toBe('FLAT50');
    expect(await Coupon.countDocuments({ isFeatured: true })).toBe(1);
  });

  test('hides a featured coupon that has expired or run out', async () => {
    await createCoupon(percentCoupon({ isFeatured: true, maxUses: 1 })).expect(201);
    await Coupon.updateOne({}, { $set: { usedCount: 1 } });
    expect((await request(app).get(api('/coupons/featured'))).body.data).toBeNull();

    await Coupon.updateOne({}, { $set: { usedCount: 0, endsAt: new Date(Date.now() - DAY) } });
    expect((await request(app).get(api('/coupons/featured'))).body.data).toBeNull();
  });
});

describe('couponService.evaluate / reserve / release', () => {
  const save = (overrides = {}) => Coupon.create({ ...percentCoupon(), ...overrides });
  const codeOf = (promise) => promise.then(
    () => null,
    (error) => error.code
  );

  test('prices a valid code', async () => {
    await save();
    const { coupon, discount } = await couponService.evaluate(' welcome10 ', 500);
    expect(coupon.code).toBe('WELCOME10');
    expect(discount).toBe(50);
  });

  test('refuses an unknown or switched-off code with the same answer', async () => {
    await save({ isActive: false });
    expect(await codeOf(couponService.evaluate('WELCOME10', 500))).toBe('COUPON_INVALID');
    expect(await codeOf(couponService.evaluate('NOPE', 500))).toBe('COUPON_INVALID');
  });

  test('checks the dates and the minimum order', async () => {
    await save({ startsAt: new Date(Date.now() + DAY) });
    expect(await codeOf(couponService.evaluate('WELCOME10', 500))).toBe('COUPON_NOT_STARTED');

    await Coupon.updateOne({}, { $set: { startsAt: null, endsAt: new Date(Date.now() - DAY) } });
    expect(await codeOf(couponService.evaluate('WELCOME10', 500))).toBe('COUPON_EXPIRED');

    await Coupon.updateOne({}, { $set: { endsAt: null, minOrderValue: 600 } });
    const error = await couponService.evaluate('WELCOME10', 500).catch((e) => e);
    expect(error.code).toBe('COUPON_MIN_ORDER');
    expect(error.message).toContain('₹100 more');
  });

  test('reserve takes the last use only once', async () => {
    const coupon = await save({ maxUses: 1 });

    const results = await Promise.allSettled([couponService.reserve(coupon._id), couponService.reserve(coupon._id)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((r) => r.status === 'rejected').reason.code).toBe('COUPON_USAGE_LIMIT');
    expect(await codeOf(couponService.evaluate('WELCOME10', 500))).toBe('COUPON_USAGE_LIMIT');

    await couponService.release(coupon._id);
    expect((await Coupon.findById(coupon._id)).usedCount).toBe(0);
    await couponService.release(coupon._id);
    expect((await Coupon.findById(coupon._id)).usedCount).toBe(0);
  });
});