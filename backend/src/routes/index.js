import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/user/user.routes.js';

const router = Router();

/**
 * Every API route lives here — one entry per feature module.
 * To add a feature: create src/modules/<name>/<name>.routes.js, import it
 * above, then add a line to this list.
 */
const routes = [
  { path: '/auth', router: authRoutes },
  { path: '/users', router: userRoutes },
];

routes.forEach(({ path, router: moduleRouter }) => router.use(path, moduleRouter));

export default router;
