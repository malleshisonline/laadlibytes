import { randomUUID } from 'node:crypto';

import { z } from 'zod';

import { idParamSchema, objectIdSchema } from '../../utils/validators.js';
import { addressFields } from '../address/address.validation.js';
import { MAX_QTY_PER_LINE } from '../cart/cart.service.js';

import { ORDER_STATUSES } from './order.model.js';

export const orderIdParamSchema = idParamSchema;

const buyNowSchema = z
  .object({
    productId: objectIdSchema,
    quantity: z
      .number('Quantity must be a number')
      .int('Quantity must be a whole number')
      .min(1, 'Quantity must be at least 1')
      .max(MAX_QTY_PER_LINE, `You can order at most ${MAX_QTY_PER_LINE} of one item`)
      .default(1),
  })
  .optional();

/**
 * Without `buyNow` the whole cart is ordered. With it, only that product is, and the cart is left
 * alone: the same split as the storefront's Order Summary page.
 */
export const placeOrderSchema = z.object({
  addressId: objectIdSchema,
  checkoutKey: z.string().uuid().default(() => randomUUID()),
  buyNow: buyNowSchema,
});

/**
 * A guest order carries its address instead of a saved address id. `checkoutKey` is required: it is
 * the browser's random secret, and verifying the guest's payment needs it again.
 */
export const placeGuestOrderSchema = z.object({
  checkoutKey: z.string().uuid(),
  address: z.object(addressFields),
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')).optional(),
  buyNow: buyNowSchema,
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
  // No paymentStatus filter: only paid orders are placed, so every listed order is paid.
  sort: z.enum(ORDER_SORTS).default('newest'),
});

const noteSchema = z.string().trim().max(500, 'Note must be at most 500 characters').optional();

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: noteSchema,
});

export const verifyRazorpayPaymentSchema = z.object({
  razorpay_order_id: z.string().trim().min(1).max(100),
  razorpay_payment_id: z.string().trim().min(1).max(100),
  razorpay_signature: z.string().regex(/^[a-f\d]{64}$/i),
});

export const verifyGuestPaymentSchema = verifyRazorpayPaymentSchema.extend({
  checkoutKey: z.string().uuid(),
});

/**
 * Asks Razorpay whether the checkout was paid. `abandon: true` is sent when the shopper closes the
 * payment window: an unpaid checkout then gives its stock back.
 */
export const paymentStatusSchema = z.object({
  abandon: z.boolean().default(false),
});

export const guestPaymentStatusSchema = paymentStatusSchema.extend({
  checkoutKey: z.string().uuid(),
});
