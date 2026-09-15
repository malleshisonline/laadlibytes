import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

// Codes are captured here instead of being sent. Mocks must be registered before the app is imported.
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
const { OtpChallenge } = await import('../../src/modules/otp/otp.model.js');
const { User } = await import('../../src/modules/user/user.model.js');

const PASSWORD = 'Secret123';

const api = (path) => `${env.API_PREFIX}/auth${path}`;
const lastCode = () => outbox.at(-1).code;
const refreshCookie = (res) => res.headers['set-cookie']?.find((cookie) => cookie.startsWith('refreshToken='));

const identify = (identifier) => request(app).post(api('/identify')).send({ identifier });
const register = (identifier, overrides = {}) =>
  request(app)
    .post(api('/register'))
    .send({ identifier, name: 'Test User', password: PASSWORD, confirmPassword: PASSWORD, ...overrides });
const requestLoginOtp = (identifier) => request(app).post(api('/login/otp')).send({ identifier });
const verify = (verificationId, otp) => request(app).post(api('/otp/verify')).send({ verificationId, otp });
const resend = (verificationId) => request(app).post(api('/otp/resend')).send({ verificationId });

async function signUp(identifier) {
  const started = await register(identifier);
  return verify(started.body.data.verificationId, lastCode());
}

/** Moves a challenge's last send back past the resend cooldown. */
const skipCooldown = (identifier, purpose) =>
  OtpChallenge.updateOne({ identifier, purpose }, { $set: { lastSentAt: new Date(Date.now() - 61_000) } });

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.init(), OtpChallenge.init()]);
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  outbox.length = 0;
  await Promise.all([User.deleteMany({}), OtpChallenge.deleteMany({})]);
});

