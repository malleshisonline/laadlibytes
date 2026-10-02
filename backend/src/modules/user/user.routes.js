import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';

import { userController } from './user.controller.js';
import { changePasswordSchema, updateMeSchema } from './user.validation.js';

/**
 * What any signed-in user may do with their own account. Managing *other* accounts is an admin
 * job and lives in user.admin.routes.js, under /admin/users.
 */
const router = Router();

router.use(authenticate);

router.get('/me', userController.me);
router.patch('/me', validate({ body: updateMeSchema }), userController.updateMe);
// authLimiter counts only failures, so it slows down guessing the current password.
router.post('/me/password', authLimiter, validate({ body: changePasswordSchema }), userController.changePassword);

export default router;