import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

const { default: app } = await import('../../src/app.js');
const { env } = await import('../../src/config/env.js');
const { User } = await import('../../src/modules/user/user.model.js');

const PASSWORD = 'Secret123';
const NEW_PASSWORD = 'Fresher456';
const EMAIL = 'renu@example.com';

const api = (path) => `${env.API_PREFIX}${path}`;
const refreshCookie = (res) => res.headers['set-cookie']?.find((c) => c.startsWith('refreshToken='))?.split(';')[0];

const makeUser = () => User.create({ name: 'Renu Yadav', email: EMAIL, password: PASSWORD });

/** Signs in with a password, like one browser would: returns its access token and refresh cookie. */
async function signIn(password = PASSWORD) {
  const res = await request(app).post(api('/auth/login')).send({ identifier: EMAIL, password });
  expect(res.status).toBe(200);
  return { accessToken: res.body.data.accessToken, cookie: refreshCookie(res) };
}

const refresh = (cookie) => request(app).post(api('/auth/refresh')).set('Cookie', cookie).send({});

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await User.init();
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('PATCH /users/me', () => {
  test('updates the name and returns the profile without secrets', async () => {
    await makeUser();
    const { accessToken } = await signIn();

    const res = await request(app)
      .patch(api('/users/me'))
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: '  Renu Y  ' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Renu Y', email: EMAIL });
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.refreshTokens).toBeUndefined();
  });

  test('rejects a one-letter name', async () => {
    await makeUser();
    const { accessToken } = await signIn();

    const res = await request(app).patch(api('/users/me')).set('Authorization', `Bearer ${accessToken}`).send({ name: 'R' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'body.name' })]));
  });

  test('ignores fields a user may not change, such as role', async () => {
    const user = await makeUser();
    const { accessToken } = await signIn();

    await request(app)
      .patch(api('/users/me'))
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Renu', role: 'admin', isActive: false });

    const stored = await User.findById(user.id);
    expect(stored.role).toBe('user');
    expect(stored.isActive).toBe(true);
  });
});

describe('POST /users/me/password', () => {
  const changePassword = (accessToken, cookie, body) => {
    const req = request(app).post(api('/users/me/password')).set('Authorization', `Bearer ${accessToken}`);
    if (cookie) req.set('Cookie', cookie);
    return req.send(body);
  };

  test('a wrong current password is a 400, not a 401, and changes nothing', async () => {
    await makeUser();
    const { accessToken, cookie } = await signIn();

    const res = await changePassword(accessToken, cookie, {
      currentPassword: 'Wrong1234',
      newPassword: NEW_PASSWORD,
      confirmPassword: NEW_PASSWORD,
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_CURRENT_PASSWORD');
    expect((await refresh(cookie)).status).toBe(200);
  });

  test('validates the new password', async () => {
    await makeUser();
    const { accessToken, cookie } = await signIn();

    const weak = await changePassword(accessToken, cookie, {
      currentPassword: PASSWORD,
      newPassword: 'weak',
      confirmPassword: 'weak',
    });
    expect(weak.status).toBe(400);

    const mismatch = await changePassword(accessToken, cookie, {
      currentPassword: PASSWORD,
      newPassword: NEW_PASSWORD,
      confirmPassword: 'Other4567',
    });
    expect(mismatch.status).toBe(400);
    expect(mismatch.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'body.confirmPassword' })])
    );

    const same = await changePassword(accessToken, cookie, {
      currentPassword: PASSWORD,
      newPassword: PASSWORD,
      confirmPassword: PASSWORD,
    });
    expect(same.status).toBe(400);
  });

  test('changes the password, keeps this device signed in and signs out the others', async () => {
    await makeUser();
    const thisDevice = await signIn();
    const otherDevice = await signIn();

    const res = await changePassword(thisDevice.accessToken, thisDevice.cookie, {
      currentPassword: PASSWORD,
      newPassword: NEW_PASSWORD,
      confirmPassword: NEW_PASSWORD,
    });
    expect(res.status).toBe(200);

    expect((await refresh(thisDevice.cookie)).status).toBe(200);
    expect((await refresh(otherDevice.cookie)).status).toBe(401);

    const oldLogin = await request(app).post(api('/auth/login')).send({ identifier: EMAIL, password: PASSWORD });
    expect(oldLogin.status).toBe(401);
    await signIn(NEW_PASSWORD);
  });

  test('with no refresh cookie, every session is signed out', async () => {
    await makeUser();
    const { accessToken, cookie } = await signIn();

    const res = await changePassword(accessToken, null, {
      currentPassword: PASSWORD,
      newPassword: NEW_PASSWORD,
      confirmPassword: NEW_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect((await refresh(cookie)).status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  // Two sign-ins in the same second used to get identical refresh tokens, so logging one out
  // logged out both. The jwtid in signRefreshToken keeps them apart.
  test('signs out only this device, even when both signed in within the same second', async () => {
    await makeUser();
    const first = await signIn();
    const second = await signIn();
    expect(first.cookie).not.toBe(second.cookie);

    const res = await request(app)
      .post(api('/auth/logout'))
      .set('Authorization', `Bearer ${first.accessToken}`)
      .set('Cookie', first.cookie);

    expect(res.status).toBe(200);
    expect((await refresh(first.cookie)).status).toBe(401);
    expect((await refresh(second.cookie)).status).toBe(200);
  });
});

describe('guards', () => {
  test.each([
    ['patch', '/users/me'],
    ['post', '/users/me/password'],
  ])('%s %s without a token is 401', async (method, path) => {
    const res = await request(app)[method](api(path)).send({});
    expect(res.status).toBe(401);
  });
});