import { open, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import { connectDB, disconnectDB } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/config/logger.js';
import {
  deleteCloudinaryAssetsByPublicIds,
  uploadImageBufferToCloudinary,
} from '../src/integrations/storage/cloudinaryImageStorage.js';
import { Category } from '../src/modules/category/category.model.js';
import { Product } from '../src/modules/product/product.model.js';
import { createProductSchema } from '../src/modules/product/product.validation.js';
import { buildCategoryImageFolderPath, buildProductImageFolderPath } from '../src/utils/cloudinaryFolderPaths.js';
import {
  ALLOWED_IMAGE_FILE_EXTENSIONS,
  IMAGE_FILE_SIGNATURE_LENGTH_IN_BYTES,
  MAXIMUM_IMAGE_FILE_SIZE_IN_BYTES,
  detectImageMimeTypeFromFileSignature,
} from '../src/utils/imageFileRules.js';
import { slugify } from '../src/utils/slug.js';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
// scripts/data/product-images/<SKU>/1-front.jpg, 2-back.jpg … — filename order is image order.
const PRODUCT_IMAGES_DIR = path.join(DATA_DIR, 'product-images');
// scripts/data/category-images/<slug>.png
const CATEGORY_IMAGES_DIR = path.join(DATA_DIR, 'category-images');

const flags = new Set(process.argv.slice(2));
const DRY_RUN = flags.has('--dry-run');
const FRESH = flags.has('--fresh');
// Without it, a product or category that already has images keeps them and nothing is uploaded.
const REPLACE_IMAGES = flags.has('--replace-images');

// Files the operating system drops into folders on its own; never treated as images.
const IGNORED_SYSTEM_FILE_NAMES = new Set(['.ds_store', 'thumbs.db', 'desktop.ini']);
const isIgnoredSystemFile = (fileName) => fileName.startsWith('.') || IGNORED_SYSTEM_FILE_NAMES.has(fileName.toLowerCase());

const MIME_TYPE_BY_FILE_EXTENSION = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

const sortFileNamesInNaturalOrder = (fileNames) =>
  [...fileNames].sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }));

/**
 * The seed file joins products to categories by NAME, so the API's own create schema is reused
 * with that single field swapped out. Every other rule stays identical to the live endpoint.
 * Images are not read from the JSON at all: they come from the product-images folder.
 */
const productRowSchema = createProductSchema
  .omit({ category: true, images: true })
  .extend({ category: z.string().trim().min(1, 'is required') });

const categoryRowSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(500).optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// "" in the JSON means "the client has not supplied this yet" — store nothing rather than
// an empty string, so the field is genuinely absent until someone fills it in.
const blankToUndefined = (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value);

