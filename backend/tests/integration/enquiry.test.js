import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

// ESM: the mock must be registered before the app (and so the email module) is imported.
const outbox = [];
let failNextEmailTo = null;
jest.unstable_mockModule('../../src/integrations/email/index.js', () => {
  const sendEmail = jest.fn(async (message) => {
    if (message.to === failNextEmailTo) {
      failNextEmailTo = null;
      throw new Error('SMTP down');
    }
    outbox.push(message);
  });
  return { sendEmail, default: sendEmail };
});

const { default: app } = await import('../../src/app.js');
const { env } = await import('../../src/config/env.js');
const { Enquiry } = await import('../../src/modules/enquiry/enquiry.model.js');
const { signAccessToken } = await import('../../src/utils/token.js');

const api = (path) => `${env.API_PREFIX}${path}`;
const adminApi = (path) => api(`/admin${path}`);
const tokenFor = (role, sub = new mongoose.Types.ObjectId().toString()) => signAccessToken({ sub, role });
const ADMIN = () => `Bearer ${tokenFor('admin')}`;
const CUSTOMER = () => `Bearer ${tokenFor('user')}`;

const validEnquiry = (overrides = {}) => ({
  name: 'Priya Sharma',
  email: 'Priya@Example.com',
  subject: 'Bulk order',
  message: 'Do you take orders of 50 boxes for a wedding?',
  ...overrides,
});

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Enquiry.init();
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await Enquiry.deleteMany({});
  outbox.length = 0;
  failNextEmailTo = null;
});

describe('POST /enquiries', () => {
  test('saves the message, emails the shop (reply-to customer) and sends the customer an acknowledgement', async () => {
    const res = await request(app).post(api('/enquiries')).send(validEnquiry());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    const saved = await Enquiry.find().select('+ip').lean();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ name: 'Priya Sharma', email: 'priya@example.com', status: 'new', user: null });
    expect(saved[0].ip).toBeTruthy();

    const notification = outbox.find((m) => m.to === env.ENQUIRY_NOTIFY_EMAIL);
    expect(notification.replyTo).toBe('priya@example.com');
    expect(notification.subject).toContain('Priya Sharma');
    expect(notification.text).toContain('50 boxes');

    const acknowledgement = outbox.find((m) => m.to === 'priya@example.com');
    expect(acknowledgement.text).toContain('within 1 working day');
  });

  test('links the enquiry to a signed-in sender', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    await request(app)
      .post(api('/enquiries'))
      .set('Authorization', `Bearer ${tokenFor('user', userId)}`)
      .send(validEnquiry())
      .expect(201);

    expect(String((await Enquiry.findOne()).user)).toBe(userId);
  });

  test('escapes customer text in the HTML emails', async () => {
    await request(app)
      .post(api('/enquiries'))
      .send(validEnquiry({ name: '<b>Evil</b>', message: '<script>alert(1)</script> hello there' }))
      .expect(201);

    for (const mail of outbox) {
      expect(mail.html).not.toContain('<script>');
      expect(mail.html).not.toContain('<b>Evil</b>');
    }
  });

  test('still succeeds, with the message saved, when an email fails', async () => {
    failNextEmailTo = env.ENQUIRY_NOTIFY_EMAIL;

    const res = await request(app).post(api('/enquiries')).send(validEnquiry());

    expect(res.status).toBe(201);
    expect(await Enquiry.countDocuments()).toBe(1);
  });

  test('answers a honeypot hit like a success but saves and sends nothing', async () => {
    const res = await request(app).post(api('/enquiries')).send(validEnquiry({ website: 'http://spam.example' }));

    expect(res.status).toBe(201);
    expect(await Enquiry.countDocuments()).toBe(0);
    expect(outbox).toHaveLength(0);
  });

  test('rejects invalid input with field errors', async () => {
    const res = await request(app)
      .post(api('/enquiries'))
      .send({ name: 'P', email: 'not-an-email', message: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    const fields = res.body.errors.map((e) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['body.name', 'body.email', 'body.message']));
    expect(await Enquiry.countDocuments()).toBe(0);
  });
});

describe('/admin/enquiries', () => {
  test.each([
    ['anonymous', undefined, 401],
    ['customer', CUSTOMER, 403],
  ])('is closed to a %s caller', async (_label, auth, status) => {
    const req = request(app).get(adminApi('/enquiries'));
    if (auth) req.set('Authorization', auth());
    expect((await req).status).toBe(status);
  });

  test('lists newest first, filters by status and searches', async () => {
    await Enquiry.create([
      { ...validEnquiry({ name: 'Old One', subject: 'Wedding' }), createdAt: new Date('2026-01-01') },
      { ...validEnquiry({ name: 'New One', subject: 'Diwali' }), status: 'replied' },
    ]);

    const all = await request(app).get(adminApi('/enquiries')).set('Authorization', ADMIN());
    expect(all.status).toBe(200);
    expect(all.body.data.map((e) => e.name)).toEqual(['New One', 'Old One']);
    expect(all.body.meta.total).toBe(2);
    expect(all.body.data[0].id).toBeDefined();
    expect(all.body.data[0].ip).toBeUndefined();

    const replied = await request(app).get(adminApi('/enquiries?status=replied')).set('Authorization', ADMIN());
    expect(replied.body.data.map((e) => e.name)).toEqual(['New One']);

    const search = await request(app).get(adminApi('/enquiries?search=diwa')).set('Authorization', ADMIN());
    expect(search.body.data.map((e) => e.name)).toEqual(['New One']);
  });

  test('opening a new enquiry marks it read; PATCH sets the status', async () => {
    const enquiry = await Enquiry.create(validEnquiry());

    const detail = await request(app).get(adminApi(`/enquiries/${enquiry.id}`)).set('Authorization', ADMIN());
    expect(detail.status).toBe(200);
    expect(detail.body.data.status).toBe('read');

    const patched = await request(app)
      .patch(adminApi(`/enquiries/${enquiry.id}`))
      .set('Authorization', ADMIN())
      .send({ status: 'replied' });
    expect(patched.status).toBe(200);
    expect(patched.body.data.status).toBe('replied');
  });

  test('404s an unknown enquiry', async () => {
    const res = await request(app)
      .get(adminApi(`/enquiries/${new mongoose.Types.ObjectId()}`))
      .set('Authorization', ADMIN());
    expect(res.status).toBe(404);
  });

  test('the dashboard summary counts enquiries', async () => {
    await Enquiry.create([validEnquiry(), { ...validEnquiry(), status: 'read' }]);

    const res = await request(app).get(adminApi('/summary')).set('Authorization', ADMIN());
    expect(res.body.data.enquiries).toEqual({ total: 2, new: 1 });
  });
});