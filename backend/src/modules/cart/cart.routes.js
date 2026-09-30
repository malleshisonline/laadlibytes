import { Router } from 'express';

import { optionalAuthStrict } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';

import { cartController } from './cart.controller.js';
import { addCartItemSchema, cartItemParamSchema, updateCartItemSchema } from './cart.validation.js';

/**
 * The cart works for guests too: a guest's cart is found by the `cartId` cookie and merged into
 * their account cart on sign-in (see auth.controller.js). Sign-in is required only at checkout.
 */
const router = Router();

router.use(optionalAuthStrict);

router.get('/', cartController.get);
router.delete('/', cartController.clear);
router.post('/items', validate({ body: addCartItemSchema }), cartController.addItem);
router.patch(
  '/items/:productId',
  validate({ params: cartItemParamSchema, body: updateCartItemSchema }),
  cartController.updateItem
);
router.delete('/items/:productId', validate({ params: cartItemParamSchema }), cartController.removeItem);

export default router;