const readJsonArray = async (file) => {
  const raw = await readFile(path.join(DATA_DIR, file), 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error(`${file} must contain a JSON array`);
  return parsed;
};

const formatIssue = (label, issue) => `${label}: ${issue.path.join('.') || 'row'} ${issue.message}`;

/** Validates both files completely before a single write happens. */
function buildSeedPlan(categoryRows, productRows) {
  const errors = [];

  const categories = [];
  categoryRows.forEach((row, index) => {
    const label = `categories[${index}]${row?.name ? ` (${row.name})` : ''}`;
    const result = categoryRowSchema.safeParse(row);
    if (!result.success) {
      result.error.issues.forEach((issue) => errors.push(formatIssue(label, issue)));
      return;
    }
    categories.push({
      ...result.data,
      slug: slugify(result.data.slug ?? result.data.name),
      description: blankToUndefined(result.data.description),
    });
  });

  const knownCategoryNames = new Set(categories.map((category) => category.name));

  const products = [];
  productRows.forEach((row, index) => {
    const label = row?.sku ? String(row.sku) : `products[${index}]`;
    if (row && Object.hasOwn(row, 'images')) {
      errors.push(`${label}: "images" is no longer read from products.json — put the files in product-images/<SKU>/`);
      return;
    }
    const result = productRowSchema.safeParse(row);
    if (!result.success) {
      result.error.issues.forEach((issue) => errors.push(formatIssue(label, issue)));
      return;
    }

    const data = result.data;

    if (!knownCategoryNames.has(data.category)) {
      errors.push(`${label}: unknown category "${data.category}" — not present in categories.json`);
      return;
    }

    const price = data.price ?? data.mrp;
    if (price > data.mrp) {
      errors.push(`${label}: price ${price} is above MRP ${data.mrp}`);
      return;
    }

    const { category: categoryName, ...rest } = data;
    products.push({
      ...rest,
      categoryName,
      price,
      sku: data.sku.toUpperCase(),
      slug: slugify(data.slug ?? data.name),
      description: blankToUndefined(data.description),
      shelfLife: blankToUndefined(data.shelfLife),
      allergenInfo: blankToUndefined(data.allergenInfo),
    });
  });

  // Duplicates inside the file itself would silently collapse during upsert, so catch them here.
  const seenSkus = new Set();
  const seenSlugs = new Set();
  products.forEach((product) => {
    if (seenSkus.has(product.sku)) errors.push(`${product.sku}: duplicate sku in products.json`);
    if (seenSlugs.has(product.slug)) errors.push(`${product.sku}: duplicate slug "${product.slug}" in products.json`);
    seenSkus.add(product.sku);
    seenSlugs.add(product.slug);
  });

  return { categories, products, errors };
}

/**
 * Applies the same rules as the admin upload: an allowed format by extension *and* by the file's
 * first bytes, and no bigger than the API limit. Returns a problem description, or null when the file is fine.
 */
async function findProblemWithLocalImageFile(imageFilePath) {
  const extension = path.extname(imageFilePath).toLowerCase();
  if (!ALLOWED_IMAGE_FILE_EXTENSIONS.includes(extension)) {
    return `not a ${ALLOWED_IMAGE_FILE_EXTENSIONS.join(', ')} file`;
  }

  const { size } = await stat(imageFilePath);
  if (size > MAXIMUM_IMAGE_FILE_SIZE_IN_BYTES) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB is over the ${MAXIMUM_IMAGE_FILE_SIZE_IN_BYTES / (1024 * 1024)} MB limit`;
  }

  const imageFileHandle = await open(imageFilePath, 'r');
  try {
    const signatureBytes = Buffer.alloc(IMAGE_FILE_SIGNATURE_LENGTH_IN_BYTES);
    await imageFileHandle.read(signatureBytes, 0, signatureBytes.length, 0);
    if (detectImageMimeTypeFromFileSignature(signatureBytes) !== MIME_TYPE_BY_FILE_EXTENSION[extension]) {
      return `its contents are not really ${extension.slice(1).toUpperCase()}`;
    }
  } finally {
    await imageFileHandle.close();
  }
  return null;
}

const readDirectoryEntriesIfPresent = async (directoryPath) => {
  try {
    return await readdir(directoryPath, { withFileTypes: true });
  } catch (readError) {
    if (readError.code === 'ENOENT') return [];
    throw readError;
  }
};

/** Maps each SKU to its image file paths in display order. Validates every file. */
async function collectProductImageFilePathsBySku(knownSkus) {
  const errors = [];
  const imageFilePathsBySku = new Map();
  const relativeLabel = (...segments) => path.posix.join('product-images', ...segments);

  for (const skuEntry of await readDirectoryEntriesIfPresent(PRODUCT_IMAGES_DIR)) {
    if (isIgnoredSystemFile(skuEntry.name)) continue;
    if (!skuEntry.isDirectory()) {
      errors.push(`${relativeLabel(skuEntry.name)}: put product images inside a folder named after the SKU`);
      continue;
    }

    const sku = skuEntry.name.toUpperCase();
    if (!knownSkus.has(sku)) {
      errors.push(`${relativeLabel(skuEntry.name)}: no product with SKU "${sku}" in products.json`);
      continue;
    }

    const skuDirectoryPath = path.join(PRODUCT_IMAGES_DIR, skuEntry.name);
    const imageFileEntries = (await readdir(skuDirectoryPath, { withFileTypes: true })).filter(
      (imageFileEntry) => !isIgnoredSystemFile(imageFileEntry.name)
    );

    const imageFilePaths = [];
    for (const imageFileName of sortFileNamesInNaturalOrder(imageFileEntries.map((imageFileEntry) => imageFileEntry.name))) {
      const imageFileEntry = imageFileEntries.find((candidate) => candidate.name === imageFileName);
      if (!imageFileEntry.isFile()) {
        errors.push(`${relativeLabel(skuEntry.name, imageFileName)}: sub-folders are not read`);
        continue;
      }
      const imageFilePath = path.join(skuDirectoryPath, imageFileName);
      const problem = await findProblemWithLocalImageFile(imageFilePath);
      if (problem) errors.push(`${relativeLabel(skuEntry.name, imageFileName)}: ${problem}`);
      else imageFilePaths.push(imageFilePath);
    }

    if (imageFilePaths.length) imageFilePathsBySku.set(sku, imageFilePaths);
  }

  return { imageFilePathsBySku, errors };
}

/** Maps each category slug to its single image file (category-images/<slug>.png). */
async function collectCategoryImageFilePathBySlug(knownSlugs) {
  const errors = [];
  const imageFilePathBySlug = new Map();
  const relativeLabel = (fileName) => path.posix.join('category-images', fileName);

  for (const imageFileEntry of await readDirectoryEntriesIfPresent(CATEGORY_IMAGES_DIR)) {
    if (isIgnoredSystemFile(imageFileEntry.name)) continue;
    if (!imageFileEntry.isFile()) {
      errors.push(`${relativeLabel(imageFileEntry.name)}: expected a file named <category-slug>.png or .jpg`);
      continue;
    }

    const slug = path.parse(imageFileEntry.name).name.toLowerCase();
    if (!knownSlugs.has(slug)) {
      errors.push(`${relativeLabel(imageFileEntry.name)}: no category with slug "${slug}" in categories.json`);
      continue;
    }
    if (imageFilePathBySlug.has(slug)) {
      errors.push(`${relativeLabel(imageFileEntry.name)}: category "${slug}" already has an image file`);
      continue;
    }

    const imageFilePath = path.join(CATEGORY_IMAGES_DIR, imageFileEntry.name);
    const problem = await findProblemWithLocalImageFile(imageFilePath);
    if (problem) errors.push(`${relativeLabel(imageFileEntry.name)}: ${problem}`);
    else imageFilePathBySlug.set(slug, imageFilePath);
  }

  return { imageFilePathBySlug, errors };
}

/**
 * Uploads local files in parallel and resolves to [{ url, publicId }] in the same order.
 * All or nothing: when one fails, the others are deleted again and the error is rethrown.
 */
async function uploadLocalImageFilesToCloudinary(imageFilePaths, cloudinaryFolderPath) {
  const uploadOutcomes = await Promise.allSettled(
    imageFilePaths.map(async (imageFilePath) =>
      uploadImageBufferToCloudinary(await readFile(imageFilePath), cloudinaryFolderPath)
    )
  );

  const successfulUploads = uploadOutcomes
    .filter((uploadOutcome) => uploadOutcome.status === 'fulfilled')
    .map((uploadOutcome) => uploadOutcome.value);
  const firstUploadFailure = uploadOutcomes.find((uploadOutcome) => uploadOutcome.status === 'rejected');

  if (firstUploadFailure) {
    await deleteCloudinaryAssetsByPublicIds(successfulUploads.map((uploadedImage) => uploadedImage.publicId));
    throw new Error(`Upload to ${cloudinaryFolderPath} failed: ${firstUploadFailure.reason?.message}`);
  }
  return successfulUploads;
}

/**
 * Saves one document. When the save fails, the files uploaded for it are deleted so a failed run
 * leaves no orphans. When it succeeds, the files it replaced are deleted.
 */
async function saveWithImageCleanup(saveDocument, { newlyUploadedPublicIds, replacedPublicIds }) {
  try {
    await saveDocument();
  } catch (saveError) {
    await deleteCloudinaryAssetsByPublicIds(newlyUploadedPublicIds);
    throw saveError;
  }
  await deleteCloudinaryAssetsByPublicIds(replacedPublicIds);
}

async function upsertCategories(categories, imageFilePathBySlug) {
  const slugs = categories.map((category) => category.slug);
  const existing = await Category.find({ slug: { $in: slugs } }).select('slug image').lean();
  const existingCategoryBySlug = new Map(existing.map((category) => [category.slug, category]));
  const counts = { created: 0, updated: 0, imagesUploaded: 0, imagesKept: 0 };

  for (const category of categories) {
    const storedImage = existingCategoryBySlug.get(category.slug)?.image;
    const imageFilePath = imageFilePathBySlug.get(category.slug);
    const fieldsToSet = { ...category };
    let newlyUploadedPublicIds = [];
    let replacedPublicIds = [];

    if (imageFilePath && storedImage && !REPLACE_IMAGES) {
      counts.imagesKept += 1;
    } else if (imageFilePath) {
      const [uploadedImage] = await uploadLocalImageFilesToCloudinary(
        [imageFilePath],
        buildCategoryImageFolderPath(category.slug)
      );
      fieldsToSet.image = { ...uploadedImage, alt: category.name };
      newlyUploadedPublicIds = [uploadedImage.publicId];
      replacedPublicIds = [storedImage?.publicId];
      counts.imagesUploaded += 1;
    }

    await saveWithImageCleanup(
      () =>
        Category.findOneAndUpdate(
          { slug: category.slug },
          { $set: fieldsToSet },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
        ),
      { newlyUploadedPublicIds, replacedPublicIds }
    );

    if (existingCategoryBySlug.has(category.slug)) counts.updated += 1;
    else counts.created += 1;
  }

  return counts;
}

const buildProductImageAltText = (productName, position) =>
  position === 0 ? `${productName} front of pack` : `${productName} image ${position + 1}`;

async function upsertProducts(products, imageFilePathsBySku) {
  const stored = await Category.find({}).select('name').lean();
  const categoryIdByName = new Map(stored.map((category) => [category.name, category._id]));

  const skus = products.map((product) => product.sku);
  const existing = await Product.find({ sku: { $in: skus } }).select('sku images').lean();
  const existingProductBySku = new Map(existing.map((product) => [product.sku, product]));
  const counts = { created: 0, updated: 0, imagesUploaded: 0, productsWithImagesKept: 0 };

  for (const product of products) {
    const { categoryName, ...fields } = product;
    const storedImages = existingProductBySku.get(fields.sku)?.images ?? [];
    const imageFilePaths = imageFilePathsBySku.get(fields.sku) ?? [];
    const fieldsToSet = { ...fields, category: categoryIdByName.get(categoryName) };
    let newlyUploadedPublicIds = [];
    let replacedPublicIds = [];

    // No local files: whatever images the product has are left alone, even with --replace-images.
    if (imageFilePaths.length && storedImages.length && !REPLACE_IMAGES) {
      counts.productsWithImagesKept += 1;
    } else if (imageFilePaths.length) {
      const uploadedImages = await uploadLocalImageFilesToCloudinary(
        imageFilePaths,
        buildProductImageFolderPath(fields.sku)
      );
      fieldsToSet.images = uploadedImages.map((uploadedImage, position) => ({
        ...uploadedImage,
        alt: buildProductImageAltText(fields.name, position),
      }));
      newlyUploadedPublicIds = uploadedImages.map((uploadedImage) => uploadedImage.publicId);
      replacedPublicIds = storedImages.map((storedImage) => storedImage.publicId);
      counts.imagesUploaded += uploadedImages.length;
      logger.info(`${fields.sku}: uploaded ${uploadedImages.length} image(s)`);
    }

    await saveWithImageCleanup(
      () =>
        Product.findOneAndUpdate(
          { sku: fields.sku },
          { $set: fieldsToSet },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
        ),
      { newlyUploadedPublicIds, replacedPublicIds }
    );

    if (existingProductBySku.has(fields.sku)) counts.updated += 1;
    else counts.created += 1;
  }

  return counts;
}

/** --fresh removes the documents, so the Cloudinary files they point at go too. */
async function deleteWholeCatalogueWithImages() {
  const [storedProducts, storedCategories] = await Promise.all([
    Product.find({}).select('images.publicId').lean(),
    Category.find({}).select('image.publicId').lean(),
  ]);
  const storedPublicIds = [
    ...storedProducts.flatMap((product) => (product.images ?? []).map((image) => image.publicId)),
    ...storedCategories.map((category) => category.image?.publicId),
  ];

  const [removedProducts, removedCategories] = await Promise.all([Product.deleteMany({}), Category.deleteMany({})]);
  await deleteCloudinaryAssetsByPublicIds(storedPublicIds);

  logger.warn(
    `--fresh: removed ${removedProducts.deletedCount} products, ${removedCategories.deletedCount} categories ` +
      `and their ${storedPublicIds.filter(Boolean).length} Cloudinary image(s)`
  );
}

function reportContentGaps(products, imageFilePathsBySku) {
  const missing = (predicate) => products.filter(predicate).length;
  logger.info(
    `Content gaps — no description: ${missing((p) => !p.description)}, ` +
      `no shelf life: ${missing((p) => !p.shelfLife)}, ` +
      `no image files: ${missing((p) => !imageFilePathsBySku.has(p.sku))}`
  );
}

async function main() {
  const [categoryRows, productRows] = await Promise.all([
    readJsonArray('categories.json'),
    readJsonArray('products.json'),
  ]);

  const { categories, products, errors: rowErrors } = buildSeedPlan(categoryRows, productRows);
  const [productImageScan, categoryImageScan] = await Promise.all([
    collectProductImageFilePathsBySku(new Set(products.map((product) => product.sku))),
    collectCategoryImageFilePathBySlug(new Set(categories.map((category) => category.slug))),
  ]);
  const errors = [...rowErrors, ...productImageScan.errors, ...categoryImageScan.errors];

  if (errors.length) {
    logger.error(`Seed aborted: ${errors.length} problem(s) in the seed data, nothing was written or uploaded`);
    errors.forEach((error) => logger.error(`  - ${error}`));
    throw new Error('Invalid seed data');
  }

  const localProductImageCount = [...productImageScan.imageFilePathsBySku.values()].flat().length;
  logger.info(
    `Validated ${categories.length} categories, ${products.length} products, ` +
      `${localProductImageCount} product image file(s) and ${categoryImageScan.imageFilePathBySlug.size} category image file(s)`
  );
  logger.info(`Images go to Cloudinary under laadlibytes/${env.NODE_ENV}/ (set by NODE_ENV)`);
  reportContentGaps(products, productImageScan.imageFilePathsBySku);

  if (DRY_RUN) {
    logger.info('--dry-run: validation only, nothing written or uploaded');
    return;
  }

  await connectDB();

  try {
    // autoIndex is off in production, and even in dev the unique indexes should exist before
    // the first upsert rather than race it.
    await Promise.all([Category.init(), Product.init()]);

    if (FRESH) await deleteWholeCatalogueWithImages();

    const categoryResult = await upsertCategories(categories, categoryImageScan.imageFilePathBySlug);
    logger.info(
      `Categories: ${categoryResult.created} created, ${categoryResult.updated} updated, ` +
        `${categoryResult.imagesUploaded} image(s) uploaded, ${categoryResult.imagesKept} kept`
    );

    const productResult = await upsertProducts(products, productImageScan.imageFilePathsBySku);
    logger.info(
      `Products: ${productResult.created} created, ${productResult.updated} updated, ` +
        `${productResult.imagesUploaded} image(s) uploaded, ${productResult.productsWithImagesKept} kept their images`
    );
    if (productResult.productsWithImagesKept || categoryResult.imagesKept) {
      logger.info('Existing images were kept; rerun with --replace-images to upload the local files over them');
    }

    logger.info('Catalogue seed complete');
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  logger.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
});