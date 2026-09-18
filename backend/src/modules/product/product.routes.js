import { Router } from 'express';

import { authenticate, authorize, optionalAuth } from '../../middlewares/authenticate.js';
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
  createProductSchema,
  listProductsQuerySchema,
  productIdOrSlugParamSchema,
  productIdParamSchema,
  updateProductSchema,
} from './product.validation.js';

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

// Public catalogue. optionalAuth so an admin also sees inactive products when asking for them.
router.get('/', optionalAuth, validate({ query: listProductsQuerySchema }), productController.list);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  ...productImageUploadSteps,
  validate({ body: createProductSchema }),
  ...productImageStorageSteps,
  productController.create
);

// Registered before /:id so the public GET resolves here; PATCH and DELETE below take an id only.
router.get(
  '/:idOrSlug',
  optionalAuth,
  validate({ params: productIdOrSlugParamSchema }),
  productController.getByIdOrSlug
);

router
  .route('/:id')
  .patch(
    authenticate,
    authorize('admin'),
    ...productImageUploadSteps,
    validate({ params: productIdParamSchema, body: updateProductSchema }),
    ...productImageStorageSteps,
    productController.update
  )
  .delete(
    authenticate,
    authorize('admin'),
    validate({ params: productIdParamSchema }),
    productController.remove
  );

export default router;