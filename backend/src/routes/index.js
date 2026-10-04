import { Router } from 'express';

import addressRoutes from '../modules/address/address.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import cartRoutes from '../modules/cart/cart.routes.js';
import categoryRoutes from '../modules/category/category.routes.js';
import enquiryRoutes from '../modules/enquiry/enquiry.routes.js';
import orderRoutes from '../modules/order/order.routes.js';
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
  { path: '/addresses', router: addressRoutes },
  { path: '/admin', router: adminRoutes },
  { path: '/auth', router: authRoutes },
  { path: '/cart', router: cartRoutes },
  { path: '/categories', router: categoryRoutes },
  { path: '/enquiries', router: enquiryRoutes },
  { path: '/orders', router: orderRoutes },
  { path: '/products', router: productRoutes },
  { path: '/users', router: userRoutes },
];

routes.forEach(({ path, router: moduleRouter }) => router.use(path, moduleRouter));

export default router;