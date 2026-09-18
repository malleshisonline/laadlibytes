import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

// Cloudinary is replaced before the app is imported: uploads get a predictable public id,
// deletions are recorded, and nothing reaches the network.
let uploadSequenceNumber = 0;
const fakeCloudinaryUpload = async (_imageBuffer, folderPath) => {
  uploadSequenceNumber += 1;
  const publicId = `${folderPath}/uploaded-${uploadSequenceNumber}`;
  return { url: `https://res.cloudinary.com/test-cloud/image/upload/${publicId}.png`, publicId };
};
const uploadImageBufferToCloudinary = jest.fn(fakeCloudinaryUpload);
const deleteCloudinaryAssetByPublicId = jest.fn(async () => {});
const deleteCloudinaryAssetsByPublicIds = jest.fn(async () => {});

jest.unstable_mockModule('../../src/integrations/storage/cloudinaryImageStorage.js', () => ({
  uploadImageBufferToCloudinary,
  deleteCloudinaryAssetByPublicId,
  deleteCloudinaryAssetsByPublicIds,
  default: uploadImageBufferToCloudinary,
}));

const { default: app } = await import('../../src/app.js');
const { env } = await import('../../src/config/env.js');
const { Category } = await import('../../src/modules/category/category.model.js');
const { Product } = await import('../../src/modules/product/product.model.js');
const { signAccessToken } = await import('../../src/utils/token.js');

const api = (path) => `${env.API_PREFIX}${path}`;
const bearerTokenFor = (role) =>
  `Bearer ${signAccessToken({ sub: new mongoose.Types.ObjectId().toString(), role })}`;
const ADMIN_AUTHORIZATION = () => bearerTokenFor('admin');

const PNG_FILE_BYTES = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)]);
const JPEG_FILE_BYTES = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
const WEBP_FILE_BYTES = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x40, 0, 0, 0]), Buffer.from('WEBPVP8 '), Buffer.alloc(64)]);
const AVIF_FILE_BYTES = Buffer.concat([Buffer.from([0, 0, 0, 0x1c]), Buffer.from('ftypavif'), Buffer.alloc(64)]);
const pngAttachment =(fileName) => [PNG_FILE_BYTES, { filename: fileName, contentType: 'image/png' }];
const jpegAttachment = (fileName) => [JPEG_FILE_BYTES, { filename: fileName, contentType: 'image/jpeg' }];

const PRODUCT_FOLDER = 'laadlibytes/test/products/FV-01';

/** Every public id handed to the bulk delete so far, flattened. */
const deletedPublicIds = () => deleteCloudinaryAssetsByPublicIds.mock.calls.flatMap(([publicIds]) => publicIds.filter(Boolean));

