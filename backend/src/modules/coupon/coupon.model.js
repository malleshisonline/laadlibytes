import mongoose from 'mongoose';

import { auditFields, stripUnpopulatedAuditRefs } from '../../utils/auditFields.js';

// 'percent': `value`% off the subtotal, capped at `maxDiscount` when set. 'flat': `value` rupees off.
export const COUPON_TYPES = ['percent', 'flat'];

/**
 * A discount code applied to a whole order, one per order. Amounts are whole rupees, as on Product.
 * The discount itself is worked out in coupon.service.js; an order keeps its own copy of the coupon,
 * so editing or deleting one never changes a past order.
 */
const couponSchema = new mongoose.Schema(
  {
    // What the shopper types, e.g. WELCOME10. Stored uppercase, so codes are case-insensitive.
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      uppercase: true,
      trim: true,
      maxlength: 30,
    },
    // Shown in the banner and at checkout, e.g. "10% off your first order".
    description: { type: String, trim: true, maxlength: 200 },
    type: { type: String, enum: COUPON_TYPES, required: true },
    value: { type: Number, required: true, min: 1 },
    // Percent coupons only: the most the discount can be.
    maxDiscount: { type: Number, min: 1, default: null },
    minOrderValue: { type: Number, min: 0, default: 0 },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    // Null means no limit.
    maxUses: { type: Number, min: 1, default: null },
    maxUsesPerCustomer: { type: Number, min: 1, default: null },
    // Paid orders plus open checkouts holding a use, kept like Product.stock: taken atomically when
    // checkout opens and put back when an unpaid checkout is abandoned.
    usedCount: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    // The one coupon shown in the storefront banner. Setting it on one coupon clears it on the rest.
    isFeatured: { type: Boolean, default: false },
    ...auditFields(),
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        stripUnpopulatedAuditRefs(ret);
        return ret;
      },
    },
  }
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isFeatured: 1 }, { partialFilterExpression: { isFeatured: true } });

export const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;