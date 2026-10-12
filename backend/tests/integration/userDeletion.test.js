import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

const { default: app } = await import('../../src/app.js');
const { env } = await import('../../src/config/env.js');
const { Address } = await import('../../src/modules/address/address.model.js');
const { Cart } = await import('../../src/modules/cart/cart.model.js');
const { Category } = await import('../../src/modules/category/category.model.js');
const { Enquiry } = await import('../../src/modules/enquiry/enquiry.model.js');
const { OtpChallenge } = await import('../../src/modules/otp/otp.model.js');
const { Order } = await import('../../src/modules/order/order.model.js');
const { Product } = await import('../../src/modules/product/product.model.js');
const { User } = await import('../../src/modules/user/user.model.js');
const { signAccessToken } = await import('../../src/utils/token.js');

const api = (path) => `${env.API_PREFIX}${path}`;
const bearer = (user) =>
  `Bearer ${signAccessToken({ sub: user.id, role: user.role })}`;

let orderSequence = 0;
let mongod;

async function makeOrder({ user, product, quantity, status = 'placed', paymentStatus = 'pending', actor = user }) {
  orderSequence += 1;
  return Order.create({
    orderNumber: `LB-20261009-${String(orderSequence).padStart(5, '2')}`,
    user: user.id,
    items: [
      {
        product: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        mrp: product.mrp,
        quantity,
        lineTotal: product.price * quantity,
      },
    ],
    address: {
      name: 'Test User',
      phone: '+919876543210',
      pincode: '500081',
      line1: 'Flat 4B, Sunrise Apartments',
      city: 'Hyderabad',
      state: 'Telangana',
    },
    contact: { phone: '+919876543210', email: user.email },
    itemCount: quantity,
    subtotal: product.price * quantity,
    mrpTotal: product.mrp * quantity,
    savings: (product.mrp - product.price) * quantity,
    total: product.price * quantity,
    status,
    paymentStatus,
    history: [{ event: 'status', value: status, by: actor.id }],
  });
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([
    Address.init(),
    Cart.init(),
    Category.init(),
    Enquiry.init(),
    OtpChallenge.init(),
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
  orderSequence = 0;
  await Promise.all([
    Address.deleteMany({}),
    Cart.deleteMany({}),
    Category.deleteMany({}),
    Enquiry.deleteMany({}),
    OtpChallenge.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
  ]);
});

describe('DELETE /admin/users/:id', () => {
  test('removes linked records, restores only unpaid unshipped stock, and retains catalogue data', async () => {
    const [target, admin, customer] = await User.create([
      { name: 'Deleted Admin', email: 'deleted@example.com', phone: '+919876543210', password: 'Secret123', role: 'admin' },
      { name: 'Other Admin', email: 'admin@example.com', password: 'Secret123', role: 'admin' },
      { name: 'Customer', email: 'customer@example.com', password: 'Secret123' },
    ]);
    const category = await Category.create({
      name: 'Test Category',
      slug: 'test-category',
      createdBy: admin.id,
      updatedBy: target.id,
    });
    const unpaidProduct = await Product.create({
      name: 'Unpaid Product',
      slug: 'unpaid-product',
      sku: 'UNPAID-1',
      category: category.id,
      mrp: 120,
      price: 100,
      packSize: { value: 100, unit: 'g' },
      stock: 3,
      createdBy: target.id,
      updatedBy: admin.id,
    });
    const paidProduct = await Product.create({
      name: 'Paid Product',
      slug: 'paid-product',
      sku: 'PAID-1',
      category: category.id,
      mrp: 120,
      price: 100,
      packSize: { value: 100, unit: 'g' },
      stock: 7,
    });

    await Address.create({
      user: target.id,
      name: 'Deleted Admin',
      phone: '+919876543210',
      pincode: '500081',
      line1: 'Flat 4B, Sunrise Apartments',
      city: 'Hyderabad',
      state: 'Telangana',
    });
    await Cart.create({ user: target.id });
    await Enquiry.create({
      user: target.id,
      name: 'Deleted Admin',
      email: target.email,
      message: 'Please contact me about my previous request.',
    });
    await OtpChallenge.create([
      {
        verificationIdHash: 'deleted-user-email-otp',
        identifier: target.email,
        channel: 'email',
        purpose: 'login',
        codeHash: 'email-code-hash',
        lastSentAt: new Date(),
        expiresAt: new Date(Date.now() + 600_000),
      },
      {
        verificationIdHash: 'deleted-user-phone-otp',
        identifier: target.phone,
        channel: 'phone',
        purpose: 'login',
        codeHash: 'phone-code-hash',
        lastSentAt: new Date(),
        expiresAt: new Date(Date.now() + 600_000),
      },
    ]);
    await makeOrder({ user: target, product: unpaidProduct, quantity: 2 });
    await makeOrder({ user: target, product: paidProduct, quantity: 3, paymentStatus: 'paid' });
    await makeOrder({ user: target, product: paidProduct, quantity: 4, status: 'shipped' });
    const survivingOrder = await makeOrder({ user: customer, product: paidProduct, quantity: 1, actor: target });

    const response = await request(app)
      .delete(api(`/admin/users/${target.id}`))
      .set('Authorization', bearer(admin));

    expect(response.status).toBe(204);
    expect(await User.exists({ _id: target.id })).toBeNull();
    expect(await Address.countDocuments({ user: target.id })).toBe(0);
    expect(await Cart.countDocuments({ user: target.id })).toBe(0);
    expect(await Order.countDocuments({ user: target.id })).toBe(0);
    expect(await Enquiry.countDocuments({ user: target.id })).toBe(0);
    expect(await OtpChallenge.countDocuments({ identifier: { $in: [target.email, target.phone] } })).toBe(0);
    expect((await Product.findById(unpaidProduct.id)).stock).toBe(5);
    expect((await Product.findById(paidProduct.id)).stock).toBe(7);
    expect(await Category.exists({ _id: category.id })).toBeTruthy();

    const retainedProduct = await Product.findById(unpaidProduct.id).select('+createdBy +updatedBy');
    expect(retainedProduct.createdBy).toBeUndefined();
    expect(retainedProduct.updatedBy.toString()).toBe(admin.id);
    const retainedCategory = await Category.findById(category.id).select('+createdBy +updatedBy');
    expect(retainedCategory.createdBy.toString()).toBe(admin.id);
    expect(retainedCategory.updatedBy).toBeUndefined();

    const retainedOrder = await Order.findById(survivingOrder.id).lean();
    expect(retainedOrder.history[0]).not.toHaveProperty('by');

    const staleTokenResponse = await request(app)
      .get(api('/users/me'))
      .set('Authorization', bearer(target));
    expect(staleTokenResponse.status).toBe(401);
  });

  test('cleans orphaned records when the user document is already missing', async () => {
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'Secret123',
      role: 'admin',
    });
    const orphanId = new mongoose.Types.ObjectId();
    await Promise.all([
      Address.create({
        user: orphanId,
        name: 'Orphan',
        phone: '+919876543210',
        pincode: '500081',
        line1: 'Flat 4B, Sunrise Apartments',
        city: 'Hyderabad',
        state: 'Telangana',
      }),
      Cart.create({ user: orphanId }),
      Enquiry.create({
        user: orphanId,
        name: 'Orphan',
        email: 'orphan@example.com',
        message: 'Please contact me about my previous request.',
      }),
    ]);

    const response = await request(app)
      .delete(api(`/admin/users/${orphanId}`))
      .set('Authorization', bearer(admin));

    expect(response.status).toBe(404);
    expect(await Address.countDocuments({ user: orphanId })).toBe(0);
    expect(await Cart.countDocuments({ user: orphanId })).toBe(0);
    expect(await Enquiry.countDocuments({ user: orphanId })).toBe(0);
  });
});
