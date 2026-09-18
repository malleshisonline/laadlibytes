import { Router } from 'express';

import {
  deleteUploadedImagesWhenRequestFails,
  parseJsonFieldsFromMultipartBody,
  parseMultipartImageFiles,
  rejectNonPngOrJpegFiles,
  uploadProductImagesToCloudinary,
} from '../../middlewares/cloudinaryUpload.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { MAXIMUM_PRODUCT_IMAGE_FILES_PER_REQUEST } from '../../utils/imageFileRules.js';

import { productController } from './product.controller.js';
import {
  adminListProductsQuerySchema,
  createProductSchema,
  productIdOrSlugParamSchema,
  productIdParamSchema,
  updateProductSchema,
} from './product.validation.js';

/**
 * Mounted at /admin/products by src/modules/admin/admin.routes.js, which already applied
 * `authenticate` and `authorize('admin')` — no route here repeats the guard.
 */
const router = Router();

/**
 * Accepts JSON, or multipart/form-data with the fields as JSON in `productFields` and the files in
 * `images`. Everything is checked before anything is uploaded; the upload runs last, and a failed
 * request deletes whatever it uploaded.
 */
const productImageUploadSteps = [
  parseMultipartImageFiles({ fileFieldName: 'images', maximumFileCount: MAXIMUM_PRODUCT_IMAGE_FILES_PER_REQUEST }),
  rejectNonPngOrJpegFiles,
  parseJsonFieldsFromMultipartBody('productFields'),
];

const productImageStorageSteps = [deleteUploadedImagesWhenRequestFails, uploadProductImagesToCloudinary];

// Unlike the storefront list, this one includes inactive products unless asked not to.
router.get('/', validate({ query: adminListProductsQuerySchema }), productController.adminList);

router.post(
  '/',
  ...productImageUploadSteps,
  validate({ body: createProductSchema }),
  ...productImageStorageSteps,
  productController.create
);

// Registered before /:id so the GET resolves here; PATCH and DELETE below take an id only.
router.get(
  '/:idOrSlug',
  validate({ params: productIdOrSlugParamSchema }),
  productController.adminGetByIdOrSlug
);

router
  .route('/:id')
  .patch(
    ...productImageUploadSteps,
    validate({ params: productIdParamSchema, body: updateProductSchema }),
    ...productImageStorageSteps,
    productController.update
  )
  .delete(validate({ params: productIdParamSchema }), productController.remove);

export default router;