/** The failed-request cleanup runs on the response's 'finish' event, just after supertest resolves. */
async function waitUntil(condition, timeoutInMilliseconds = 2000) {
  const deadline = Date.now() + timeoutInMilliseconds;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error('Condition not met in time');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

let mongod;
let fruitCategory;

const productFields = (overrides = {}) => ({
  name: 'Mango Alohas',
  sku: 'FV-01',
  category: fruitCategory._id.toString(),
  mrp: 150,
  packSize: { value: 100, unit: 'g' },
  isActive: true,
  ...overrides,
});

const storedImage = (name) => ({
  url: `https://res.cloudinary.com/test-cloud/image/upload/${PRODUCT_FOLDER}/${name}.png`,
  publicId: `${PRODUCT_FOLDER}/${name}`,
  alt: name,
});

const createStoredProduct = (overrides = {}) =>
  Product.create({
    name: 'Mango Alohas',
    slug: 'mango-alohas',
    sku: 'FV-01',
    category: fruitCategory._id,
    mrp: 150,
    price: 150,
    packSize: { value: 100, unit: 'g' },
    ...overrides,
  });

const postProductMultipart = (fields) =>
  request(app)
    .post(api('/products'))
    .set('Authorization', ADMIN_AUTHORIZATION())
    .field('productFields', JSON.stringify(fields));

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([Category.init(), Product.init()]);
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

beforeEach(async () => {
  // clearAllMocks keeps the implementation but drops any queued mock*Once leftovers.
  jest.clearAllMocks();
  uploadImageBufferToCloudinary.mockReset().mockImplementation(fakeCloudinaryUpload);
  await Promise.all([Product.deleteMany({}), Category.deleteMany({})]);
  fruitCategory = await Category.create({ name: 'Fruit Variant', displayOrder: 6 });
});

describe('POST /products with image files', () => {
  test('uploads every file into the SKU folder and saves them in the order sent', async () => {
    const res = await postProductMultipart(productFields())
      .attach('images', ...jpegAttachment('front.jpg'))
      .attach('images', ...pngAttachment('back.png'))
      .attach('images', ...jpegAttachment('label.jpg'))
      .attach('images', ...pngAttachment('nutrition.png'));

    expect(res.status).toBe(201);
    expect(uploadImageBufferToCloudinary).toHaveBeenCalledTimes(4);
    expect(uploadImageBufferToCloudinary.mock.calls.every(([, folderPath]) => folderPath === PRODUCT_FOLDER)).toBe(true);
    expect(res.body.data.images).toHaveLength(4);
    const uploadedImagesInSendOrder = await Promise.all(uploadImageBufferToCloudinary.mock.results.map((call) => call.value));
    expect(res.body.data.images.map((image) => image.publicId)).toEqual(
      uploadedImagesInSendOrder.map((uploadedImage) => uploadedImage.publicId)
    );
    expect(res.body.data.images.every((image) => image.url.startsWith('https://') && image.publicId)).toBe(true);
    // The JSON booleans survived the trip through a text form field.
    expect(res.body.data.isActive).toBe(true);

    const saved = await Product.findOne({ sku: 'FV-01' });
    expect(saved.images.map((image) => image.publicId)).toEqual(res.body.data.images.map((image) => image.publicId));
    expect(deletedPublicIds()).toEqual([]);
  });

  test('places a file by newImageFileIndex and gives it alt text', async () => {
    const res = await postProductMultipart(
      productFields({ images: [{ newImageFileIndex: 1, alt: 'Front of pack' }, { newImageFileIndex: 0 }] })
    )
      .attach('images', ...pngAttachment('back.png'))
      .attach('images', ...pngAttachment('front.png'));

    expect(res.status).toBe(201);
    const [firstUpload, secondUpload] = await Promise.all(uploadImageBufferToCloudinary.mock.results.map((call) => call.value));
    expect(res.body.data.images.map((image) => image.publicId)).toEqual([secondUpload.publicId, firstUpload.publicId]);
    expect(res.body.data.images[0].alt).toBe('Front of pack');
  });

  test('rejects a file whose bytes are not PNG or JPEG, whatever it claims to be', async () => {
    const res = await postProductMultipart(productFields()).attach('images', Buffer.from('GIF89a not really a png'), {
      filename: 'sneaky.png',
      contentType: 'image/png',
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UNSUPPORTED_IMAGE_TYPE');
    expect(uploadImageBufferToCloudinary).not.toHaveBeenCalled();
    expect(await Product.countDocuments()).toBe(0);
  });

  test('rejects a declared type outside PNG, JPEG, WebP and AVIF', async () => {
    const res = await postProductMultipart(productFields()).attach('images', Buffer.from('GIF89a and some more bytes'), {
      filename: 'front.gif',
      contentType: 'image/gif',
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UNSUPPORTED_IMAGE_TYPE');
  });

  test('rejects a file whose bytes contradict its declared type (PNG bytes sent as WebP)', async () => {
    const res = await postProductMultipart(productFields()).attach('images', PNG_FILE_BYTES, {
      filename: 'front.webp',
      contentType: 'image/webp',
    });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UNSUPPORTED_IMAGE_TYPE');
    expect(uploadImageBufferToCloudinary).not.toHaveBeenCalled();
  });

  test('accepts WebP and AVIF files', async () => {
    const res = await postProductMultipart(productFields())
      .attach('images', WEBP_FILE_BYTES, { filename: 'front.webp', contentType: 'image/webp' })
      .attach('images', AVIF_FILE_BYTES, { filename: 'back.avif', contentType: 'image/avif' });

    expect(res.status).toBe(201);
    expect(uploadImageBufferToCloudinary).toHaveBeenCalledTimes(2);
    expect(res.body.data.images).toHaveLength(2);
  });

  test('rejects a file over 5 MB', async () => {
    const oversizedPng = Buffer.concat([PNG_FILE_BYTES, Buffer.alloc(5 * 1024 * 1024)]);

    const res = await postProductMultipart(productFields()).attach('images', oversizedPng, {
      filename: 'huge.png',
      contentType: 'image/png',
    });

    expect(res.status).toBe(413);
    expect(res.body.code).toBe('IMAGE_TOO_LARGE');
    expect(uploadImageBufferToCloudinary).not.toHaveBeenCalled();
  });

  test('rejects more than 10 files in one request', async () => {
    let multipartRequest = postProductMultipart(productFields());
    for (let i = 0; i < 11; i += 1) multipartRequest = multipartRequest.attach('images', ...pngAttachment(`${i}.png`));

    const res = await multipartRequest;

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('TOO_MANY_IMAGES');
    expect(uploadImageBufferToCloudinary).not.toHaveBeenCalled();
  });

  test('rejects files under the wrong field name', async () => {
    const res = await postProductMultipart(productFields()).attach('photos', ...pngAttachment('front.png'));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UNEXPECTED_IMAGE_FIELD');
  });

  test('rejects productFields that are not JSON, and loose form fields', async () => {
    const brokenJson = await request(app)
      .post(api('/products'))
      .set('Authorization', ADMIN_AUTHORIZATION())
      .field('productFields', '{ not json')
      .attach('images', ...pngAttachment('front.png'));
    expect(brokenJson.status).toBe(400);
    expect(brokenJson.body.code).toBe('INVALID_FIELDS_JSON');

    const looseField = await postProductMultipart(productFields())
      .field('name', 'Loose Name')
      .attach('images', ...pngAttachment('front.png'));
    expect(looseField.status).toBe(400);
    expect(looseField.body.code).toBe('INVALID_FIELDS_JSON');

    expect(uploadImageBufferToCloudinary).not.toHaveBeenCalled();
  });

  test('validates the fields before uploading anything', async () => {
    const res = await postProductMultipart(productFields({ mrp: 'not a number' })).attach(
      'images',
      ...pngAttachment('front.png')
    );

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(uploadImageBufferToCloudinary).not.toHaveBeenCalled();
  });

  test('never lets a customer upload', async () => {
    const res = await request(app)
      .post(api('/products'))
      .set('Authorization', bearerTokenFor('user'))
      .field('productFields', JSON.stringify(productFields()))
      .attach('images', ...pngAttachment('front.png'));

    expect(res.status).toBe(403);
    expect(uploadImageBufferToCloudinary).not.toHaveBeenCalled();
  });

  test('fails cleanly when one upload fails: no product, and the successful uploads are deleted', async () => {
    uploadImageBufferToCloudinary
      .mockResolvedValueOnce({ url: 'https://res.cloudinary.com/x/first.png', publicId: `${PRODUCT_FOLDER}/first` })
      .mockRejectedValueOnce(new Error('Cloudinary is down'))
      .mockResolvedValueOnce({ url: 'https://res.cloudinary.com/x/third.png', publicId: `${PRODUCT_FOLDER}/third` });

    const res = await postProductMultipart(productFields())
      .attach('images', ...pngAttachment('first.png'))
      .attach('images', ...pngAttachment('second.png'))
      .attach('images', ...pngAttachment('third.png'));

    expect(res.status).toBe(502);
    expect(res.body.code).toBe('IMAGE_UPLOAD_FAILED');
    expect(await Product.countDocuments()).toBe(0);
    expect(deletedPublicIds().sort()).toEqual([`${PRODUCT_FOLDER}/first`, `${PRODUCT_FOLDER}/third`]);
  });

  test('deletes the uploaded files when the save fails afterwards (duplicate SKU)', async () => {
    await createStoredProduct({ name: 'Existing', slug: 'existing' });

    const res = await postProductMultipart(productFields())
      .attach('images', ...pngAttachment('front.png'))
      .attach('images', ...pngAttachment('back.png'));

    expect(res.status).toBe(409);
    await waitUntil(() => deletedPublicIds().length === 2);
    const uploadedPublicIds = (await Promise.all(uploadImageBufferToCloudinary.mock.results.map((call) => call.value))).map(
      (uploadedImage) => uploadedImage.publicId
    );
    expect(deletedPublicIds().sort()).toEqual(uploadedPublicIds.sort());
  });

  test('deletes the uploaded files when a business rule fails afterwards (price above MRP)', async () => {
    const res = await postProductMultipart(productFields({ price: 999 })).attach('images', ...pngAttachment('front.png'));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('PRICE_ABOVE_MRP');
    await waitUntil(() => deletedPublicIds().length === 1);
    expect(await Product.countDocuments()).toBe(0);
  });

  test('still accepts a plain JSON create with no files', async () => {
    const res = await request(app).post(api('/products')).set('Authorization', ADMIN_AUTHORIZATION()).send(productFields());

    expect(res.status).toBe(201);
    expect(res.body.data.images).toEqual([]);
    expect(uploadImageBufferToCloudinary).not.toHaveBeenCalled();
  });
});

describe('PATCH /products/:id with image files', () => {
  test('reorders, removes and adds in one request, deleting the removed file only after saving', async () => {
    const product = await createStoredProduct({ images: ['a', 'b', 'c'].map(storedImage) });

    const res = await request(app)
      .patch(api(`/products/${product._id}`))
      .set('Authorization', ADMIN_AUTHORIZATION())
      .field(
        'productFields',
        JSON.stringify({
          images: [{ newImageFileIndex: 0, alt: 'New front' }, { publicId: `${PRODUCT_FOLDER}/c` }, { publicId: `${PRODUCT_FOLDER}/a` }],
        })
      )
      .attach('images', ...jpegAttachment('new-front.jpg'));

    expect(res.status).toBe(200);
    expect(res.body.data.images.map((image) => image.alt)).toEqual(['New front', 'c', 'a']);
    expect(deletedPublicIds()).toEqual([`${PRODUCT_FOLDER}/b`]);

    const saved = await Product.findById(product._id);
    expect(saved.images.map((image) => image.publicId)).not.toContain(`${PRODUCT_FOLDER}/b`);
  });

  test('appends files when no image list is sent, using the stored SKU for the folder', async () => {
    const product = await createStoredProduct({ images: [storedImage('a')] });

    const res = await request(app)
      .patch(api(`/products/${product._id}`))
      .set('Authorization', ADMIN_AUTHORIZATION())
      .attach('images', ...pngAttachment('extra.png'));

    expect(res.status).toBe(200);
    expect(uploadImageBufferToCloudinary.mock.calls[0][1]).toBe(PRODUCT_FOLDER);
    expect(res.body.data.images).toHaveLength(2);
    expect(res.body.data.images[0].publicId).toBe(`${PRODUCT_FOLDER}/a`);
    expect(deletedPublicIds()).toEqual([]);
  });

  test('removes an image over plain JSON and deletes it from Cloudinary', async () => {
    const product = await createStoredProduct({ images: ['a', 'b'].map(storedImage) });

    const res = await request(app)
      .patch(api(`/products/${product._id}`))
      .set('Authorization', ADMIN_AUTHORIZATION())
      .send({ images: [{ publicId: `${PRODUCT_FOLDER}/b` }] });

    expect(res.status).toBe(200);
    expect(res.body.data.images).toHaveLength(1);
    expect(deletedPublicIds()).toEqual([`${PRODUCT_FOLDER}/a`]);
  });

  test('refuses an unknown publicId, leaves the product untouched and deletes the new upload', async () => {
    const product = await createStoredProduct({ images: [storedImage('a')] });

    const res = await request(app)
      .patch(api(`/products/${product._id}`))
      .set('Authorization', ADMIN_AUTHORIZATION())
      .field('productFields', JSON.stringify({ images: [{ publicId: 'someone-else/image' }, { newImageFileIndex: 0 }] }))
      .attach('images', ...pngAttachment('front.png'));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UNKNOWN_IMAGE');
    await waitUntil(() => deletedPublicIds().length === 1);
    expect(deletedPublicIds()[0]).toMatch(/uploaded-/);

    const saved = await Product.findById(product._id);
    expect(saved.images.map((image) => image.publicId)).toEqual([`${PRODUCT_FOLDER}/a`]);
  });

  test('refuses a newImageFileIndex with no matching file', async () => {
    const product = await createStoredProduct();

    const res = await request(app)
      .patch(api(`/products/${product._id}`))
      .set('Authorization', ADMIN_AUTHORIZATION())
      .send({ images: [{ newImageFileIndex: 0 }] });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_IMAGE_FILE_INDEX');
  });

  test('404s before uploading when the product does not exist', async () => {
    const res = await request(app)
      .patch(api(`/products/${new mongoose.Types.ObjectId()}`))
      .set('Authorization', ADMIN_AUTHORIZATION())
      .attach('images', ...pngAttachment('front.png'));

    expect(res.status).toBe(404);
    expect(uploadImageBufferToCloudinary).not.toHaveBeenCalled();
  });
});

describe('category image', () => {
  const CATEGORY_FOLDER = 'laadlibytes/test/categories/kids-wellness';

  test('creates a category with its image in the slug folder', async () => {
    const res = await request(app)
      .post(api('/categories'))
      .set('Authorization', ADMIN_AUTHORIZATION())
      .field('categoryFields', JSON.stringify({ name: 'Kids Wellness', image: { alt: 'Kids banner' } }))
      .attach('image', ...pngAttachment('banner.png'));

    expect(res.status).toBe(201);
    expect(uploadImageBufferToCloudinary.mock.calls[0][1]).toBe(CATEGORY_FOLDER);
    expect(res.body.data.image).toMatchObject({ alt: 'Kids banner' });
    expect(res.body.data.image.publicId).toMatch(/^laadlibytes\/test\/categories\/kids-wellness\//);
  });

  test('accepts only one file', async () => {
    const res = await request(app)
      .post(api('/categories'))
      .set('Authorization', ADMIN_AUTHORIZATION())
      .field('categoryFields', JSON.stringify({ name: 'Kids Wellness' }))
      .attach('image', ...pngAttachment('one.png'))
      .attach('image', ...pngAttachment('two.png'));

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('TOO_MANY_IMAGES');
    expect(uploadImageBufferToCloudinary).not.toHaveBeenCalled();
  });

  test('replacing the image deletes the old file after saving', async () => {
    await Category.updateOne(
      { _id: fruitCategory._id },
      { image: { url: 'https://res.cloudinary.com/x/old.png', publicId: 'old-banner', alt: 'Old' } }
    );

    const res = await request(app)
      .patch(api(`/categories/${fruitCategory._id}`))
      .set('Authorization', ADMIN_AUTHORIZATION())
      .attach('image', ...pngAttachment('new.png'));

    expect(res.status).toBe(200);
    expect(uploadImageBufferToCloudinary.mock.calls[0][1]).toBe('laadlibytes/test/categories/fruit-variant');
    expect(res.body.data.image.publicId).not.toBe('old-banner');
    // No alt was sent, so the old alt text carries over to the new file.
    expect(res.body.data.image.alt).toBe('Old');
    expect(deletedPublicIds()).toEqual(['old-banner']);
  });

  test('image: null removes the image and deletes the file', async () => {
    await Category.updateOne(
      { _id: fruitCategory._id },
      { image: { url: 'https://res.cloudinary.com/x/old.png', publicId: 'old-banner' } }
    );

    const res = await request(app)
      .patch(api(`/categories/${fruitCategory._id}`))
      .set('Authorization', ADMIN_AUTHORIZATION())
      .send({ image: null });

    expect(res.status).toBe(200);
    expect(res.body.data.image).toBeUndefined();
    expect(deletedPublicIds()).toEqual(['old-banner']);
  });

  test('refuses a raw image URL in JSON', async () => {
    const res = await request(app)
      .patch(api(`/categories/${fruitCategory._id}`))
      .set('Authorization', ADMIN_AUTHORIZATION())
      .send({ image: { url: 'https://example.com/banner.png' } });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  test('deleting a category deletes its image', async () => {
    await Category.updateOne(
      { _id: fruitCategory._id },
      { image: { url: 'https://res.cloudinary.com/x/old.png', publicId: 'old-banner' } }
    );

    const res = await request(app).delete(api(`/categories/${fruitCategory._id}`)).set('Authorization', ADMIN_AUTHORIZATION());

    expect(res.status).toBe(204);
    expect(deletedPublicIds()).toEqual(['old-banner']);
  });

  test('a duplicate category name deletes the uploaded file', async () => {
    const res = await request(app)
      .post(api('/categories'))
      .set('Authorization', ADMIN_AUTHORIZATION())
      .field('categoryFields', JSON.stringify({ name: 'Fruit Variant', slug: 'fruit-variant-two' }))
      .attach('image', ...pngAttachment('banner.png'));

    expect(res.status).toBe(409);
    await waitUntil(() => deletedPublicIds().length === 1);
  });
});