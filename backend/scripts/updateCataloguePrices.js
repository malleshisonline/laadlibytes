import { readFile } from 'node:fs/promises';

import { connectDB, disconnectDB } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';
import { Product } from '../src/modules/product/product.model.js';

const PRODUCTS_FILE = new URL('./data/products.json', import.meta.url);
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Copies `mrp` and `price` from scripts/data/products.json onto the stored products, matched by SKU, and changes
 * nothing else: unlike `npm run seed`, stock, descriptions, images and the publish switch are left as the admin
 * set them. Past orders keep the prices they were sold at (each order has its own copy).
 *
 *   npm run update-prices -- --dry-run   # show what would change, write nothing
 *   npm run update-prices
 */
async function updateCataloguePrices() {
  const products = JSON.parse(await readFile(PRODUCTS_FILE, 'utf8'));

  for (const { sku, mrp, price } of products) {
    if (!Number.isInteger(mrp) || !Number.isInteger(price) || mrp < 1 || price < 1 || price > mrp) {
      throw new Error(`${sku}: mrp and price must be whole rupees with price ≤ mrp (got mrp ${mrp}, price ${price})`);
    }
  }

  await connectDB();
  try {
    const stored = await Product.find({ sku: { $in: products.map((product) => product.sku) } })
      .select('sku name mrp price')
      .lean();
    const storedBySku = new Map(stored.map((product) => [product.sku, product]));
    const counts = { updated: 0, unchanged: 0, missing: 0 };

    for (const { sku, mrp, price } of products) {
      const current = storedBySku.get(sku);
      if (!current) {
        counts.missing += 1;
        logger.warn(`${sku}: not in the database, skipped (add it with npm run seed)`);
        continue;
      }
      if (current.mrp === mrp && current.price === price) {
        counts.unchanged += 1;
        continue;
      }

      logger.info(`${sku} ${current.name}: MRP ₹${current.mrp} → ₹${mrp}, price ₹${current.price} → ₹${price}`);
      if (!DRY_RUN) await Product.updateOne({ sku }, { $set: { mrp, price } });
      counts.updated += 1;
    }

    const verb = DRY_RUN ? 'would be updated' : 'updated';
    logger.info(`${counts.updated} ${verb}, ${counts.unchanged} already up to date, ${counts.missing} missing`);
    if (DRY_RUN) logger.info('--dry-run: nothing written');
  } finally {
    await disconnectDB();
  }
}

updateCataloguePrices().catch((updateError) => {
  logger.error(`update-prices failed: ${updateError.message}`);
  process.exitCode = 1;
});
