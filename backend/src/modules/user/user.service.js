import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';

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
    const user = await User.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },

  async remove(id) {
    const user = await User.findByIdAndDelete(id);
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },
};

export default userService;
