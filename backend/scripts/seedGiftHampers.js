import { open, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

import { connectDB, disconnectDB } from '../src/config/database.js';
import { logger } from '../src/config/logger.js';
import {
  deleteCloudinaryAssetsByPublicIds,
  uploadImageBufferToCloudinary,
} from '../src/integrations/storage/cloudinaryImageStorage.js';
import { GiftHamper } from '../src/modules/giftHamper/giftHamper.model.js';
import { createGiftHamperSchema } from '../src/modules/giftHamper/giftHamper.validation.js';
import { buildGiftHamperImageFolderPath } from '../src/utils/cloudinaryFolderPaths.js';
import {
  IMAGE_FILE_SIGNATURE_LENGTH_IN_BYTES,
  MAXIMUM_IMAGE_FILE_SIZE_IN_BYTES,
  detectImageMimeTypeFromFileSignature,
} from '../src/utils/imageFileRules.js';

/**
 * Loads the gift hampers from scripts/data/gifting/giftHampers.json. Safe on production:
 *
 *   npm run seed-hampers                     # create the hampers that are missing; existing ones are left alone
 *   npm run seed-hampers -- --dry-run        # validate the file and the images, write nothing
 *   npm run seed-hampers -- --update         # also overwrite existing hampers' fields with the file's
 *   npm run seed-hampers -- --replace-images # also re-upload the images of existing hampers
 *
 * Matched by `code`. It never deletes a hamper. Image paths in the file are relative to
 * scripts/data/gifting/; like the product photos, the files are local only (gitignored).
 */
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(SCRIPT_DIR, 'data', 'gifting');
const DATA_FILE = path.join(DATA_DIR, 'giftHampers.json');

const flags = new Set(process.argv.slice(2));
const DRY_RUN = flags.has('--dry-run');
const UPDATE = flags.has('--update');
const REPLACE_IMAGES = flags.has('--replace-images');

// The API's own create schema, minus `images` (the seeder uploads files instead) plus the file-only field.
const hamperRowSchema = createGiftHamperSchema.omit({ images: true }).extend({
  imageFiles: z.array(z.string().trim().min(1)).default([]),
});

async function findProblemWithLocalImageFile(filePath) {
  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    return 'file not found';
  }
  if (fileStat.size > MAXIMUM_IMAGE_FILE_SIZE_IN_BYTES) return 'larger than the upload limit';

  const handle = await open(filePath, 'r');
  try {
    const { buffer } = await handle.read(Buffer.alloc(IMAGE_FILE_SIGNATURE_LENGTH_IN_BYTES), 0, IMAGE_FILE_SIGNATURE_LENGTH_IN_BYTES, 0);
    return detectImageMimeTypeFromFileSignature(buffer) ? null : 'not a PNG, JPG, WEBP or AVIF image';
  } finally {
    await handle.close();
  }
}

/** Parses and checks every row before anything is written. Resolves to { hampers, errors }. */
async function buildSeedPlan(rows) {
  const errors = [];
  const hampers = [];
  const seenCodes = new Set();

  for (const [index, row] of rows.entries()) {
    const label = row?.code ?? `row ${index + 1}`;
    const parsed = hamperRowSchema.safeParse(row);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => errors.push(`${label}: ${issue.path.join('.')} ${issue.message}`));
      continue;
    }
    const hamper = parsed.data;

    if (seenCodes.has(hamper.code)) errors.push(`${label}: duplicate code`);
    seenCodes.add(hamper.code);

    const imageFilePaths = hamper.imageFiles.map((file) => path.resolve(DATA_DIR, file));
    for (const [position, filePath] of imageFilePaths.entries()) {
      const problem = await findProblemWithLocalImageFile(filePath);
      if (problem) errors.push(`${label}: imageFiles[${position}] ${hamper.imageFiles[position]}: ${problem}`);
    }

    hampers.push({ ...hamper, imageFilePaths });
  }
  return { hampers, errors };
}

async function uploadImages(hamper) {
  const outcomes = await Promise.allSettled(
    hamper.imageFilePaths.map(async (filePath) =>
      uploadImageBufferToCloudinary(await readFile(filePath), buildGiftHamperImageFolderPath(hamper.code))
    )
  );
  const uploaded = outcomes.filter((outcome) => outcome.status === 'fulfilled').map((outcome) => outcome.value);
  const failure = outcomes.find((outcome) => outcome.status === 'rejected');
  if (failure) {
    await deleteCloudinaryAssetsByPublicIds(uploaded.map((image) => image.publicId));
    throw new Error(`${hamper.code}: image upload failed: ${failure.reason?.message}`);
  }
  return uploaded.map((image, position) => ({
    ...image,
    alt: position === 0 ? `${hamper.name} gift hamper box` : `${hamper.name} image ${position + 1}`,
  }));
}

async function seedHamper(hamper) {
  const { imageFiles, imageFilePaths, ...fields } = hamper;
  const existing = await GiftHamper.findOne({ code: fields.code });

  if (existing && !UPDATE && !REPLACE_IMAGES) return 'kept';

  const shouldUpload = imageFilePaths.length > 0 && (!existing || REPLACE_IMAGES || existing.images.length === 0);
  const uploadedImages = shouldUpload ? await uploadImages(hamper) : [];
  const replacedPublicIds = shouldUpload && existing ? existing.images.map((image) => image.publicId) : [];

  const document = existing ?? new GiftHamper();
  if (!existing || UPDATE) document.set(fields);
  if (shouldUpload) document.set('images', uploadedImages);

  try {
    await document.save();
  } catch (saveError) {
    await deleteCloudinaryAssetsByPublicIds(uploadedImages.map((image) => image.publicId));
    throw saveError;
  }
  await deleteCloudinaryAssetsByPublicIds(replacedPublicIds);
  if (uploadedImages.length) logger.info(`${fields.code}: uploaded ${uploadedImages.length} image(s)`);
  return existing ? 'updated' : 'created';
}

async function main() {
  const rows = JSON.parse(await readFile(DATA_FILE, 'utf8'));
  if (!Array.isArray(rows)) throw new Error('giftHampers.json must be an array');

  const { hampers, errors } = await buildSeedPlan(rows);
  if (errors.length) {
    errors.forEach((error) => logger.error(error));
    throw new Error(`${errors.length} problem(s) in giftHampers.json; nothing was written`);
  }
  if (DRY_RUN) {
    logger.info(`--dry-run: ${hampers.length} hamper(s) valid; nothing written or uploaded`);
    return;
  }

  await connectDB();
  try {
    const counts = { created: 0, updated: 0, kept: 0 };
    for (const hamper of hampers) {
      const outcome = await seedHamper(hamper);
      counts[outcome] += 1;
      logger.info(`${hamper.code}: ${outcome}`);
    }
    logger.info(`Gift hampers: ${counts.created} created, ${counts.updated} updated, ${counts.kept} left as they were`);
  } finally {
    await disconnectDB();
  }
}

main().catch((seedError) => {
  logger.error(`seed-hampers failed: ${seedError.message}`);
  process.exitCode = 1;
});