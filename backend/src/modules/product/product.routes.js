import { Router } from 'express';

import { optionalAuth } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';

import { productController } from './product.controller.js';
import { listProductsQuerySchema, productIdOrSlugParamSchema } from './product.validation.js';

/**
 * The public storefront catalogue — reads only. Everything that writes lives in
 * product.admin.routes.js, under /admin/products.
 *
 * optionalAuth, not authenticate: a guest browses without an account, while an admin who happens
 * to be signed in can still ask for inactive rows with ?includeInactive=true.
 */
const router = Router();

router.get('/', optionalAuth, validate({ query: listProductsQuerySchema }), productController.list);

router.get(
  '/:idOrSlug',
  optionalAuth,
  validate({ params: productIdOrSlugParamSchema }),
  productController.getByIdOrSlug
);

export default router;