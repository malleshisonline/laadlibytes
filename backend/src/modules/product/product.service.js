import { ApiError } from '../../utils/ApiError.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';
import { slugify } from '../../utils/slug.js';
import { Category } from '../category/category.model.js';

import { Product } from './product.model.js';

const SORT_MAP = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
};

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

// mongoose.isValidObjectId is too loose for this: it accepts any 12-character string, and
// "mango-alohas" is exactly 12 characters, so a real slug would be treated as an id.
const looksLikeObjectId = (value) => OBJECT_ID_PATTERN.test(value);

// A search term goes into a RegExp, so its metacharacters have to be neutralised first.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The populated category comes back lean too, so it needs the same _id -> id treatment as
// its parent. Left untouched when the field was never populated (a bare ObjectId has no _id).
const toPublicCategory = (category) => {
  if (!category?._id) return category;
  const { _id, ...rest } = category;
  return { id: _id, ...rest };
};

/**
 * .lean() skips the toJSON transform and the virtuals, so list rows are normalised by hand
 * to match the shape a full document serialises to — `id` everywhere, never `_id`.
 */
const toListItem = (product) => {
  const { _id, mrp, price, stock, category, ...rest } = product;
  return {
    ...rest,
    id: _id,
    category: toPublicCategory(category),
    mrp,
    price,
    stock,
    inStock: stock > 0,
    discountPercent: !mrp || price >= mrp ? 0 : Math.round(((mrp - price) / mrp) * 100),
  };
};

const assertPriceWithinMrp = (price, mrp) => {
  if (price > mrp) {
    throw ApiError.badRequest('Price cannot be greater than MRP', { code: 'PRICE_ABOVE_MRP' });
  }
};

const assertCategoryExists = async (categoryId) => {
  const exists = await Category.exists({ _id: categoryId });
  if (!exists) throw ApiError.notFound('Category not found');
};

/** Data access + business rules. Controllers stay free of Mongoose. */
export const productService = {
  async list(query = {}, requester = null) {
    const { page, limit, skip } = getPagination(query);
    const filter = {};

    // Inactive products are soft-deleted or unpublished: only an admin who asks can see them.
    const showAll = query.includeInactive && requester?.role === 'admin';
    if (!showAll) filter.isActive = true;

    if (query.category) {
      // An unknown slug is a 404, not an empty list — an empty list would hide the typo.
      const category = await Category.findOne({ slug: slugify(query.category) }).select('_id').lean();
      if (!category) throw ApiError.notFound('Category not found');
      filter.category = category._id;
    }

    if (query.search) {
      const term = escapeRegex(query.search);
      filter.$or = [{ name: { $regex: term, $options: 'i' } }, { taglines: { $regex: term, $options: 'i' } }];
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
    }

    if (query.inStock) filter.stock = { $gt: 0 };
    if (query.featured) filter.isFeatured = true;

    const [items, total] = await Promise.all([
      Product.find(filter)
        .select('-__v')
        .populate('category', 'name slug')
        .sort(SORT_MAP[query.sort] ?? SORT_MAP.newest)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return { items: items.map(toListItem), meta: buildMeta({ page, limit, total }) };
  },

  /**
   * Public detail. Accepts an id or a slug on one route, so the admin UI can open a
   * soft-deleted product by id without a second, colliding route.
   */
  async getByIdOrSlug(idOrSlug, requester = null) {
    const filter = looksLikeObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: slugify(idOrSlug) };
    if (requester?.role !== 'admin') filter.isActive = true;

    const product = await Product.findOne(filter).populate('category', 'name slug');
    if (!product) throw ApiError.notFound('Product not found');
    return product;
  },

  async create(payload) {
    await assertCategoryExists(payload.category);

    // Seeded equal to MRP, so a product is never accidentally born on discount.
    const price = payload.price ?? payload.mrp;
    assertPriceWithinMrp(price, payload.mrp);

    // An explicit slug is still normalised, so a display name cannot sneak in as a slug.
    const slug = slugify(payload.slug ?? payload.name);

    const product = await Product.create({ ...payload, price, slug });
    return product.populate('category', 'name slug');
  },

  async update(id, payload) {
    const product = await Product.findById(id);
    if (!product) throw ApiError.notFound('Product not found');

    const patch = { ...payload };
    // A rename does not move the URL: the slug changes only when passed explicitly.
    if (patch.slug) patch.slug = slugify(patch.slug);
    if (patch.category) await assertCategoryExists(patch.category);

    // Checked against the merged result, so patching only one of the two still validates.
    assertPriceWithinMrp(patch.price ?? product.price, patch.mrp ?? product.mrp);

    product.set(patch);
    await product.save();
    return product.populate('category', 'name slug');
  },

  /** Soft delete: order lines will reference products, so the document has to survive. */
  async remove(id) {
    const product = await Product.findByIdAndUpdate(id, { isActive: false }, { returnDocument: 'after' });
    if (!product) throw ApiError.notFound('Product not found');
    return product;
  },
};

export default productService;