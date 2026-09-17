import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

import app from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { Category } from '../../src/modules/category/category.model.js';
import { Product } from '../../src/modules/product/product.model.js';
import { signAccessToken } from '../../src/utils/token.js';

const api = (path) => `${env.API_PREFIX}${path}`;

// authenticate only verifies the JWT and reads { sub, role }; it never loads the user, so a
// signed token is enough and these tests stay about the catalogue rather than about auth.
const tokenFor = (role) => signAccessToken({ sub: new mongoose.Types.ObjectId().toString(), role });
const ADMIN = () => `Bearer ${tokenFor('admin')}`;
const CUSTOMER = () => `Bearer ${tokenFor('user')}`;

let mongod;
let fruit;
let kids;

const productPayload = (overrides = {}) => ({
  name: 'Mango Alohas',
  sku: 'FV-01',
  category: fruit._id.toString(),
  mrp: 150,
  packSize: { value: 100, unit: 'g' },
  ...overrides,
});

const createProduct = (overrides = {}) =>
  Product.create({
    name: 'Mango Alohas',
    slug: 'mango-alohas',
    sku: 'FV-01',
    category: fruit._id,
    mrp: 150,
    price: 150,
    packSize: { value: 100, unit: 'g' },
    ...overrides,
  });

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Without init() the unique slug/sku assertions race the index build.
  await Promise.all([Category.init(), Product.init()]);
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  await Promise.all([Product.deleteMany({}), Category.deleteMany({})]);
  [fruit, kids] = await Category.create([
    { name: 'Fruit Variant', displayOrder: 6 },
    { name: 'Kids Wellness', displayOrder: 5 },
  ]);
});

describe('GET /categories', () => {
  test('returns active categories in the client-mandated display order', async () => {
    const res = await request(app).get(api('/categories'));

    expect(res.status).toBe(200);
    expect(res.body.data.map((category) => category.name)).toEqual(['Kids Wellness', 'Fruit Variant']);
    expect(res.body.data[0].slug).toBe('kids-wellness');
    // Every catalogue response identifies a document with `id`. Asserting _id is absent is the
    // half that matters: toMatchObject-style checks pass happily while _id leaks through.
    expect(res.body.data[0].id).toBeDefined();
    expect(res.body.data[0]._id).toBeUndefined();
    expect(res.body.data[0].__v).toBeUndefined();
  });

  test('derives the slug from the name', async () => {
    const created = await Category.create({ name: 'Millets n Nuts' });
    expect(created.slug).toBe('millets-n-nuts');
  });

  test('hides an inactive category from the public but shows it to an admin who asks', async () => {
    await Category.updateOne({ _id: kids._id }, { isActive: false });

    const anonymous = await request(app).get(api('/categories?includeInactive=true'));
    expect(anonymous.body.data).toHaveLength(1);

    const admin = await request(app).get(api('/categories?includeInactive=true')).set('Authorization', ADMIN());
    expect(admin.body.data).toHaveLength(2);
  });
});

