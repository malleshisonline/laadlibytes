import { Router } from 'express';

import { optionalAuth } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';

import { categoryController } from './category.controller.js';
import { listCategoriesQuerySchema } from './category.validation.js';

/**
 * The public storefront nav — read only. Everything that writes lives in
 * category.admin.routes.js, under /admin/categories.
 *
 * optionalAuth, not authenticate: a guest browses without an account, while an admin who happens
 * to be signed in can still ask for inactive rows with ?includeInactive=true.
 */
const router = Router();

router.get('/', optionalAuth, validate({ query: listCategoriesQuerySchema }), categoryController.list);

export default router;