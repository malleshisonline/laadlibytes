import { z } from 'zod';

import { objectIdSchema } from '../../utils/validators.js';

import { MAX_QTY_PER_LINE } from './cart.service.js';

const quantitySchema = z
  .number('Quantity must be a number')
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(MAX_QTY_PER_LINE, `You can add at most ${MAX_QTY_PER_LINE} of one item`);

export const cartItemParamSchema = z.object({ productId: objectIdSchema });

export const addCartItemSchema = z.object({
  productId: objectIdSchema,
  quantity: quantitySchema.default(1),
});

export const updateCartItemSchema = z.object({
  quantity: quantitySchema,
});

// Boxes of one hamper. The real cap is the hamper's own maxQtyPerOrder, checked in cart.service.js.
const hamperQuantitySchema = z
  .number('Quantity must be a number')
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(1000, 'For more than 1000 boxes, send a bulk enquiry');

export const cartHamperParamSchema = z.object({ hamperId: objectIdSchema });

/**
 * A hamper line takes the hamper and the number of boxes, nothing else. The box is fixed, so flavour
 * picks sent by a client (`selections`, `flavours`, …) are dropped right here: z.object strips unknown
 * keys, and the flavours always come from the hamper record (see the cart test).
 */
export const addCartHamperSchema = z.object({
  hamperId: objectIdSchema,
  quantity: hamperQuantitySchema.default(1),
});

export const updateCartHamperSchema = z.object({
  quantity: hamperQuantitySchema,
});