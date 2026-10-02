import { ApiError } from '../../utils/ApiError.js';

import { Address, MAX_ADDRESSES } from './address.model.js';

// Default first, then newest. _id breaks ties between addresses saved in the same millisecond.
const LIST_SORT = { isDefault: -1, createdAt: -1, _id: -1 };

// 404 for another user's address too, so the response never reveals that it exists.
const addressNotFound = () => ApiError.notFound('Address not found', { code: 'ADDRESS_NOT_FOUND' });

const clearDefault = (userId) => Address.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } });

/**
 * A user's saved delivery addresses. Every query is scoped by user, and every write returns the
 * whole list so the client never has to re-fetch it.
 */
export const addressService = {
  list(userId) {
    return Address.find({ user: userId }).sort(LIST_SORT);
  },

  /** The first address becomes the default, and so does one created with isDefault: true. */
  async create(userId, { isDefault, ...fields }) {
    const count = await Address.countDocuments({ user: userId });
    if (count >= MAX_ADDRESSES) {
      throw ApiError.conflict(`You can save up to ${MAX_ADDRESSES} addresses. Delete one to add another.`, {
        code: 'ADDRESS_LIMIT',
      });
    }

    const makeDefault = count === 0 || isDefault === true;
    if (makeDefault) await clearDefault(userId);
    await Address.create({ ...fields, user: userId, isDefault: makeDefault });

    return addressService.list(userId);
  },

  async update(userId, addressId, payload) {
    const address = await Address.findOneAndUpdate({ _id: addressId, user: userId }, payload, { runValidators: true });
    if (!address) throw addressNotFound();

    return addressService.list(userId);
  },

  /** Deleting the default promotes the newest remaining address. */
  async remove(userId, addressId) {
    const address = await Address.findOneAndDelete({ _id: addressId, user: userId });
    if (!address) throw addressNotFound();

    if (address.isDefault) {
      await Address.findOneAndUpdate({ user: userId }, { $set: { isDefault: true } }, { sort: { createdAt: -1, _id: -1 } });
    }

    return addressService.list(userId);
  },

  async setDefault(userId, addressId) {
    if (!(await Address.exists({ _id: addressId, user: userId }))) throw addressNotFound();

    await clearDefault(userId);
    await Address.updateOne({ _id: addressId, user: userId }, { $set: { isDefault: true } });

    return addressService.list(userId);
  },
};

export default addressService;