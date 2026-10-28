import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import mongoose from 'mongoose';

import { connectDB, disconnectDB } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/config/logger.js';

const MODULES_DIR = fileURLToPath(new URL('../src/modules/', import.meta.url));

/** Imports every src/modules/<name>/<name>.model.js, so each model (and its declared indexes) is registered. */
async function loadModels() {
  const modules = await readdir(MODULES_DIR, { withFileTypes: true });
  for (const entry of modules.filter((dirent) => dirent.isDirectory())) {
    const files = await readdir(path.join(MODULES_DIR, entry.name));
    for (const file of files.filter((name) => name.endsWith('.model.js'))) {
      await import(pathToFileURL(path.join(MODULES_DIR, entry.name, file)).href);
    }
  }
}

/**
 * Builds every index the models declare. Production has autoIndex off, so run this after each deploy that adds one:
 *
 *   npm run sync-indexes
 *
 * It only adds missing indexes and never drops any, so running it again is harmless. It uses MONGO_URI from the
 * environment it runs in. A unique index that cannot build (two documents already share the value) is reported
 * and the script exits non-zero.
 */
async function syncIndexes() {
  await loadModels();
  await connectDB();
  // The host and database name, never the credentials, so the log shows which database this ran on.
  logger.info(`Syncing indexes on ${mongoose.connection.host}/${mongoose.connection.name} (NODE_ENV=${env.NODE_ENV})`);

  const failed = [];
  try {
    for (const name of mongoose.modelNames()) {
      const model = mongoose.model(name);
      try {
        await model.createIndexes();
        const indexes = await model.collection.indexes();
        logger.info(`${model.collection.name}: ${indexes.map((index) => index.name).join(', ')}`);
      } catch (indexError) {
        failed.push(name);
        logger.error(`${model.collection.name}: ${indexError.message}`);
      }
    }
  } finally {
    await disconnectDB();
  }

  if (failed.length) throw new Error(`could not build indexes for ${failed.join(', ')}`);
  logger.info('All indexes are in place');
}

syncIndexes().catch((syncError) => {
  logger.error(`sync-indexes failed: ${syncError.message}`);
  process.exitCode = 1;
});
