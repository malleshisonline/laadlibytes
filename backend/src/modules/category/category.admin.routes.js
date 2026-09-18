import { Router } from 'express';

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
  adminListCategoriesQuerySchema,
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
} from './category.validation.js';

/**
 * Mounted at /admin/categories by src/modules/admin/admin.routes.js, which already applied
 * `authenticate` and `authorize('admin')` — no route here repeats the guard.
 */
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

// Unlike the storefront list, this one includes inactive categories unless asked not to.
router.get('/', validate({ query: adminListCategoriesQuerySchema }), categoryController.adminList);

router.post(
  '/',
  ...categoryImageUploadSteps,
  validate({ body: createCategorySchema }),
  ...categoryImageStorageSteps,
  categoryController.create
);

router
  .route('/:id')
  .get(validate({ params: categoryIdParamSchema }), categoryController.adminGetById)
  .patch(
    ...categoryImageUploadSteps,
    validate({ params: categoryIdParamSchema, body: updateCategorySchema }),
    ...categoryImageStorageSteps,
    categoryController.update
  )
  .delete(validate({ params: categoryIdParamSchema }), categoryController.remove);

export default router;