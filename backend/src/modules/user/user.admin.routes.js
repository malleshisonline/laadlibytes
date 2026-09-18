import { Router } from 'express';

import { validate } from '../../middlewares/validate.js';

import { userController } from './user.controller.js';
import { listUsersQuerySchema, updateUserSchema, userIdParamSchema } from './user.validation.js';

/**
 * Mounted at /admin/users by src/modules/admin/admin.routes.js, which already applied
 * `authenticate` and `authorize('admin')` — no route here repeats the guard.
 * A user reading their own profile uses GET /users/me instead.
 */
const router = Router();

router.get('/', validate({ query: listUsersQuerySchema }), userController.list);

router
  .route('/:id')
  .get(validate({ params: userIdParamSchema }), userController.getById)
  .patch(validate({ params: userIdParamSchema, body: updateUserSchema }), userController.update)
  .delete(validate({ params: userIdParamSchema }), userController.remove);

export default router;