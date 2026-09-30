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