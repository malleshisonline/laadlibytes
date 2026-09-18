import { Router } from 'express';

import { authenticate, authorize } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import categoryAdminRoutes from '../category/category.admin.routes.js';
import productAdminRoutes from '../product/product.admin.routes.js';
import userAdminRoutes from '../user/user.admin.routes.js';

import { adminController } from './admin.controller.js';
import { adminSummaryQuerySchema } from './admin.validation.js';

/**
 * The whole admin surface, mounted at /admin.
 *
 * "admin" is a role, not a resource: this module owns no model. It exists so the role gate is
 * applied once, here, instead of being repeated on every write route — and so that the admin
 * endpoints are one obvious, reviewable list rather than being interleaved with the public
 * storefront reads. Each feature's admin routes stay with that feature, in
 * <name>.admin.routes.js, and reuse its controller and service unchanged.
 */
const router = Router();

// Applies to everything below, including the sub-routers: one gate for the whole surface.
router.use(authenticate, authorize('admin'));

router.get('/summary', validate({ query: adminSummaryQuerySchema }), adminController.summary);

router.use('/products', productAdminRoutes);
router.use('/categories', categoryAdminRoutes);
router.use('/users', userAdminRoutes);

export default router;