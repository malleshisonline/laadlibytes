import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

const { default: app } = await import('../../src/app.js');
const { env } = await import('../../src/config/env.js');
const { Address, MAX_ADDRESSES } = await import('../../src/modules/address/address.model.js');
const { signAccessToken } = await import('../../src/utils/token.js');

const api = (path) => `${env.API_PREFIX}${path}`;
const bearer = (userId) => `Bearer ${signAccessToken({ sub: userId, role: 'user' })}`;

const userA = new mongoose.Types.ObjectId().toString();
const userB = new mongoose.Types.ObjectId().toString();

const VALID_ADDRESS = {
  name: 'Renu Yadav',
  phone: '98765 43210',
  pincode: '500081',
  line1: 'Flat 4B, Sunrise Apartments, Road No. 12',
  landmark: 'Near Inorbit Mall',
  city: 'Hyderabad',
  state: 'Telangana',
};

const asUser = (userId, method, path = '') =>
  request(app)[method](api(`/addresses${path}`)).set('Authorization', bearer(userId));

const createAddress = (userId, overrides = {}) =>
  asUser(userId, 'post').send({ ...VALID_ADDRESS, ...overrides });

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Address.init();
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await Address.deleteMany({});
});

describe('create and list', () => {
  test('the first address is saved as the default with the phone in E.164', async () => {
    const res = await createAddress(userA);

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ ...VALID_ADDRESS, phone: '+919876543210', isDefault: true });
    expect(res.body.data[0].id).toBeDefined();
    expect(res.body.data[0].user).toBeUndefined();
  });

  test('a later address is not the default unless asked, and the list puts the default first', async () => {
    await createAddress(userA, { city: 'First' });
    const second = await createAddress(userA, { city: 'Second' });

    expect(second.body.data.map((a) => [a.city, a.isDefault])).toEqual([
      ['First', true],
      ['Second', false],
    ]);

    const third = await createAddress(userA, { city: 'Third', isDefault: true });
    expect(third.body.data.map((a) => [a.city, a.isDefault])).toEqual([
      ['Third', true],
      ['Second', false],
      ['First', false],
    ]);

    const list = await asUser(userA, 'get');
    expect(list.status).toBe(200);
    expect(list.body.data.map((a) => a.city)).toEqual(['Third', 'Second', 'First']);
  });

  test(`refuses more than ${MAX_ADDRESSES} addresses`, async () => {
    for (let i = 0; i < MAX_ADDRESSES; i += 1) {
      expect((await createAddress(userA)).status).toBe(201);
    }

    const res = await createAddress(userA);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ADDRESS_LIMIT');
    expect(await Address.countDocuments({ user: userA })).toBe(MAX_ADDRESSES);
  });

  test.each([
    ['pincode', { pincode: '012345' }],
    ['pincode', { pincode: '5000' }],
    ['phone', { phone: '12345' }],
    ['phone', { phone: 'renu@example.com' }],
    ['state', { state: 'Atlantis' }],
    ['line1', { line1: '' }],
    ['name', { name: undefined }],
  ])('rejects an invalid %s', async (field, overrides) => {
    const res = await createAddress(userA, overrides);

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field: `body.${field}` })]));
  });
});

describe('update, delete and default', () => {
  test('updates only the fields sent', async () => {
    const created = await createAddress(userA);
    const { id } = created.body.data[0];

    const res = await asUser(userA, 'patch', `/${id}`).send({ city: 'Secunderabad', landmark: '' });

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toMatchObject({ city: 'Secunderabad', landmark: '', pincode: VALID_ADDRESS.pincode });
  });

  test('cannot change the default through PATCH', async () => {
    await createAddress(userA);
    const second = await createAddress(userA);
    const { id } = second.body.data[1];

    const res = await asUser(userA, 'patch', `/${id}`).send({ isDefault: true });
    expect(res.status).toBe(400); // isDefault is stripped, leaving no fields
  });

  test('setting a default unsets the previous one', async () => {
    await createAddress(userA, { city: 'First' });
    const second = await createAddress(userA, { city: 'Second' });
    const secondId = second.body.data.find((a) => a.city === 'Second').id;

    const res = await asUser(userA, 'post', `/${secondId}/default`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((a) => [a.city, a.isDefault])).toEqual([
      ['Second', true],
      ['First', false],
    ]);
  });

  test('deleting the default promotes the newest remaining address', async () => {
    const first = await createAddress(userA, { city: 'First' });
    await createAddress(userA, { city: 'Second' });
    await createAddress(userA, { city: 'Third' });

    const res = await asUser(userA, 'delete', `/${first.body.data[0].id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((a) => [a.city, a.isDefault])).toEqual([
      ['Third', true],
      ['Second', false],
    ]);
  });

  test('deleting the last address leaves an empty list', async () => {
    const created = await createAddress(userA);

    const res = await asUser(userA, 'delete', `/${created.body.data[0].id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('a malformed id is a 400', async () => {
    const res = await asUser(userA, 'delete', '/not-an-id');
    expect(res.status).toBe(400);
  });
});

describe('ownership', () => {
  test("another user's address is a 404 for every action, and is left untouched", async () => {
    const created = await createAddress(userA);
    const { id } = created.body.data[0];

    const list = await asUser(userB, 'get');
    expect(list.body.data).toEqual([]);

    const attempts = [
      asUser(userB, 'patch', `/${id}`).send({ city: 'Stolen' }),
      asUser(userB, 'delete', `/${id}`),
      asUser(userB, 'post', `/${id}/default`),
    ];
    for (const res of await Promise.all(attempts)) {
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('ADDRESS_NOT_FOUND');
    }

    const stored = await Address.findById(id);
    expect(stored.city).toBe(VALID_ADDRESS.city);
    expect(stored.isDefault).toBe(true);
  });

  test('every route needs a token', async () => {
    const res = await request(app).get(api('/addresses'));
    expect(res.status).toBe(401);
  });
});