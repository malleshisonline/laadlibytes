import { logger } from '../../config/logger.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';
import { Order } from '../order/order.model.js';

import { Coupon } from './coupon.model.js';

const COUPON_SORT_MAP = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  code: { code: 1 },
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatRupees = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

const couponNotFound = () => ApiError.notFound('Coupon not found', { code: 'COUPON_NOT_FOUND' });

// One message for an unknown code and for a switched-off one, so guessing reveals nothing.
const invalidCode = () => ApiError.badRequest('This coupon code is not valid', { code: 'COUPON_INVALID' });

// Orders that hold a use of their coupon: paid ones, and open checkouts whose stock is still held.
// An abandoned checkout gave its use back with its stock (order.service.js releaseCheckoutStock).
const HOLDS_A_USE = { $or: [{ paymentStatus: 'paid' }, { stockReleased: { $ne: true } }] };

/**
 * The discount in whole rupees. Percent rounds down and stops at `maxDiscount`. Either way it leaves
 * at least ₹1 to pay, because Razorpay cannot take a zero amount.
 */
export function discountFor(coupon, subtotal) {
  const raw = coupon.type === 'percent' ? Math.floor((subtotal * coupon.value) / 100) : coupon.value;
  const capped = coupon.type === 'percent' && coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
  return Math.max(0, Math.min(capped, subtotal - 1));
}

/** Rules that join fields, checked on the merged coupon so a PATCH of one field is held to them too. */
function assertCouponRules(coupon) {
  const details = [];
  if (coupon.type === 'percent' && coupon.value > 100) {
    details.push({ field: 'value', message: 'A percentage coupon can be at most 100%' });
  }
  if (coupon.type === 'flat' && coupon.maxDiscount) {
    details.push({ field: 'maxDiscount', message: 'Maximum discount applies to percentage coupons only' });
  }
  if (coupon.startsAt && coupon.endsAt && coupon.endsAt <= coupon.startsAt) {
    details.push({ field: 'endsAt', message: 'End date must be after the start date' });
  }
  if (details.length) {
    throw ApiError.badRequest(details[0].message, { code: 'VALIDATION_ERROR', details });
  }
}

/** Only one coupon is featured at a time: featuring this one clears the flag on every other. */
async function clearOtherFeatured(couponId) {
  await Coupon.updateMany({ _id: { $ne: couponId }, isFeatured: true }, { $set: { isFeatured: false } });
}

/** Paid orders and the discount they were given, per code: what the admin list shows as usage. */
async function paidUsageByCode(codes) {
  if (!codes.length) return new Map();
  const rows = await Order.aggregate([
    { $match: { 'coupon.code': { $in: codes }, paymentStatus: 'paid' } },
    { $group: { _id: '$coupon.code', paidOrders: { $sum: 1 }, totalDiscount: { $sum: '$discount' } } },
  ]);
  return new Map(rows.map(({ _id, paidOrders, totalDiscount }) => [_id, { paidOrders, totalDiscount }]));
}

function withUsage(coupon, usage) {
  return { ...coupon.toJSON(), ...(usage.get(coupon.code) ?? { paidOrders: 0, totalDiscount: 0 }) };
}

const customerLimitError = () =>
  ApiError.badRequest('You have already used this coupon', { code: 'COUPON_CUSTOMER_LIMIT' });

/** This customer's orders that hold a use of the code, or null with no one to match. A guest is matched by phone. */
function customerOrdersFilter(code, { userId, phone } = {}) {
  const who = [...(userId ? [{ user: userId }] : []), ...(phone ? [{ 'contact.phone': phone }] : [])];
  if (!who.length) return null;
  return { 'coupon.code': code, $and: [{ $or: who }, HOLDS_A_USE] };
}

/** How many orders by this customer hold a use of the code. */
async function customerUses(code, customer) {
  const filter = customerOrdersFilter(code, customer);
  return filter ? Order.countDocuments(filter) : 0;
}