describe('GET /products', () => {
  test('paginates and reports meta', async () => {
    await createProduct({ name: 'One', slug: 'one', sku: 'FV-01' });
    await createProduct({ name: 'Two', slug: 'two', sku: 'FV-02' });
    await createProduct({ name: 'Three', slug: 'three', sku: 'FV-03' });

    const res = await request(app).get(api('/products?limit=2&page=1'));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      totalPages: 2,
      hasNextPage: true,
      hasPrevPage: false,
    });
  });

  test('exposes id, inStock and discountPercent on list rows despite .lean()', async () => {
    await createProduct({ stock: 4, mrp: 200, price: 150 });

    const [item] = (await request(app).get(api('/products'))).body.data;

    expect(item.id).toBeDefined();
    expect(item._id).toBeUndefined();
    expect(item.inStock).toBe(true);
    expect(item.discountPercent).toBe(25);
    expect(item.category).toMatchObject({ name: 'Fruit Variant', slug: 'fruit-variant' });
    // The populated category is lean as well, so it needs the same normalisation.
    expect(item.category.id).toBeDefined();
    expect(item.category._id).toBeUndefined();
  });

  test('identifies the nested category the same way on list and on detail', async () => {
    await createProduct();

    const [listed] = (await request(app).get(api('/products'))).body.data;
    const detail = (await request(app).get(api('/products/mango-alohas'))).body.data;

    expect(detail.category.id).toBeDefined();
    expect(detail.category._id).toBeUndefined();
    expect(listed.category.id).toBe(detail.category.id);
    expect(Object.keys(listed.category).sort()).toEqual(Object.keys(detail.category).sort());
  });

  test('filters by category slug', async () => {
    await createProduct({ sku: 'FV-01' });
    await createProduct({ name: 'Ragi Bites', slug: 'ragi-bites', sku: 'KW-01', category: kids._id });

    const res = await request(app).get(api('/products?category=kids-wellness'));

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].sku).toBe('KW-01');
  });

  test('404s on an unknown category slug rather than returning an empty list', async () => {
    const res = await request(app).get(api('/products?category=fruit-flavoured'));

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Category not found');
  });

  test.each([
    ['price_asc', [100, 150, 200]],
    ['price_desc', [200, 150, 100]],
  ])('sorts by %s', async (sort, expected) => {
    await createProduct({ name: 'A', slug: 'a', sku: 'FV-01', mrp: 150, price: 150 });
    await createProduct({ name: 'B', slug: 'b', sku: 'FV-02', mrp: 200, price: 200 });
    await createProduct({ name: 'C', slug: 'c', sku: 'FV-03', mrp: 100, price: 100 });

    const res = await request(app).get(api(`/products?sort=${sort}`));

    expect(res.body.data.map((product) => product.price)).toEqual(expected);
  });

  test('rejects a sort value outside the whitelist instead of ordering by an arbitrary field', async () => {
    const res = await request(app).get(api('/products?sort=stock'));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('treats ?inStock=false as false, not as a truthy string', async () => {
    await createProduct({ sku: 'FV-01', stock: 0 });
    await createProduct({ name: 'Stocked', slug: 'stocked', sku: 'FV-02', stock: 5 });

    expect((await request(app).get(api('/products?inStock=true'))).body.data).toHaveLength(1);
    expect((await request(app).get(api('/products?inStock=false'))).body.data).toHaveLength(2);
  });

  test('searches name and taglines, and treats the term as literal text', async () => {
    await createProduct({ sku: 'FV-01', taglines: ['Sunshine in every bite'] });
    await createProduct({ name: 'Ragi Bites', slug: 'ragi-bites', sku: 'KW-01' });

    expect((await request(app).get(api('/products?search=sunshine'))).body.data).toHaveLength(1);
    expect((await request(app).get(api('/products?search=Ragi'))).body.data).toHaveLength(1);
    // A regex metacharacter must not blow up or match everything.
    expect((await request(app).get(api('/products?search=.*'))).body.data).toHaveLength(0);
  });

  test('rejects a price range that cannot match anything', async () => {
    const res = await request(app).get(api('/products?minPrice=200&maxPrice=100'));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('hides inactive products from the public but shows them to an admin who asks', async () => {
    await createProduct({ isActive: false });

    expect((await request(app).get(api('/products?includeInactive=true'))).body.data).toHaveLength(0);

    const admin = await request(app).get(api('/products?includeInactive=true')).set('Authorization', ADMIN());
    expect(admin.body.data).toHaveLength(1);
  });
});

describe('GET /products/:idOrSlug', () => {
  test('resolves a 12-character slug as a slug, not as an ObjectId', async () => {
    // "mango-alohas" is exactly 12 characters, which mongoose.isValidObjectId would accept.
    expect('mango-alohas').toHaveLength(12);
    await createProduct();

    const res = await request(app).get(api('/products/mango-alohas'));

    expect(res.status).toBe(200);
    expect(res.body.data.sku).toBe('FV-01');
    expect(res.body.data.category).toMatchObject({ slug: 'fruit-variant' });
  });

  test('resolves by id as well', async () => {
    const product = await createProduct();

    const res = await request(app).get(api(`/products/${product._id}`));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(product._id.toString());
  });

  test('404s for an unknown slug', async () => {
    const res = await request(app).get(api('/products/not-a-product'));

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Product not found');
  });

  test('hides a soft-deleted product from the public but lets an admin open it', async () => {
    const product = await createProduct({ isActive: false });

    expect((await request(app).get(api('/products/mango-alohas'))).status).toBe(404);

    const admin = await request(app).get(api(`/products/${product._id}`)).set('Authorization', ADMIN());
    expect(admin.status).toBe(200);
    expect(admin.body.data.isActive).toBe(false);
  });
});

describe('admin product writes', () => {
  test('rejects anonymous and non-admin callers', async () => {
    expect((await request(app).post(api('/products')).send(productPayload())).status).toBe(401);

    const asCustomer = await request(app)
      .post(api('/products'))
      .set('Authorization', CUSTOMER())
      .send(productPayload());
    expect(asCustomer.status).toBe(403);
  });

  test('creates a product, deriving the slug and defaulting price to MRP', async () => {
    const res = await request(app).post(api('/products')).set('Authorization', ADMIN()).send(productPayload());

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ slug: 'mango-alohas', price: 150, mrp: 150, discountPercent: 0 });
    expect(res.body.data.inStock).toBe(false);
  });

  test('refuses a price above MRP', async () => {
    const res = await request(app)
      .post(api('/products'))
      .set('Authorization', ADMIN())
      .send(productPayload({ price: 200 }));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PRICE_ABOVE_MRP');
  });

  test('refuses an unknown category', async () => {
    const res = await request(app)
      .post(api('/products'))
      .set('Authorization', ADMIN())
      .send(productPayload({ category: new mongoose.Types.ObjectId().toString() }));

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Category not found');
  });

  test('refuses a duplicate SKU', async () => {
    await createProduct();

    const res = await request(app)
      .post(api('/products'))
      .set('Authorization', ADMIN())
      .send(productPayload({ name: 'Something Else' }));

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('DUPLICATE_KEY');
  });

  test('refuses a raw image URL in JSON: images only arrive as uploaded files', async () => {
    const res = await request(app)
      .post(api('/products'))
      .set('Authorization', ADMIN())
      .send(productPayload({ images: [{ url: 'https://example.com/front.jpg', alt: 'front' }] }));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(await Product.countDocuments()).toBe(0);
  });

  test('reorders and re-labels stored images over plain JSON, keeping any number of them', async () => {
    const storedImages = ['front', 'back', 'label', 'nutrition', 'extra'].map((kind) => ({
      url: `https://res.cloudinary.com/demo/${kind}.jpg`,
      publicId: `laadlibytes/test/products/FV-01/${kind}`,
      alt: kind,
    }));
    const product = await createProduct({ images: storedImages });

    const reversedOrder = [...storedImages].reverse().map(({ publicId }) => ({ publicId }));
    reversedOrder[0].alt = 'new front';

    const res = await request(app)
      .patch(api(`/products/${product._id}`))
      .set('Authorization', ADMIN())
      .send({ images: reversedOrder });

    expect(res.status).toBe(200);
    expect(res.body.data.images).toHaveLength(5);
    expect(res.body.data.images[0]).toMatchObject({ publicId: storedImages[4].publicId, alt: 'new front' });
    expect(res.body.data.images[4].alt).toBe('front');
  });

  test('fills in description and shelf life later without wiping untouched array fields', async () => {
    const product = await createProduct({ ingredients: ['Roasted Ragi Flour', 'Rolled Oats'] });

    const res = await request(app)
      .patch(api(`/products/${product._id}`))
      .set('Authorization', ADMIN())
      .send({ description: 'A mango millet bite.', shelfLife: '6 months from packaging' });

    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('A mango millet bite.');
    // The PATCH never mentioned ingredients, so a schema default must not have overwritten them.
    expect(res.body.data.ingredients).toEqual(['Roasted Ragi Flour', 'Rolled Oats']);
  });

  test('rejects an empty PATCH', async () => {
    const product = await createProduct();

    const res = await request(app).patch(api(`/products/${product._id}`)).set('Authorization', ADMIN()).send({});

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('keeps the slug stable across a rename so existing links survive', async () => {
    const product = await createProduct();

    const res = await request(app)
      .patch(api(`/products/${product._id}`))
      .set('Authorization', ADMIN())
      .send({ name: 'Mango Alohas Deluxe' });

    expect(res.body.data.name).toBe('Mango Alohas Deluxe');
    expect(res.body.data.slug).toBe('mango-alohas');
  });

  test('DELETE soft-deletes, so the document survives for future order lines', async () => {
    const product = await createProduct();

    const res = await request(app).delete(api(`/products/${product._id}`)).set('Authorization', ADMIN());

    expect(res.status).toBe(204);
    const stored = await Product.findById(product._id);
    expect(stored).not.toBeNull();
    expect(stored.isActive).toBe(false);
  });
});

describe('admin category writes', () => {
  test('refuses to delete a category that still has products', async () => {
    await createProduct();

    const res = await request(app).delete(api(`/categories/${fruit._id}`)).set('Authorization', ADMIN());

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CATEGORY_NOT_EMPTY');
    expect(res.body.message).toContain('1 product');
    expect(await Category.countDocuments()).toBe(2);
  });

  test('deletes an empty category', async () => {
    const res = await request(app).delete(api(`/categories/${kids._id}`)).set('Authorization', ADMIN());

    expect(res.status).toBe(204);
    expect(await Category.countDocuments()).toBe(1);
  });

  test('rejects a non-admin caller', async () => {
    const res = await request(app)
      .post(api('/categories'))
      .set('Authorization', CUSTOMER())
      .send({ name: 'Sneaky Category' });

    expect(res.status).toBe(403);
  });
});