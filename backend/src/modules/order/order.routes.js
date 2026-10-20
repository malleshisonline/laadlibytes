import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';

import { orderController } from './order.controller.js';
import {
  listMyOrdersQuerySchema,
  orderIdParamSchema,
  placeGuestOrderSchema,
  placeOrderSchema,
  verifyGuestPaymentSchema,
  verifyRazorpayPaymentSchema,
} from './order.validation.js';

/**
 * Orders. Guests can order without an account through /orders/guest; everything else is the signed-in
 * user's own orders. Customers cannot cancel (the shop takes no cancellations); delivery-status changes
 * are handled by admins under /admin/orders, while payment status comes only from Razorpay
 * verification and webhooks.
 */
const router = Router();

// Guest checkout: no account. The order's own checkoutKey, which only the guest's browser holds, is
// what lets the guest verify its payment.
router.post('/guest', validate({ body: placeGuestOrderSchema }), orderController.placeGuest);
router.post(
  '/guest/:id/payment/verify',
  validate({ params: orderIdParamSchema, body: verifyGuestPaymentSchema }),
  orderController.verifyGuestPayment
);

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