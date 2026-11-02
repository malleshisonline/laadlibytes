import crypto from 'node:crypto';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

// ESM: the mocks must be registered before the app is imported.
const outbox = [];
jest.unstable_mockModule('../../src/integrations/email/index.js', () => {
  const sendEmail = async (message) => {
    outbox.push(message);
  };
  return { sendEmail, default: sendEmail };
});

let uploadSequence = 0;
const uploadImageBufferToCloudinary = jest.fn(async (_buffer, folderPath) => {
  uploadSequence += 1;
  const publicId = `${folderPath}/uploaded-${uploadSequence}`;
  return { url: `https://res.cloudinary.com/test-cloud/image/upload/${publicId}.png`, publicId };
});
const deleteCloudinaryAssetsByPublicIds = jest.fn(async () => {});
jest.unstable_mockModule('../../src/integrations/storage/cloudinaryImageStorage.js', () => ({
  uploadImageBufferToCloudinary,
  deleteCloudinaryAssetByPublicId: jest.fn(async () => {}),
  deleteCloudinaryAssetsByPublicIds,
  default: uploadImageBufferToCloudinary,
}));

const { default: app } = await import('../../src/app.js');
const { env } = await import('../../src/config/env.js');
const { Address } = await import('../../src/modules/address/address.model.js');
const { Cart } = await import('../../src/modules/cart/cart.model.js');
const { cartService } = await import('../../src/modules/cart/cart.service.js');
const { Coupon } = await import('../../src/modules/coupon/coupon.model.js');
const { Enquiry } = await import('../../src/modules/enquiry/enquiry.model.js');
const { GiftHamper } = await import('../../src/modules/giftHamper/giftHamper.model.js');
const { Order } = await import('../../src/modules/order/order.model.js');
const { Product } = await import('../../src/modules/product/product.model.js');
const { User } = await import('../../src/modules/user/user.model.js');
const { signAccessToken } = await import('../../src/utils/token.js');

const api = (path) => `${env.API_PREFIX}${path}`;
const bearer = (userId, role = 'user') => `Bearer ${signAccessToken({ sub: userId, role })}`;
const adminId = new mongoose.Types.ObjectId().toString();
const asAdmin = (req) => req.set('Authorization', bearer(adminId, 'admin'));

const PNG_BYTES = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);

const hamperFields = (overrides = {}) => ({
  name: 'Fruit Khazana',
  code: 'FK',
  headline: '12 Fruity Chikkis. One Festive Collection',
  price: 399,
  flavours: ['Mango Alohas', 'Grape Kick'],
  ...overrides,
});

const makeHamper = (overrides = {}) =>
  GiftHamper.create({
    slug: (overrides.name ?? 'Fruit Khazana').toLowerCase().replaceAll(' ', '-'),
    images: [{ url: 'https://example.com/fk.png', publicId: 'test/gift-hampers/FK/front', alt: 'Fruit Khazana box' }],
    ...hamperFields(),
    ...overrides,
  });

let productSeq = 0;
const makeProduct = (overrides = {}) => {
  productSeq += 1;
  return Product.create({
    name: `Chikki ${productSeq}`,
    sku: `TST-${productSeq}`,
    category: new mongoose.Types.ObjectId(),
    mrp: 100,
    price: 100,
    packSize: { value: 100, unit: 'g' },
    images: [{ url: `https://example.com/p${productSeq}.png`, publicId: `test/p${productSeq}`, alt: 'Front' }],
    stock: 20,
    ...overrides,
  });
};

