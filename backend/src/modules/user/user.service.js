import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';

import { User } from './user.model.js';

/** Data access + business rules. Controllers stay free of Mongoose. */
export const userService = {
  async list(query) {
    const { page, limit, skip } = getPagination(query);
    const filter = {};

    if (query.role) filter.role = query.role;
    if (query.search) filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];

    const [items, total] = await Promise.all([
      User.find(filter).select('-__v').sort(query.sort ?? '-createdAt').skip(skip).limit(limit).lean(),
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
