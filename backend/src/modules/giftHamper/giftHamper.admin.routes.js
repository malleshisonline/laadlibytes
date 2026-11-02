import { Router } from 'express';

import {
  deleteUploadedImagesWhenRequestFails,
  parseJsonFieldsFromMultipartBody,
  parseMultipartImageFiles,
  rejectNonPngOrJpegFiles,
  uploadGiftHamperImagesToCloudinary,
} from '../../middlewares/cloudinaryUpload.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { MAXIMUM_PRODUCT_IMAGE_FILES_PER_REQUEST } from '../../utils/imageFileRules.js';

import { giftHamperController } from './giftHamper.controller.js';
import {
  createGiftHamperSchema,
  giftHamperIdParamSchema,
  reorderGiftHampersSchema,
  updateGiftHamperSchema,
} from './giftHamper.validation.js';

/**
 * Mounted at /admin/gift-hampers by src/modules/admin/admin.routes.js, which already applied
 * `authenticate` and `authorize('admin')` — no route here repeats the guard.
 */
const router = Router();

/**
 * The same chain as products: JSON, or multipart/form-data with the fields as JSON in `hamperFields` and
 * the files in `images`. Everything is checked before the upload, and a failed request deletes its uploads.
 */
const imageUploadSteps = [
  parseMultipartImageFiles({ fileFieldName: 'images', maximumFileCount: MAXIMUM_PRODUCT_IMAGE_FILES_PER_REQUEST }),
  rejectNonPngOrJpegFiles,
  parseJsonFieldsFromMultipartBody('hamperFields'),
];

const imageStorageSteps = [deleteUploadedImagesWhenRequestFails, uploadGiftHamperImagesToCloudinary];

router
  .route('/')
  .get(giftHamperController.adminList)
  .post(...imageUploadSteps, validate({ body: createGiftHamperSchema }), ...imageStorageSteps, giftHamperController.create);

// Registered before /:id, so "reorder" is never read as an id.
router.post('/reorder', validate({ body: reorderGiftHampersSchema }), giftHamperController.reorder);

router
  .route('/:id')
  .get(validate({ params: giftHamperIdParamSchema }), giftHamperController.adminGetById)
  .patch(
    ...imageUploadSteps,
    validate({ params: giftHamperIdParamSchema, body: updateGiftHamperSchema }),
    ...imageStorageSteps,
    giftHamperController.update
  )
  .delete(validate({ params: giftHamperIdParamSchema }), giftHamperController.remove);

export default router;