async function makeCustomer() {
  const user = await User.create({ name: 'Hamper Buyer', email: `buyer-${crypto.randomUUID()}@example.com`, password: 'Secret123' });
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

const asUser = (req, userId) => req.set('Authorization', bearer(userId));
const addHamperAs = (userId, body) => asUser(request(app).post(api('/cart/hampers')), userId).send(body);
const addProductAs = (userId, body) => asUser(request(app).post(api('/cart/items')), userId).send(body);
const placeAs = (userId, body) => asUser(request(app).post(api('/orders')), userId).send(body);
const stockOf = async (product) => (await Product.findById(product._id).lean()).stock;

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

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([
    Address.init(),
    Cart.init(),
    Coupon.init(),
    Enquiry.init(),
    GiftHamper.init(),
    Order.init(),
    Product.init(),
    User.init(),
  ]);
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
  uploadImageBufferToCloudinary.mockClear();
  deleteCloudinaryAssetsByPublicIds.mockClear();
  await Promise.all([
    Address.deleteMany({}),
    Cart.deleteMany({}),
    Coupon.deleteMany({}),
    Enquiry.deleteMany({}),
    GiftHamper.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
  ]);
  await User.create({ _id: adminId, name: 'Hamper Admin', email: 'hamper-admin@example.com', password: 'Secret123', role: 'admin' });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('flavours', () => {
  test('a hamper needs at least one flavour, on create, on update and in the model', async () => {
    const created = await asAdmin(request(app).post(api('/admin/gift-hampers'))).send(hamperFields({ flavours: [] }));
    expect(created.status).toBe(400);
    expect(await GiftHamper.countDocuments()).toBe(0);

    const hamper = await makeHamper();
    await asAdmin(request(app).patch(api(`/admin/gift-hampers/${hamper.id}`))).send({ flavours: [] }).expect(400);
    await expect(makeHamper({ code: 'X', name: 'Empty', flavours: [] })).rejects.toThrow(/at least one flavour/);
  });

  test('a flavour is a plain name: no piece counts, groups or images', async () => {
    const res = await asAdmin(request(app).post(api('/admin/gift-hampers'))).send(
      hamperFields({ flavours: [{ name: 'Mango Alohas', qty: 2 }] })
    );
    expect(res.status).toBe(400);
  });
});

describe('admin', () => {
  test('creates a hamper with images uploaded to its own Cloudinary folder', async () => {
    const res = await asAdmin(request(app).post(api('/admin/gift-hampers')))
      .field('hamperFields', JSON.stringify(hamperFields()))
      .attach('images', PNG_BYTES, { filename: 'box.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ code: 'FK', slug: 'fruit-khazana', price: 399, piecesPerBox: 12, selectionMode: 'fixed' });
    expect(res.body.data.flavours).toEqual(['Mango Alohas', 'Grape Kick']);
    expect(uploadImageBufferToCloudinary).toHaveBeenCalledWith(expect.any(Buffer), 'laadlibytes/test/gift-hampers/FK');
    expect(res.body.data.images[0].publicId).toMatch(/^laadlibytes\/test\/gift-hampers\/FK\//);
  });

  test('replacing the images deletes the old files after the save', async () => {
    const hamper = await makeHamper();
    await asAdmin(request(app).patch(api(`/admin/gift-hampers/${hamper.id}`)))
      .field('hamperFields', JSON.stringify({ images: [{ newImageFileIndex: 0 }] }))
      .attach('images', PNG_BYTES, { filename: 'new.png', contentType: 'image/png' })
      .expect(200);

    expect(deleteCloudinaryAssetsByPublicIds).toHaveBeenCalledWith(['test/gift-hampers/FK/front']);
  });

  test('reorders and switches hampers off', async () => {
    const first = await makeHamper({ sortOrder: 0 });
    const second = await makeHamper({ name: 'Golden Seven', code: 'GS', sortOrder: 1 });

    const reordered = await asAdmin(request(app).post(api('/admin/gift-hampers/reorder')))
      .send({ ids: [second.id, first.id] })
      .expect(200);
    expect(reordered.body.data.map((hamper) => hamper.code)).toEqual(['GS', 'FK']);

    await asAdmin(request(app).patch(api(`/admin/gift-hampers/${second.id}`))).send({ isActive: false }).expect(200);
    const list = await request(app).get(api('/gift-hampers')).expect(200);
    expect(list.body.data.map((hamper) => hamper.code)).toEqual(['FK']);
  });

  test('delete removes an unordered hamper with its images, and only switches off an ordered one', async () => {
    const unordered = await makeHamper();
    const deleted = await asAdmin(request(app).delete(api(`/admin/gift-hampers/${unordered.id}`))).expect(200);
    expect(deleted.body.data).toEqual({ deleted: true });
    expect(deleteCloudinaryAssetsByPublicIds).toHaveBeenCalledWith(['test/gift-hampers/FK/front']);

    const ordered = await makeHamper();
    const { userId, addressId } = await makeCustomer();
    await addHamperAs(userId, { hamperId: ordered.id, quantity: 1 }).expect(200);
    await placeAs(userId, { addressId, termsAccepted: true }).expect(201);

    const switchedOff = await asAdmin(request(app).delete(api(`/admin/gift-hampers/${ordered.id}`))).expect(200);
    expect(switchedOff.body.data).toEqual({ deleted: false });
    expect((await GiftHamper.findById(ordered.id).lean()).isActive).toBe(false);
  });

  test('the admin routes are admin-only', async () => {
    const { userId } = await makeCustomer();
    await asUser(request(app).get(api('/admin/gift-hampers')), userId).expect(403);
  });
});

describe('storefront reads', () => {
  test('lists active hampers, and shows one by slug with its flavour names', async () => {
    await makeHamper();
    await makeHamper({ name: 'Hidden', code: 'HID', isActive: false });

    const list = await request(app).get(api('/gift-hampers')).expect(200);
    expect(list.body.data).toHaveLength(1);

    const detail = await request(app).get(api('/gift-hampers/fruit-khazana')).expect(200);
    expect(detail.body.data).toMatchObject({
      name: 'Fruit Khazana',
      price: 399,
      piecesPerBox: 12,
      images: [{ alt: 'Fruit Khazana box' }],
      flavours: ['Mango Alohas', 'Grape Kick'],
    });

    await request(app).get(api('/gift-hampers/hidden')).expect(404);
  });
});

describe('cart', () => {
  test('takes only the hamper and the boxes: client-sent flavour picks and prices are ignored', async () => {
    const hamper = await makeHamper();
    const { userId } = await makeCustomer();

    const res = await addHamperAs(userId, {
      hamperId: hamper.id,
      quantity: 2,
      flavours: ['Mango Alohas'],
      selections: ['FV-01'],
      price: 1,
    }).expect(200);

    const [line] = res.body.data.items;
    expect(line.kind).toBe('hamper');
    expect(line.hamper.flavours).toEqual(['Mango Alohas', 'Grape Kick']);
    expect(line.lineTotal).toBe(798);
    expect(Object.keys((await Cart.findOne().lean()).items[0]).sort()).toEqual(['hamper', 'kind', 'quantity']);
  });

  test('is priced live from the hamper record', async () => {
    const hamper = await makeHamper();
    const { userId } = await makeCustomer();
    await addHamperAs(userId, { hamperId: hamper.id, quantity: 1 }).expect(200);

    await GiftHamper.updateOne({ _id: hamper._id }, { $set: { price: 449 } });
    const cart = await asUser(request(app).get(api('/cart')), userId).expect(200);
    expect(cart.body.data.subtotal).toBe(449);
  });

  test('allows bulk quantities up to maxQtyPerOrder, which is not stock', async () => {
    const hamper = await makeHamper();
    const { userId } = await makeCustomer();

    await addHamperAs(userId, { hamperId: hamper.id, quantity: 50 }).expect(200);
    const over = await addHamperAs(userId, { hamperId: hamper.id, quantity: 1 });
    expect(over.status).toBe(409);
    expect(over.body.code).toBe('CART_LIMIT');
  });

  test('product and hamper lines live side by side without touching each other', async () => {
    const hamper = await makeHamper();
    const product = await makeProduct();
    const { userId } = await makeCustomer();

    await addProductAs(userId, { productId: product.id, quantity: 2 }).expect(200);
    await addHamperAs(userId, { hamperId: hamper.id, quantity: 3 }).expect(200);
    await asUser(request(app).patch(api(`/cart/items/${product.id}`)), userId).send({ quantity: 4 }).expect(200);
    await asUser(request(app).patch(api(`/cart/hampers/${hamper.id}`)), userId).send({ quantity: 5 }).expect(200);

    let cart = (await asUser(request(app).get(api('/cart')), userId)).body.data;
    expect(cart.items.map((item) => [item.kind, item.quantity])).toEqual([['product', 4], ['hamper', 5]]);
    expect(cart.subtotal).toBe(4 * 100 + 5 * 399);

    cart = (await asUser(request(app).delete(api(`/cart/items/${product.id}`)), userId)).body.data;
    expect(cart.items.map((item) => item.kind)).toEqual(['hamper']);
    cart = (await asUser(request(app).delete(api(`/cart/hampers/${hamper.id}`)), userId)).body.data;
    expect(cart.items).toEqual([]);
  });

  test('a switched-off hamper drops out of the cart, leaving the products', async () => {
    const hamper = await makeHamper();
    const product = await makeProduct();
    const { userId } = await makeCustomer();
    await addProductAs(userId, { productId: product.id, quantity: 1 }).expect(200);
    await addHamperAs(userId, { hamperId: hamper.id, quantity: 1 }).expect(200);

    await GiftHamper.updateOne({ _id: hamper._id }, { $set: { isActive: false } });
    const cart = await asUser(request(app).get(api('/cart')), userId).expect(200);
    expect(cart.body.data.items.map((item) => item.kind)).toEqual(['product']);
    expect((await Cart.findOne().lean()).items).toHaveLength(1);
  });

  test('a guest cart with a hamper merges into the account cart on sign-in', async () => {
    const hamper = await makeHamper();
    const { userId } = await makeCustomer();
    const guest = request.agent(app);
    const added = await guest.post(api('/cart/hampers')).send({ hamperId: hamper.id, quantity: 30 }).expect(200);
    const guestToken = added.headers['set-cookie'][0].match(/cartId=([^;]+)/)[1];
    await addHamperAs(userId, { hamperId: hamper.id, quantity: 30 }).expect(200);

    await cartService.mergeGuestCartIntoUser(decodeURIComponent(guestToken), userId);

    const cart = await asUser(request(app).get(api('/cart')), userId).expect(200);
    // Capped at maxQtyPerOrder (50), like a product line is capped at its stock.
    expect(cart.body.data.items).toMatchObject([{ kind: 'hamper', quantity: 50 }]);
  });
});

describe('checkout and orders', () => {
  test('an order with a hamper needs the terms accepted, and takes nothing until they are', async () => {
    const hamper = await makeHamper();
    const product = await makeProduct({ stock: 5 });
    const { userId, addressId } = await makeCustomer();
    await addProductAs(userId, { productId: product.id, quantity: 2 }).expect(200);
    await addHamperAs(userId, { hamperId: hamper.id, quantity: 1 }).expect(200);

    const refused = await placeAs(userId, { addressId });
    expect(refused.status).toBe(400);
    expect(refused.body.code).toBe('TERMS_NOT_ACCEPTED');
    expect(await Order.countDocuments()).toBe(0);
    expect(await stockOf(product)).toBe(5);
  });

  test('copies the hamper line, the gift message and the terms; hampers take no stock', async () => {
    const hamper = await makeHamper();
    const product = await makeProduct({ stock: 5 });
    const { userId, addressId } = await makeCustomer();
    await addProductAs(userId, { productId: product.id, quantity: 2 }).expect(200);
    await addHamperAs(userId, { hamperId: hamper.id, quantity: 3 }).expect(200);

    const res = await placeAs(userId, {
      addressId,
      termsAccepted: true,
      giftMessage: 'Happy Diwali from all of us!',
      recipientName: 'Asha',
      // Ignored: the seller packs the box by the hamper's name.
      flavours: ['Mango Alohas'],
    }).expect(201);

    const order = res.body.data;
    expect(order.total).toBe(2 * 100 + 3 * 399);
    expect(order.giftMessage).toBe('Happy Diwali from all of us!');
    expect(order.recipientName).toBe('Asha');
    expect(order.termsAcceptedAt).toEqual(expect.any(String));

    const hamperLine = order.items.find((item) => item.kind === 'hamper');
    expect(hamperLine).toMatchObject({ name: 'Fruit Khazana', sku: 'FK', price: 399, mrp: 399, quantity: 3, lineTotal: 1197 });
    expect(hamperLine.packSize).toEqual({ value: 180, unit: 'g' });
    expect(hamperLine.image).toEqual({ url: 'https://example.com/fk.png', alt: 'Fruit Khazana box' });
    expect(hamperLine).not.toHaveProperty('flavours');

    // Only the product line took stock. Editing the hamper later never changes the order's copy.
    expect(await stockOf(product)).toBe(3);
    await GiftHamper.updateOne({ _id: hamper._id }, { $set: { name: 'Renamed', price: 1 } });
    const stored = await Order.findById(order.id).lean();
    expect(stored.items.find((item) => item.kind === 'hamper')).toMatchObject({ name: 'Fruit Khazana', price: 399 });
  });

  test('an order without a hamper is saved exactly as before, whatever gift fields are sent', async () => {
    const product = await makeProduct();
    const { userId, addressId } = await makeCustomer();
    await addProductAs(userId, { productId: product.id, quantity: 1 }).expect(200);

    const res = await placeAs(userId, { addressId, giftMessage: 'Hi', recipientName: 'Asha', termsAccepted: true }).expect(201);
    const stored = await Order.findById(res.body.data.id).lean();
    expect(stored.giftMessage).toBeUndefined();
    expect(stored.recipientName).toBeUndefined();
    expect(stored.termsAcceptedAt).toBeUndefined();
    expect(stored.items[0].kind).toBe('product');
  });

  test('paying empties both kinds of line from the cart and emails the shop the hamper and the message', async () => {
    const hamper = await makeHamper();
    const product = await makeProduct();
    const { userId, addressId } = await makeCustomer();
    await addProductAs(userId, { productId: product.id, quantity: 1 }).expect(200);
    await addHamperAs(userId, { hamperId: hamper.id, quantity: 1 }).expect(200);

    const { body } = await placeAs(userId, { addressId, termsAccepted: true, giftMessage: 'Shubh Deepavali' }).expect(201);
    await asUser(request(app).post(api(`/orders/${body.data.id}/payment/verify`)), userId)
      .send(paymentDetailsFor(body.data, 'pay_hamper'))
      .expect(200);

    expect((await Cart.findOne({ user: userId }).lean()).items).toEqual([]);
    await new Promise((resolve) => setImmediate(resolve));
    const email = outbox.find((message) => message.subject.startsWith('New order'));
    expect(email.text).toContain('- Fruit Khazana x 1');
    expect(email.text).toContain('Gift message: Shubh Deepavali');
  });

  test('abandoning gives back product stock only, and a late payment takes only that again', async () => {
    const hamper = await makeHamper();
    const product = await makeProduct({ stock: 5 });
    const { userId, addressId } = await makeCustomer();
    await addProductAs(userId, { productId: product.id, quantity: 2 }).expect(200);
    await addHamperAs(userId, { hamperId: hamper.id, quantity: 4 }).expect(200);
    const { body } = await placeAs(userId, { addressId, termsAccepted: true }).expect(201);
    expect(await stockOf(product)).toBe(3);

    await asUser(request(app).post(api(`/orders/${body.data.id}/payment/status`)), userId).send({ abandon: true }).expect(200);
    expect(await stockOf(product)).toBe(5);

    await asUser(request(app).post(api(`/orders/${body.data.id}/payment/verify`)), userId)
      .send(paymentDetailsFor(body.data, 'pay_late'))
      .expect(200);
    expect(await stockOf(product)).toBe(3);
  });

  test('a coupon discounts the whole subtotal, hamper lines included (no new coupon rule)', async () => {
    const hamper = await makeHamper();
    await Coupon.create({ code: 'FESTIVE10', type: 'percent', value: 10 });
    const { userId, addressId } = await makeCustomer();
    await addHamperAs(userId, { hamperId: hamper.id, quantity: 2 }).expect(200);

    const res = await placeAs(userId, { addressId, termsAccepted: true, couponCode: 'FESTIVE10' }).expect(201);
    expect(res.body.data).toMatchObject({ subtotal: 798, discount: 79, total: 719 });
  });

  test('a guest can order a hamper too', async () => {
    const hamper = await makeHamper();
    const guest = request.agent(app);
    await guest.post(api('/cart/hampers')).send({ hamperId: hamper.id, quantity: 1 }).expect(200);

    const res = await guest
      .post(api('/orders/guest'))
      .send({
        checkoutKey: crypto.randomUUID(),
        termsAccepted: true,
        recipientName: 'Asha',
        address: { name: 'Guest Shopper', phone: '9876543210', pincode: '500081', line1: 'House 12', city: 'Hyderabad', state: 'Telangana' },
      })
      .expect(201);
    expect(res.body.data.items[0]).toMatchObject({ kind: 'hamper', sku: 'FK' });
    expect(res.body.data.recipientName).toBe('Asha');
  });
});

describe('bulk enquiry', () => {
  const bulkEnquiry = (overrides = {}) => ({
    type: 'bulk',
    name: 'Priya Sharma',
    email: 'priya@acme.example',
    company: 'Acme Pvt Ltd',
    phone: '9876543210',
    quantity: 200,
    message: 'We would like 200 boxes for our team this Diwali.',
    ...overrides,
  });

  test('saves the bulk fields and emails the shop with the hamper named', async () => {
    const hamper = await makeHamper();
    await request(app).post(api('/enquiries')).send(bulkEnquiry({ hamper: hamper.id })).expect(201);

    const stored = await Enquiry.findOne().lean();
    expect(stored).toMatchObject({ type: 'bulk', company: 'Acme Pvt Ltd', phone: '+919876543210', quantity: 200 });
    expect(stored.subject).toBe('Bulk order: Fruit Khazana');
    const email = outbox.find((message) => message.subject.startsWith('New bulk hamper enquiry'));
    expect(email.text).toContain('Hamper: Fruit Khazana');
    expect(email.text).toContain('Boxes: 200');
  });

  test('needs a phone number', async () => {
    const res = await request(app).post(api('/enquiries')).send(bulkEnquiry({ phone: undefined }));
    expect(res.status).toBe(400);
    expect(await Enquiry.countDocuments()).toBe(0);
  });

  test('a Contact Us message never stores bulk fields', async () => {
    await request(app)
      .post(api('/enquiries'))
      .send({ name: 'Ravi', email: 'ravi@example.com', message: 'Do you ship to Pune?', company: 'X', quantity: 5 })
      .expect(201);
    const stored = await Enquiry.findOne().lean();
    expect(stored.type).toBe('contact');
    expect(stored.company).toBeUndefined();
    expect(stored.quantity).toBeUndefined();
  });

  test('the admin inbox filters by type', async () => {
    await request(app).post(api('/enquiries')).send(bulkEnquiry()).expect(201);
    await request(app).post(api('/enquiries')).send({ name: 'Ravi', email: 'ravi@example.com', message: 'Do you ship to Pune?' }).expect(201);

    const bulk = await asAdmin(request(app).get(api('/admin/enquiries?type=bulk'))).expect(200);
    expect(bulk.body.data.map((enquiry) => enquiry.type)).toEqual(['bulk']);
    const contact = await asAdmin(request(app).get(api('/admin/enquiries?type=contact'))).expect(200);
    expect(contact.body.data.map((enquiry) => enquiry.type)).toEqual(['contact']);
  });
});