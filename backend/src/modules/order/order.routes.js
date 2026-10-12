import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';

import { orderController } from './order.controller.js';
import {
  listMyOrdersQuerySchema,
  orderIdParamSchema,
  placeOrderSchema,
  verifyRazorpayPaymentSchema,
} from './order.validation.js';

/**
 * The signed-in user's own orders. Guests shop with a cart but must sign in to order. Customers
 * cannot cancel (the shop takes no cancellations); delivery-status changes are handled by admins
 * under /admin/orders, while payment status comes only from Razorpay verification and webhooks.
 */
const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listMyOrdersQuerySchema }), orderController.listMine);
router.post('/', validate({ body: placeOrderSchema }), orderController.place);
router.post('/:id/payment/checkout', validate({ params: orderIdParamSchema }), orderController.resumePayment);
router.post(
  '/:id/payment/verify',
  validate({ params: orderIdParamSchema, body: verifyRazorpayPaymentSchema }),
  orderController.verifyPayment
);
router.get('/:id', validate({ params: orderIdParamSchema }), orderController.getMine);

export default router;