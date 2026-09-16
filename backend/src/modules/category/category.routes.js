import { Router } from 'express';

import { authenticate, authorize, optionalAuth } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';

import { categoryController } from './category.controller.js';
import {
  categoryIdParamSchema,
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from './category.validation.js';

const router = Router();

// Public storefront nav. optionalAuth so an admin can also ask for inactive categories.
router.get('/', optionalAuth, validate({ query: listCategoriesQuerySchema }), categoryController.list);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate({ body: createCategorySchema }),
  categoryController.create
);

router
  .route('/:id')
  .patch(
    authenticate,
    authorize('admin'),
    validate({ params: categoryIdParamSchema, body: updateCategorySchema }),
    categoryController.update
  )
  .delete(
    authenticate,
    authorize('admin'),
    validate({ params: categoryIdParamSchema }),
    categoryController.remove
  );

export default router;