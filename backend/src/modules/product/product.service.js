import { deleteCloudinaryAssetsByPublicIds } from '../../integrations/storage/cloudinaryImageStorage.js';
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

const LIST_EXCLUDED_FIELDS = '-__v -description -ingredients -allergenInfo -shelfLife -nutritionPoints';

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;


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

const toPlainImage = ({ url, publicId, alt }) => (alt === undefined ? { url, publicId } : { url, publicId, alt });

/**
 * Works out the product's final image list from what is stored, what the caller asked for and
 * what was just uploaded.
 *
 * - `requestedImages` omitted: stored images stay, uploaded files are appended in order.
 * - `requestedImages` given: it is the complete final order. `{ publicId }` keeps a stored image,
 *   `{ newImageFileIndex }` places an uploaded file, and uploaded files it never mentions are
 *   appended. Stored images it leaves out are removed.
 *
 * Returns { finalImages, removedPublicIds }. Nothing is deleted here: the caller deletes the
 * removed files only after the product has been saved.
 */
export function resolveFinalProductImageList(existingImages = [], requestedImages = undefined, uploadedImages = []) {
  if (requestedImages === undefined) {
    return {
      finalImages: [...existingImages.map(toPlainImage), ...uploadedImages.map(toPlainImage)],
      removedPublicIds: [],
    };
  }

  const existingImagesByPublicId = new Map(existingImages.map((image) => [image.publicId, image]));
  const referencedPublicIds = new Set();
  const referencedUploadIndexes = new Set();
  const finalImages = [];

  requestedImages.forEach((requestedImage, position) => {
    const alt = requestedImage.alt;

    if (requestedImage.publicId !== undefined) {
      const storedImage = existingImagesByPublicId.get(requestedImage.publicId);
      if (!storedImage) {
        throw ApiError.badRequest(`images[${position}]: this product has no image "${requestedImage.publicId}"`, {
          code: 'UNKNOWN_IMAGE',
        });
      }
      if (referencedPublicIds.has(requestedImage.publicId)) {
        throw ApiError.badRequest(`images[${position}]: image "${requestedImage.publicId}" is listed twice`, {
          code: 'DUPLICATE_IMAGE_REFERENCE',
        });
      }
      referencedPublicIds.add(requestedImage.publicId);
      finalImages.push(toPlainImage({ ...storedImage, alt: alt ?? storedImage.alt }));
      return;
    }

    const uploadIndex = requestedImage.newImageFileIndex;
    if (uploadIndex >= uploadedImages.length) {
      throw ApiError.badRequest(
        `images[${position}]: newImageFileIndex ${uploadIndex} has no matching file (${uploadedImages.length} uploaded)`,
        { code: 'INVALID_IMAGE_FILE_INDEX' }
      );
    }
    if (referencedUploadIndexes.has(uploadIndex)) {
      throw ApiError.badRequest(`images[${position}]: newImageFileIndex ${uploadIndex} is listed twice`, {
        code: 'DUPLICATE_IMAGE_REFERENCE',
      });
    }
    referencedUploadIndexes.add(uploadIndex);
    finalImages.push(toPlainImage({ ...uploadedImages[uploadIndex], alt }));
  });

  uploadedImages.forEach((uploadedImage, uploadIndex) => {
    if (!referencedUploadIndexes.has(uploadIndex)) finalImages.push(toPlainImage(uploadedImage));
  });

  const removedPublicIds = existingImages
    .map((image) => image.publicId)
    .filter((publicId) => !referencedPublicIds.has(publicId));

  return { finalImages, removedPublicIds };
}

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
        // A card needs none of the label copy; the detail route still returns all of it.
        .select(LIST_EXCLUDED_FIELDS)
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
   *
   * `withAudit` pulls in the select:false createdBy/updatedBy and resolves them to names —
   * used by the admin detail route only, so the storefront payload never carries user ids.
   */
  async getByIdOrSlug(idOrSlug, requester = null, { withAudit = false } = {}) {
    const filter = looksLikeObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: slugify(idOrSlug) };
    if (requester?.role !== 'admin') filter.isActive = true;

    const query = Product.findOne(filter).populate('category', 'name slug');
    if (withAudit) {
      query.select('+createdBy +updatedBy').populate('createdBy updatedBy', 'name email phone');
    }

    const product = await query;
    if (!product) throw ApiError.notFound('Product not found');
    return product;
  },

  /** Used by the upload middleware to pick the Cloudinary folder when a PATCH omits the SKU. */
  async getSkuById(id) {
    const product = await Product.findById(id).select('sku').lean();
    if (!product) throw ApiError.notFound('Product not found');
    return product.sku;
  },

  /**
   * `uploadedImages` are files already on Cloudinary ([{ url, publicId }]). If this throws, the
   * upload middleware deletes them again, so a failed create leaves nothing behind.
   */
  async create(payload, uploadedImages = [], actorId = undefined) {
    await assertCategoryExists(payload.category);

    // Seeded equal to MRP, so a product is never accidentally born on discount.
    const price = payload.price ?? payload.mrp;
    assertPriceWithinMrp(price, payload.mrp);

    // An explicit slug is still normalised, so a display name cannot sneak in as a slug.
    const slug = slugify(payload.slug ?? payload.name);

    const { finalImages } = resolveFinalProductImageList([], payload.images, uploadedImages);

    const product = await Product.create({
      ...payload,
      price,
      slug,
      images: finalImages,
      createdBy: actorId,
      updatedBy: actorId,
    });
    return product.populate('category', 'name slug');
  },

  /**
   * Replaced or removed images are deleted from Cloudinary only after the save succeeds, so a
   * failed update never leaves the product pointing at a deleted file.
   */
  async update(id, payload, uploadedImages = [], actorId = undefined) {
    if (Object.keys(payload).length === 0 && uploadedImages.length === 0) {
      throw ApiError.badRequest('At least one field or image file is required', { code: 'VALIDATION_ERROR' });
    }

    const product = await Product.findById(id);
    if (!product) throw ApiError.notFound('Product not found');

    const { images: requestedImages, ...patch } = payload;
    // A rename does not move the URL: the slug changes only when passed explicitly.
    if (patch.slug) patch.slug = slugify(patch.slug);
    if (patch.category) await assertCategoryExists(patch.category);

    // Checked against the merged result, so patching only one of the two still validates.
    assertPriceWithinMrp(patch.price ?? product.price, patch.mrp ?? product.mrp);

    let removedPublicIds = [];
    if (requestedImages !== undefined || uploadedImages.length > 0) {
      const resolvedImageList = resolveFinalProductImageList(
        product.images.map((image) => image.toObject()),
        requestedImages,
        uploadedImages
      );
      patch.images = resolvedImageList.finalImages;
      removedPublicIds = resolvedImageList.removedPublicIds;
    }

    product.set(patch);
    if (actorId) product.set('updatedBy', actorId);
    await product.save();
    await deleteCloudinaryAssetsByPublicIds(removedPublicIds);
    return product.populate('category', 'name slug');
  },

  /**
   * Soft delete: order lines will reference products, so the document has to survive — and so
   * do its Cloudinary images, which the order history may still show.
   */
  async remove(id, actorId = undefined) {
    const patch = actorId ? { isActive: false, updatedBy: actorId } : { isActive: false };
    const product = await Product.findByIdAndUpdate(id, patch, { returnDocument: 'after' });
    if (!product) throw ApiError.notFound('Product not found');
    return product;
  },
};

export default productService;