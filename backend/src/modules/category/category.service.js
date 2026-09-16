import { ApiError } from '../../utils/ApiError.js';
import { slugify } from '../../utils/slug.js';
import { Product } from '../product/product.model.js';

import { Category } from './category.model.js';

/** Data access + business rules. Controllers stay free of Mongoose. */
export const categoryService = {
  /**
   * Six rows, so no pagination. `includeInactive` is honoured only for an admin —
   * a public caller never sees a deactivated category however it asks.
   */
  async list({ includeInactive = false } = {}, requester = null) {
    const showAll = includeInactive && requester?.role === 'admin';
    const filter = showAll ? {} : { isActive: true };

    return Category.find(filter).select('-__v').sort({ displayOrder: 1, name: 1 }).lean();
  },

  async getById(id) {
    const category = await Category.findById(id);
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  },

  /** Resolves a slug to a category, used by the product list's ?category= filter. */
  async getBySlug(slug) {
    const category = await Category.findOne({ slug: slugify(slug) }).lean();
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  },

  async create(payload) {
    // An explicit slug is still normalised, so 'Fruit Variant' cannot sneak in as a slug.
    const slug = slugify(payload.slug ?? payload.name);
    return Category.create({ ...payload, slug });
  },

  async update(id, payload) {
    const patch = { ...payload };
    // A rename does not move the URL: the slug changes only when passed explicitly,
    // so links already in the wild keep resolving.
    if (patch.slug) patch.slug = slugify(patch.slug);

    const category = await Category.findByIdAndUpdate(id, patch, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!category) throw ApiError.notFound('Category not found');
    return category;
  },

  async remove(id) {
    const category = await Category.findById(id);
    if (!category) throw ApiError.notFound('Category not found');

    // Deleting a category out from under its products would strand them: they would drop out
    // of every category-filtered list while still resolving by slug. Make the admin move them.
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      throw ApiError.conflict(
        `Category has ${productCount} product(s); move or delete them first`,
        { code: 'CATEGORY_NOT_EMPTY' }
      );
    }

    await category.deleteOne();
    return category;
  },
};

export default categoryService;