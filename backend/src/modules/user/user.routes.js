import { Router } from 'express';

import { authenticate, authorize } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';

import { userController } from './user.controller.js';
import { listUsersQuerySchema, updateUserSchema, userIdParamSchema } from './user.validation.js';

const router = Router();

router.use(authenticate);

router.get('/me', userController.me);

router.get('/', authorize('admin'), validate({ query: listUsersQuerySchema }), userController.list);

router
  .route('/:id')
  .get(authorize('admin'), validate({ params: userIdParamSchema }), userController.getById)
  .patch(
    authorize('admin'),
    validate({ params: userIdParamSchema, body: updateUserSchema }),
    userController.update
  )
  .delete(authorize('admin'), validate({ params: userIdParamSchema }), userController.remove);

export default router;
