import { Router } from 'express';

import { authenticate, authorize, optionalAuth } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';

import { productController } from './product.controller.js';
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdOrSlugParamSchema,
  productIdParamSchema,
  updateProductSchema,
} from './product.validation.js';

const router = Router();

// Public catalogue. optionalAuth so an admin also sees inactive products when asking for them.
router.get('/', optionalAuth, validate({ query: listProductsQuerySchema }), productController.list);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate({ body: createProductSchema }),
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
    validate({ params: productIdParamSchema, body: updateProductSchema }),
    productController.update
  )
  .delete(
    authenticate,
    authorize('admin'),
    validate({ params: productIdParamSchema }),
    productController.remove
  );

export default router;