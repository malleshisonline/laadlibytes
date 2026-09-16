import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import { connectDB, disconnectDB } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';
import { Category } from '../src/modules/category/category.model.js';
import { Product } from '../src/modules/product/product.model.js';
import { createProductSchema } from '../src/modules/product/product.validation.js';
import { slugify } from '../src/utils/slug.js';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');

const flags = new Set(process.argv.slice(2));
const DRY_RUN = flags.has('--dry-run');
const FRESH = flags.has('--fresh');

/**
 * The seed file joins products to categories by NAME, so the API's own create schema is reused
 * with that single field swapped out. Every other rule stays identical to the live endpoint.
 */
const productRowSchema = createProductSchema
  .omit({ category: true })
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

async function upsertCategories(categories) {
  const slugs = categories.map((category) => category.slug);
  const existing = await Category.find({ slug: { $in: slugs } }).select('slug').lean();
  const existingSlugs = new Set(existing.map((category) => category.slug));

  for (const category of categories) {
    await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: category },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
    );
  }

  return {
    created: categories.filter((category) => !existingSlugs.has(category.slug)).length,
    updated: categories.filter((category) => existingSlugs.has(category.slug)).length,
  };
}

async function upsertProducts(products) {
  const stored = await Category.find({}).select('name').lean();
  const categoryIdByName = new Map(stored.map((category) => [category.name, category._id]));

  const skus = products.map((product) => product.sku);
  const existing = await Product.find({ sku: { $in: skus } }).select('sku').lean();
  const existingSkus = new Set(existing.map((product) => product.sku));

  for (const product of products) {
    const { categoryName, ...fields } = product;
    await Product.findOneAndUpdate(
      { sku: fields.sku },
      { $set: { ...fields, category: categoryIdByName.get(categoryName) } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true, runValidators: true }
    );
  }

  return {
    created: products.filter((product) => !existingSkus.has(product.sku)).length,
    updated: products.filter((product) => existingSkus.has(product.sku)).length,
  };
}

function reportContentGaps(products) {
  const missing = (predicate) => products.filter(predicate).length;
  logger.info(
    `Content gaps — no description: ${missing((p) => !p.description)}, ` +
      `no shelf life: ${missing((p) => !p.shelfLife)}, ` +
      `no images: ${missing((p) => !p.images?.length)}`
  );
}

async function main() {
  const [categoryRows, productRows] = await Promise.all([
    readJsonArray('categories.json'),
    readJsonArray('products.json'),
  ]);

  const { categories, products, errors } = buildSeedPlan(categoryRows, productRows);

  if (errors.length) {
    logger.error(`Seed aborted: ${errors.length} problem(s) in the seed data, nothing was written`);
    errors.forEach((error) => logger.error(`  - ${error}`));
    throw new Error('Invalid seed data');
  }

  logger.info(`Validated ${categories.length} categories and ${products.length} products`);
  reportContentGaps(products);

  if (DRY_RUN) {
    logger.info('--dry-run: validation only, nothing written');
    return;
  }

  await connectDB();

  try {
    // autoIndex is off in production, and even in dev the unique indexes should exist before
    // the first upsert rather than race it.
    await Promise.all([Category.init(), Product.init()]);

    if (FRESH) {
      const [removedProducts, removedCategories] = await Promise.all([
        Product.deleteMany({}),
        Category.deleteMany({}),
      ]);
      logger.warn(
        `--fresh: removed ${removedProducts.deletedCount} products and ${removedCategories.deletedCount} categories`
      );
    }

    const categoryResult = await upsertCategories(categories);
    logger.info(`Categories: ${categoryResult.created} created, ${categoryResult.updated} updated`);

    const productResult = await upsertProducts(products);
    logger.info(`Products: ${productResult.created} created, ${productResult.updated} updated`);

    logger.info('Catalogue seed complete');
  } finally {
    await disconnectDB();
  }
}

main().catch((error) => {
  logger.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
});