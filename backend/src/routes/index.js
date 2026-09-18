import { Router } from 'express';

import adminRoutes from '../modules/admin/admin.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import categoryRoutes from '../modules/category/category.routes.js';
import productRoutes from '../modules/product/product.routes.js';
import userRoutes from '../modules/user/user.routes.js';

const router = Router();

/**
 * Every API route lives here — one entry per feature module.
 * To add a feature: create src/modules/<name>/<name>.routes.js, import it
 * above, then add a line to this list.
 */
const routes = [
  // Everything an admin writes lives under /admin, gated once in admin.routes.js. The entries
  // below are the public storefront plus each user's own account.
  { path: '/admin', router: adminRoutes },
  { path: '/auth', router: authRoutes },
  { path: '/categories', router: categoryRoutes },
  { path: '/products', router: productRoutes },
  { path: '/users', router: userRoutes },
];

routes.forEach(({ path, router: moduleRouter }) => router.use(path, moduleRouter));

export default router;
