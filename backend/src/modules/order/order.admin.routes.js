import { Router } from 'express';

import { validate } from '../../middlewares/validate.js';

import { orderController } from './order.controller.js';
import {
  adminListOrdersQuerySchema,
  orderIdParamSchema,
  updateOrderPaymentSchema,
  updateOrderStatusSchema,
} from './order.validation.js';

/**
 * Mounted at /admin/orders by src/modules/admin/admin.routes.js, which already applied
 * `authenticate` and `authorize('admin')` — no route here repeats the guard.
 */
const router = Router();

router.get('/', validate({ query: adminListOrdersQuerySchema }), orderController.list);
router.get('/:id', validate({ params: orderIdParamSchema }), orderController.getById);
router.patch(
  '/:id/status',
  validate({ params: orderIdParamSchema, body: updateOrderStatusSchema }),
  orderController.updateStatus
);
router.patch(
  '/:id/payment',
  validate({ params: orderIdParamSchema, body: updateOrderPaymentSchema }),
  orderController.updatePayment
);

export default router;