describe('POST /auth/identify', () => {
  test('reports an unknown phone number and returns it normalized', async () => {
    const res = await identify('98765 43210');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ channel: 'phone', identifier: '+919876543210', exists: false });
  });

  test('rejects input that is neither an email nor a phone number', async () => {
    const res = await identify('not-an-identifier');

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('sign-up with OTP', () => {
  test('creates a phone account only after the code is verified', async () => {
    const started = await register('98765 43210');

    expect(started.status).toBe(200);
    expect(started.body.data).toMatchObject({
      purpose: 'register',
      channel: 'phone',
      destination: '+91******3210',
      expiresInSeconds: 600,
      resendAfterSeconds: 60,
    });
    expect(started.body.data.verificationId).toHaveLength(43);
    expect(outbox).toHaveLength(1);
    expect(outbox[0].to).toBe('+919876543210');
    expect(await User.countDocuments()).toBe(0);

    const verified = await verify(started.body.data.verificationId, lastCode());

    expect(verified.status).toBe(201);
    expect(typeof verified.body.data.accessToken).toBe('string');
    expect(verified.body.data.user).toMatchObject({ name: 'Test User', phone: '+919876543210' });
    expect(verified.body.data.user.phoneVerifiedAt).toBeTruthy();
    expect(verified.body.data.user.password).toBeUndefined();
    expect(refreshCookie(verified)).toBeDefined();
    expect(await OtpChallenge.countDocuments()).toBe(0);

    const lookup = await identify('+919876543210');
    expect(lookup.body.data.exists).toBe(true);
  });

  test('allows several phone-only users alongside email users', async () => {
    expect((await signUp('9876543210')).status).toBe(201);
    expect((await signUp('9876543211')).status).toBe(201);
    expect((await signUp('someone@example.com')).status).toBe(201);
    expect(await User.countDocuments()).toBe(3);
  });

  test('rejects mismatched passwords without sending a code', async () => {
    const res = await register('9876543210', { confirmPassword: 'Different123' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(outbox).toHaveLength(0);
  });

  test('refuses to start sign-up for an identifier that already has an account', async () => {
    await signUp('renu@example.com');

    const res = await register('Renu@Example.com');

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ACCOUNT_EXISTS');
  });

  test('a resubmitted sign-up cannot be completed through the earlier verificationId', async () => {
    const first = await register('9876543210');

    const tooSoon = await register('9876543210');
    expect(tooSoon.status).toBe(429);
    expect(tooSoon.body.code).toBe('OTP_COOLDOWN');

    await skipCooldown('+919876543210', 'register');
    const second = await register('9876543210', { name: 'Someone Else' });
    expect(second.status).toBe(200);

    // The newest code reaches the phone, but the first requester's id no longer matches any challenge.
    const hijack = await verify(first.body.data.verificationId, lastCode());
    expect(hijack.status).toBe(400);
    expect(hijack.body.code).toBe('OTP_EXPIRED');

    const legit = await verify(second.body.data.verificationId, lastCode());
    expect(legit.status).toBe(201);
    expect(legit.body.data.user.name).toBe('Someone Else');
  });
});

describe('password login', () => {
  test('logs in with the identifier in any format', async () => {
    await signUp('renu@example.com');

    const res = await request(app).post(api('/login')).send({ identifier: ' RENU@example.com', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(refreshCookie(res)).toBeDefined();
  });

  test('rejects a wrong password', async () => {
    await signUp('9876543210');

    const res = await request(app).post(api('/login')).send({ identifier: '9876543210', password: 'Wrong1234' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('OTP login', () => {
  test('logs an existing user in with a code', async () => {
    await signUp('9876543210');

    const started = await requestLoginOtp('+91 98765 43210');
    expect(started.status).toBe(200);
    expect(started.body.data.purpose).toBe('login');

    const res = await verify(started.body.data.verificationId, lastCode());

    expect(res.status).toBe(200);
    expect(res.body.data.user.phone).toBe('+919876543210');
    expect(refreshCookie(res)).toBeDefined();
  });

  test('returns 404 for an unknown identifier', async () => {
    const res = await requestLoginOtp('9876543210');

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ACCOUNT_NOT_FOUND');
    expect(outbox).toHaveLength(0);
  });

  test('refuses a deactivated account before sending anything', async () => {
    await User.create({ name: 'Blocked User', phone: '+919876543212', password: PASSWORD, isActive: false });

    const res = await requestLoginOtp('9876543212');

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ACCOUNT_DEACTIVATED');
    expect(outbox).toHaveLength(0);
  });
});

describe('OTP limits', () => {
  test('deletes the challenge after five wrong codes', async () => {
    const started = await register('9876543210');
    const { verificationId } = started.body.data;
    const code = lastCode();
    const wrong = code === '000000' ? '111111' : '000000';

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const res = await verify(verificationId, wrong);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('OTP_INVALID');
    }

    const locked = await verify(verificationId, wrong);
    expect(locked.status).toBe(429);
    expect(locked.body.code).toBe('OTP_ATTEMPTS_EXCEEDED');
    expect(await OtpChallenge.countDocuments()).toBe(0);

    const late = await verify(verificationId, code);
    expect(late.status).toBe(400);
    expect(late.body.code).toBe('OTP_EXPIRED');
  });

  test('enforces the resend cooldown and retires the previous code', async () => {
    const started = await register('9876543210');
    const { verificationId } = started.body.data;
    const firstCode = lastCode();

    const tooSoon = await resend(verificationId);
    expect(tooSoon.status).toBe(429);
    expect(tooSoon.body.code).toBe('OTP_COOLDOWN');
    expect(tooSoon.body.errors[0].value).toBeGreaterThan(0);

    await skipCooldown('+919876543210', 'register');
    const resent = await resend(verificationId);
    expect(resent.status).toBe(200);
    expect(resent.body.data.verificationId).toBe(verificationId);
    expect(outbox).toHaveLength(2);

    const newCode = lastCode();
    if (newCode !== firstCode) {
      const stale = await verify(verificationId, firstCode);
      expect(stale.status).toBe(400);
      expect(stale.body.code).toBe('OTP_INVALID');
    }

    expect((await verify(verificationId, newCode)).status).toBe(201);
  });

  test('rejects a code once the challenge has expired', async () => {
    const started = await register('9876543210');
    await OtpChallenge.updateOne({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });

    const res = await verify(started.body.data.verificationId, lastCode());

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('OTP_EXPIRED');
  });
});

describe('POST /auth/refresh', () => {
  test('rotates the session for a freshly created account', async () => {
    const signedUp = await signUp('9876543210');
    const cookie = refreshCookie(signedUp).split(';')[0];

    const res = await request(app).post(api('/refresh')).set('Cookie', cookie).send({});

    expect(res.status).toBe(200);
    expect(typeof res.body.data.accessToken).toBe('string');
    expect(refreshCookie(res)).toBeDefined();
  });
});