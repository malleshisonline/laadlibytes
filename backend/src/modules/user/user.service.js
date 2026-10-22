import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';
import { hashToken } from '../../utils/token.js';
import { Address } from '../address/address.model.js';
import { Cart } from '../cart/cart.model.js';
import { Category } from '../category/category.model.js';
import { Enquiry } from '../enquiry/enquiry.model.js';
import { OtpChallenge } from '../otp/otp.model.js';
import { Order } from '../order/order.model.js';
import { Product } from '../product/product.model.js';

import { User } from './user.model.js';

// The labels in USER_SORTS (user.validation.js), which is what a caller may actually send.
// lastLoginAt is unset until a user first signs in, and Mongo sorts missing values lowest, so
// 'last_login_desc' lists everyone who has signed in before anyone who never has.
const USER_SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  email_asc: { email: 1 },
  email_desc: { email: -1 },
  last_login_desc: { lastLoginAt: -1 },
  last_login_asc: { lastLoginAt: 1 },
};

/** Data access + business rules. Controllers stay free of Mongoose. */
export const userService = {
  async list(query) {
    const { page, limit, skip } = getPagination(query);
    const filter = {};

    if (query.role) filter.role = query.role;
    if (query.accountType === 'guest') filter.isGuest = true;
    if (query.accountType === 'registered') filter.isGuest = { $ne: true };
    if (query.search) filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
    ];

    const [items, total] = await Promise.all([
      User.find(filter)
        .select('-__v')
        .sort(USER_SORT_MAP[query.sort] ?? USER_SORT_MAP.newest)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return { items, meta: buildMeta({ page, limit, total }) };
  },

  async getById(id) {
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },

  async update(id, payload) {
    // A guest customer cannot sign in, so an admin role on it would mean nothing.
    if (payload.role === 'admin' && (await User.exists({ _id: id, isGuest: true }))) {
      throw ApiError.badRequest('A guest customer cannot be made an admin', { code: 'GUEST_CANNOT_BE_ADMIN' });
    }

    const user = await User.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },

  async updateMe(userId, { name }) {
    return userService.update(userId, { name });
  },

  /**
   * Checks the current password, sets the new one and signs out every other device: only the
   * session holding `currentRefreshToken` survives. With no refresh token, every session goes.
   * A wrong current password is a 400, not a 401, so the client does not mistake it for an
   * expired access token and try to refresh.
   */
  async changePassword(userId, { currentPassword, newPassword }, currentRefreshToken) {
    const user = await User.findById(userId).select('+password +refreshTokens');
    if (!user) throw ApiError.notFound('User not found');

    if (!(await user.comparePassword(currentPassword))) {
      throw ApiError.badRequest('Your current password is incorrect', { code: 'INVALID_CURRENT_PASSWORD' });
    }

    const currentHash = currentRefreshToken ? hashToken(currentRefreshToken) : null;
    user.password = newPassword; // hashed by the pre-save hook
    user.refreshTokens = user.refreshTokens.filter((entry) => entry.token === currentHash);
    await user.save();
  },

  /**
   * The guest customer behind a guest order, found by phone: created on their first order, and given
   * the email later if it had none and no other account uses it. Returns its id, or null when the phone
   * belongs to a registered account: a guest has not proven they own the number, so nothing is attached.
   */
  async recordGuestCustomer({ name, phone, email }) {
    // Two attempts: a second order with the same phone may create the record between our find and create.
    for (let attempt = 1; attempt <= 2; attempt++) {
      const existing = await User.findOne({ phone }).select('isGuest email').lean();
      if (existing && !existing.isGuest) return null;

      const emailIsFree = Boolean(email) && !(await User.exists({ email }));

      if (existing) {
        if (emailIsFree && !existing.email) {
          // An email taken in the meantime just stays off the record.
          await User.updateOne({ _id: existing._id, email: null }, { $set: { email } }).catch((err) => {
            if (err?.code !== 11000) throw err;
          });
        }
        return existing._id;
      }

      try {
        const user = await User.create({ name, phone, ...(emailIsFree ? { email } : {}), isGuest: true });
        return user._id;
      } catch (err) {
        if (err?.code !== 11000) throw err;
      }
    }
    return null;
  },

  async remove(id) {
    const user = await User.findById(id).select('email phone').lean();
    const identifiers = [user?.email, user?.phone].filter(Boolean);

    if (identifiers.length) {
      await OtpChallenge.deleteMany({ identifier: { $in: identifiers } });
    }

    const deletion = await User.deleteOne({ _id: id });

    // A guest customer's orders point at it through guestCustomer rather than user.
    const ownOrders = { $or: [{ user: id }, { guestCustomer: id }] };

    const unpaidUnshippedOrders = await Order.find({
      ...ownOrders,
      status: { $in: ['placed', 'packed'] },
      paymentStatus: { $in: ['pending', 'failed'] },
    })
      .select('items.product items.quantity')
      .lean();
    const stockByProduct = new Map();
    unpaidUnshippedOrders.forEach(({ items }) => {
      items.forEach(({ product, quantity }) => {
        const productId = product.toString();
        stockByProduct.set(productId, (stockByProduct.get(productId) ?? 0) + quantity);
      });
    });
    if (stockByProduct.size) {
      await Product.bulkWrite(
        [...stockByProduct].map(([product, quantity]) => ({
          updateOne: { filter: { _id: product }, update: { $inc: { stock: quantity } } },
        }))
      );
    }

    await Promise.all([
      Address.deleteMany({ user: id }),
      Cart.deleteMany({ user: id }),
      Order.deleteMany(ownOrders),
      Order.updateMany(
        { 'history.by': id },
        { $unset: { 'history.$[entry].by': 1 } },
        { arrayFilters: [{ 'entry.by': id }] }
      ),
      Enquiry.deleteMany({ user: id }),
      Product.updateMany({ createdBy: id }, { $unset: { createdBy: 1 } }),
      Product.updateMany({ updatedBy: id }, { $unset: { updatedBy: 1 } }),
      Category.updateMany({ createdBy: id }, { $unset: { createdBy: 1 } }),
      Category.updateMany({ updatedBy: id }, { $unset: { updatedBy: 1 } }),
    ]);

    if (deletion.deletedCount === 0) throw ApiError.notFound('User not found');
    return user;
  },
};

export default userService;
