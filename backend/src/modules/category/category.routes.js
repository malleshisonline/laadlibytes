import { Router } from 'express';

import { authenticate, authorize, optionalAuth } from '../../middlewares/authenticate.js';
import {
  deleteUploadedImagesWhenRequestFails,
  parseJsonFieldsFromMultipartBody,
  parseMultipartImageFiles,
  rejectNonPngOrJpegFiles,
  uploadCategoryImageToCloudinary,
} from '../../middlewares/cloudinaryUpload.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { MAXIMUM_CATEGORY_IMAGE_FILES_PER_REQUEST } from '../../utils/imageFileRules.js';

import { categoryController } from './category.controller.js';
import {
  categoryIdParamSchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from './category.validation.js';

const router = Router();

/**
 * Accepts JSON, or multipart/form-data with the fields as JSON in `categoryFields` and one file in
 * `image`. Everything is checked before the upload; a failed request deletes what it uploaded.
 */
const categoryImageUploadSteps = [
  parseMultipartImageFiles({ fileFieldName: 'image', maximumFileCount: MAXIMUM_CATEGORY_IMAGE_FILES_PER_REQUEST }),
  rejectNonPngOrJpegFiles,
  parseJsonFieldsFromMultipartBody('categoryFields'),
];

const categoryImageStorageSteps = [deleteUploadedImagesWhenRequestFails, uploadCategoryImageToCloudinary];

// Public storefront nav. optionalAuth so an admin can also ask for inactive categories.
router.get('/', optionalAuth, validate({ query: listCategoriesQuerySchema }), categoryController.list);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  ...categoryImageUploadSteps,
  validate({ body: createCategorySchema }),
  ...categoryImageStorageSteps,
  categoryController.create
);

router
  .route('/:id')
  .patch(
    authenticate,
    authorize('admin'),
    ...categoryImageUploadSteps,
    validate({ params: categoryIdParamSchema, body: updateCategorySchema }),
    ...categoryImageStorageSteps,
    categoryController.update
  )
  .delete(
    authenticate,
    authorize('admin'),
    validate({ params: categoryIdParamSchema }),
    categoryController.remove
  );

export default router;