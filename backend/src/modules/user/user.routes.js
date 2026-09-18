import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';

import { userController } from './user.controller.js';

/**
 * What any signed-in user may do with their own account. Managing *other* accounts is an admin
 * job and lives in user.admin.routes.js, under /admin/users.
 */
const router = Router();

router.use(authenticate);

router.get('/me', userController.me);

export default router;