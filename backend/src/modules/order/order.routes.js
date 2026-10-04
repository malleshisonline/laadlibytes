import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';

import { orderController } from './order.controller.js';
import { listMyOrdersQuerySchema, orderIdParamSchema, placeOrderSchema } from './order.validation.js';

/**
 * The signed-in user's own orders. Guests shop with a cart but must sign in to order. Customers
 * cannot cancel (the shop takes no cancellations); every change after placing is an admin's, under
 * /admin/orders.
 */
const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listMyOrdersQuerySchema }), orderController.listMine);
router.post('/', validate({ body: placeOrderSchema }), orderController.place);
router.get('/:id', validate({ params: orderIdParamSchema }), orderController.getMine);

export default router;