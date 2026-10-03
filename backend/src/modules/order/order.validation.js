import { z } from 'zod';

import { idParamSchema, objectIdSchema } from '../../utils/validators.js';
import { MAX_QTY_PER_LINE } from '../cart/cart.service.js';

import { ORDER_STATUSES, PAYMENT_STATUSES } from './order.model.js';

export const orderIdParamSchema = idParamSchema;

/**
 * Without `buyNow` the whole cart is ordered. With it, only that product is, and the cart is left
 * alone: the same split as the storefront's Order Summary page.
 */
export const placeOrderSchema = z.object({
  addressId: objectIdSchema,
  buyNow: z
    .object({
      productId: objectIdSchema,
      quantity: z
        .number('Quantity must be a number')
        .int('Quantity must be a whole number')
        .min(1, 'Quantity must be at least 1')
        .max(MAX_QTY_PER_LINE, `You can order at most ${MAX_QTY_PER_LINE} of one item`)
        .default(1),
    })
    .optional(),
});

export const listMyOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// Whitelisted like USER_SORTS; order.service.js maps each label to the real sort.
export const ORDER_SORTS = ['newest', 'oldest'];

export const adminListOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Order number, customer name or phone.
  search: z.string().trim().max(100).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  sort: z.enum(ORDER_SORTS).default('newest'),
});

const noteSchema = z.string().trim().max(500, 'Note must be at most 500 characters').optional();

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: noteSchema,
});

export const updateOrderPaymentSchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUSES),
  // UPI transaction id, or a gateway payment id once there is one.
  reference: z.string().trim().min(1).max(100).optional(),
  note: noteSchema,
});