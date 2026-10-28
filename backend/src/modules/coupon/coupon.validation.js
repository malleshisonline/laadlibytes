import { z } from 'zod';

import { booleanQuerySchema, idParamSchema, indianMobileSchema } from '../../utils/validators.js';
import { appliedCouponCodeSchema, buyNowSchema } from '../order/order.validation.js';

import { COUPON_TYPES } from './coupon.model.js';

export const couponIdParamSchema = idParamSchema;

// Letters, digits, - and _: safe to put in a share link (?coupon=WELCOME10) as it is.
export const couponCodeSchema = z
  .string({ error: 'Coupon code is required' })
  .trim()
  .toUpperCase()
  .min(3, 'Coupon code must be at least 3 characters')
  .max(30, 'Coupon code must be at most 30 characters')
  .regex(/^[A-Z0-9_-]+$/, 'Use only letters, numbers, - and _');

const rupeesSchema = (label) =>
  z.number(`${label} must be a number`).int(`${label} must be whole rupees`).min(1, `${label} must be at least ₹1`);

const limitSchema = (label) =>
  z.number(`${label} must be a number`).int(`${label} must be a whole number`).min(1, `${label} must be at least 1`);

// null clears a date; an ISO string sets it.
const dateSchema = z.union([z.null(), z.string().trim().pipe(z.coerce.date('Enter a valid date'))]);

/**
 * Field shapes only. Rules that join fields (a percent of at most 100, maxDiscount only on a percent
 * coupon, endsAt after startsAt) are checked in coupon.service.js against the merged coupon, so a
 * PATCH of one field is held to them too.
 */
const couponFields = {
  code: couponCodeSchema,
  description: z.string().trim().max(200, 'Description must be at most 200 characters').optional(),
  type: z.enum(COUPON_TYPES),
  value: limitSchema('Value'),
  maxDiscount: rupeesSchema('Maximum discount').nullable().optional(),
  minOrderValue: z.number('Minimum order value must be a number').int().min(0).optional(),
  startsAt: dateSchema.optional(),
  endsAt: dateSchema.optional(),
  maxUses: limitSchema('Total uses').nullable().optional(),
  maxUsesPerCustomer: limitSchema('Uses per customer').nullable().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
};

export const createCouponSchema = z.object(couponFields);

export const updateCouponSchema = z
  .object(couponFields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Send at least one field to update');

/**
 * A coupon preview at checkout: prices the cart (or the Buy Now line) with the code and takes no use.
 * `phone` is the delivery number, so the per-customer limit can be checked before paying.
 */
export const applyCouponSchema = z.object({
  code: appliedCouponCodeSchema,
  buyNow: buyNowSchema,
  phone: indianMobileSchema.optional(),
});

// Whitelisted like USER_SORTS; coupon.service.js maps each label to the real sort.
export const COUPON_SORTS = ['newest', 'oldest', 'code'];

export const adminListCouponsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // Code or description.
  search: z.string().trim().max(100).optional(),
  isActive: booleanQuerySchema.optional(),
  sort: z.enum(COUPON_SORTS).default('newest'),
});