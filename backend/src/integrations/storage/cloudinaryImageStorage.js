import { randomUUID } from 'node:crypto';

import { logger } from '../../config/logger.js';

import { cloudinaryClient } from './cloudinaryClient.js';

// Cloudinary re-checks the format on its side too, so a file that slipped past the byte check
// is still refused. It reports JPEG as "jpg". Keep in step with src/utils/imageFileRules.js.
const CLOUDINARY_ALLOWED_IMAGE_FORMATS = ['png', 'jpg', 'webp', 'avif'];

/**
 * Uploads one in-memory image and resolves to { url, publicId }.
 * Each file gets a random name, so a replacement never overwrites a file that a saved document
 * may still point at. `folder` works on both fixed- and dynamic-folder accounts and creates the
 * folder on first use; the public id Cloudinary returns is what gets stored, whatever the mode.
 */
export function uploadImageBufferToCloudinary(imageBuffer, folderPath) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinaryClient.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: folderPath,
        public_id: randomUUID(),
        allowed_formats: CLOUDINARY_ALLOWED_IMAGE_FORMATS,
        overwrite: false,
      },
      (uploadError, uploadResponse) => {
        if (uploadError) return reject(uploadError);
        return resolve({ url: uploadResponse.secure_url, publicId: uploadResponse.public_id });
      }
    );
    uploadStream.end(imageBuffer);
  });
}

/** Deletes one image. Throws when Cloudinary cannot be reached; "not found" counts as done. */
export async function deleteCloudinaryAssetByPublicId(publicId) {
  const deletionResponse = await cloudinaryClient.uploader.destroy(publicId, {
    resource_type: 'image',
    invalidate: true,
  });
  if (!['ok', 'not found'].includes(deletionResponse?.result)) {
    throw new Error(`Cloudinary refused to delete ${publicId}: ${deletionResponse?.result}`);
  }
}

/**
 * Best-effort cleanup that never throws, because it runs after the database is already in its
 * final state. A failure leaves an orphan file behind, so it is logged with the public id
 * for manual removal.
 */
export async function deleteCloudinaryAssetsByPublicIds(publicIds = []) {
  const publicIdsToDelete = [...new Set(publicIds.filter(Boolean))];

  const deletionOutcomes = await Promise.allSettled(publicIdsToDelete.map(deleteCloudinaryAssetByPublicId));

  deletionOutcomes.forEach((deletionOutcome, index) => {
    if (deletionOutcome.status === 'rejected') {
      logger.warn(`Orphaned Cloudinary image, delete it by hand: ${publicIdsToDelete[index]}`, {
        reason: deletionOutcome.reason?.message,
      });
    }
  });
}

export default uploadImageBufferToCloudinary;