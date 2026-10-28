import { Router } from 'express';

import { validate } from '../../middlewares/validate.js';

import { couponController } from './coupon.controller.js';
import {
  adminListCouponsQuerySchema,
  couponIdParamSchema,
  createCouponSchema,
  updateCouponSchema,
} from './coupon.validation.js';

/**
 * Mounted at /admin/coupons by src/modules/admin/admin.routes.js, which already applied
 * `authenticate` and `authorize('admin')` — no route here repeats the guard.
 */
const router = Router();

router
  .route('/')
  .get(validate({ query: adminListCouponsQuerySchema }), couponController.list)
  .post(validate({ body: createCouponSchema }), couponController.create);

router
  .route('/:id')
  .get(validate({ params: couponIdParamSchema }), couponController.getById)
  .patch(validate({ params: couponIdParamSchema, body: updateCouponSchema }), couponController.update)
  .delete(validate({ params: couponIdParamSchema }), couponController.remove);

export default router;