/** Data access + business rules. Controllers stay free of Mongoose. */
export const couponService = {
  /**
   * Checks the code against a subtotal and a customer, and returns the coupon with its discount. Takes
   * no use: `reserve` does that when checkout opens. `customer` is `{ userId, phone }`, either optional.
   */
  async evaluate(code, subtotal, customer = {}) {
    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), isActive: true }).lean();
    if (!coupon) throw invalidCode();

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) {
      throw ApiError.badRequest('This coupon is not active yet', { code: 'COUPON_NOT_STARTED' });
    }
    if (coupon.endsAt && coupon.endsAt <= now) {
      throw ApiError.badRequest('This coupon has expired', { code: 'COUPON_EXPIRED' });
    }
    if (subtotal < coupon.minOrderValue) {
      throw ApiError.badRequest(
        `Add ${formatRupees(coupon.minOrderValue - subtotal)} more to use this coupon (minimum order ${formatRupees(coupon.minOrderValue)})`,
        { code: 'COUPON_MIN_ORDER' }
      );
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw ApiError.badRequest('This coupon has reached its usage limit', { code: 'COUPON_USAGE_LIMIT' });
    }
    if (coupon.maxUsesPerCustomer && (await customerUses(coupon.code, customer)) >= coupon.maxUsesPerCustomer) {
      throw customerLimitError();
    }

    const discount = discountFor(coupon, subtotal);
    if (discount <= 0) {
      throw ApiError.badRequest('This coupon gives no discount on this order', { code: 'COUPON_NO_DISCOUNT' });
    }
    return { coupon, discount };
  },

  /**
   * Takes one use, or throws. Matches only while uses are left, so two checkouts racing for the last
   * use cannot both get it, the same way Product.stock is taken.
   */
  async reserve(couponId) {
    const { modifiedCount } = await Coupon.updateOne(
      {
        _id: couponId,
        isActive: true,
        $or: [{ maxUses: null }, { $expr: { $lt: ['$usedCount', '$maxUses'] } }],
      },
      { $inc: { usedCount: 1 } }
    );
    if (modifiedCount === 0) {
      throw ApiError.badRequest('This coupon has reached its usage limit', { code: 'COUPON_USAGE_LIMIT' });
    }
  },

  customerLimitError,

  /**
   * The per-customer limit again, once the order is saved: `evaluate` only read a count, so two checkouts by one
   * customer at the same moment can both pass it. Only the earliest `maxUsesPerCustomer` orders (by _id) are within
   * the limit, and every racing request sees the same order, so exactly that many are kept.
   */
  async isWithinCustomerLimit(coupon, customer, orderId) {
    const filter = coupon.maxUsesPerCustomer ? customerOrdersFilter(coupon.code, customer) : null;
    if (!filter) return true;
    const earliest = await Order.find(filter).sort({ _id: 1 }).limit(coupon.maxUsesPerCustomer).select('_id').lean();
    return earliest.some(({ _id }) => _id.equals(orderId));
  },

  /** Gives a use back, for a checkout that was abandoned or could not be created. */
  async release(couponId) {
    await Coupon.updateOne({ _id: couponId, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
  },

  /**
   * A payment arrived for a checkout whose use was already given back. The money is taken, so the
   * use is counted again even past the limit; going over is only logged.
   */
  async retake(couponId, orderNumber) {
    const coupon = await Coupon.findOneAndUpdate(
      { _id: couponId },
      { $inc: { usedCount: 1 } },
      { returnDocument: 'after' }
    ).lean();
    if (coupon?.maxUses && coupon.usedCount > coupon.maxUses) {
      logger.error('A late payment took a coupon past its usage limit', {
        orderNumber,
        code: coupon.code,
        usedCount: coupon.usedCount,
        maxUses: coupon.maxUses,
      });
    }
  },

  /** The storefront banner's coupon, or null. Hidden outside its dates or once its uses run out. */
  async getFeatured() {
    const now = new Date();
    const coupon = await Coupon.findOne({
      isFeatured: true,
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
        { $or: [{ maxUses: null }, { $expr: { $lt: ['$usedCount', '$maxUses'] } }] },
      ],
    })
      .select('code description type value maxDiscount minOrderValue endsAt')
      .lean();
    if (!coupon) return null;
    const { _id, ...featured } = coupon;
    return featured;
  },

  async list(query) {
    const { page, limit, skip } = getPagination(query);
    const filter = {};

    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.search) {
      const term = { $regex: escapeRegex(query.search), $options: 'i' };
      filter.$or = [{ code: term }, { description: term }];
    }

    const [coupons, total] = await Promise.all([
      Coupon.find(filter)
        .sort(COUPON_SORT_MAP[query.sort] ?? COUPON_SORT_MAP.newest)
        .skip(skip)
        .limit(limit),
      Coupon.countDocuments(filter),
    ]);
    const usage = await paidUsageByCode(coupons.map((coupon) => coupon.code));

    return { items: coupons.map((coupon) => withUsage(coupon, usage)), meta: buildMeta({ page, limit, total }) };
  },

  /** Admin detail, with usage and which admins created and last changed it. */
  async getById(id) {
    const coupon = await Coupon.findById(id)
      .select('+createdBy +updatedBy')
      .populate('createdBy updatedBy', 'name email phone');
    if (!coupon) throw couponNotFound();
    return withUsage(coupon, await paidUsageByCode([coupon.code]));
  },

  async create(payload, actorId) {
    const coupon = new Coupon({ ...payload, createdBy: actorId, updatedBy: actorId });
    assertCouponRules(coupon);
    await coupon.save();
    if (coupon.isFeatured) await clearOtherFeatured(coupon._id);
    return couponService.getById(coupon._id);
  },

  /**
   * The code cannot change once any order carries it, because the usage and per-customer counts
   * find a coupon's orders by code.
   */
  async update(id, payload, actorId) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw couponNotFound();

    const { code, ...changes } = payload;
    if (code && code !== coupon.code) {
      if (await Order.exists({ 'coupon.code': coupon.code })) {
        throw ApiError.conflict('This coupon has been used, so its code cannot be changed', { code: 'COUPON_IN_USE' });
      }
      coupon.code = code;
    }
    coupon.set(changes);
    // A flat coupon has no cap; switching type drops a stale one rather than refusing the change.
    if (changes.type === 'flat' && changes.maxDiscount === undefined) coupon.maxDiscount = null;
    coupon.updatedBy = actorId;

    assertCouponRules(coupon);
    await coupon.save();
    if (coupon.isFeatured) await clearOtherFeatured(coupon._id);
    return couponService.getById(coupon._id);
  },

  /**
   * Deletes a coupon no order has used. A used one is switched off instead, so its orders' history
   * still matches a coupon. Resolves to whether it was deleted.
   */
  async remove(id) {
    const coupon = await Coupon.findById(id).select('code').lean();
    if (!coupon) throw couponNotFound();

    if (await Order.exists({ 'coupon.code': coupon.code })) {
      await Coupon.updateOne({ _id: id }, { $set: { isActive: false, isFeatured: false } });
      return { deleted: false };
    }
    await Coupon.deleteOne({ _id: id });
    return { deleted: true };
  },
};

export default couponService;