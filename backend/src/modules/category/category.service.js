import { deleteCloudinaryAssetsByPublicIds } from '../../integrations/storage/cloudinaryImageStorage.js';
import { ApiError } from '../../utils/ApiError.js';
import { slugify } from '../../utils/slug.js';
import { Product } from '../product/product.model.js';

import { Category } from './category.model.js';

const buildCategoryImage = ({ url, publicId }, alt) => (alt === undefined ? { url, publicId } : { url, publicId, alt });

/** Data access + business rules. Controllers stay free of Mongoose. */
export const categoryService = {
  /**
   * Six rows, so no pagination. `includeInactive` is honoured only for an admin —
   * a public caller never sees a deactivated category however it asks.
   */
  async list({ includeInactive = false } = {}, requester = null) {
    const showAll = includeInactive && requester?.role === 'admin';
    const filter = showAll ? {} : { isActive: true };
    
    return Category.find(filter).select('-__v').sort({ displayOrder: 1, name: 1 });
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

  /** Used by the upload middleware to pick the Cloudinary folder when a PATCH omits the slug. */
  async getSlugById(id) {
    const category = await Category.findById(id).select('slug').lean();
    if (!category) throw ApiError.notFound('Category not found');
    return category.slug;
  },

  /**
   * `uploadedImage` is a file already on Cloudinary ({ url, publicId }). If this throws, the
   * upload middleware deletes it again, so a failed create leaves nothing behind.
   */
  async create(payload, uploadedImage = undefined) {
    const { image: requestedImage, ...fields } = payload;
    // An explicit slug is still normalised, so 'Fruit Variant' cannot sneak in as a slug.
    const slug = slugify(fields.slug ?? fields.name);

    if (requestedImage && !uploadedImage) {
      throw ApiError.badRequest('image.alt was sent without an image file', { code: 'MISSING_IMAGE_FILE' });
    }
    const image = uploadedImage ? buildCategoryImage(uploadedImage, requestedImage?.alt) : undefined;

    return Category.create({ ...fields, slug, image });
  },

  /**
   * A new file replaces the stored image; `image: null` removes it; `image: { alt }` alone edits
   * the alt text. The old file is deleted from Cloudinary only after the save succeeds.
   */
  async update(id, payload, uploadedImage = undefined) {
    if (Object.keys(payload).length === 0 && !uploadedImage) {
      throw ApiError.badRequest('At least one field or an image file is required', { code: 'VALIDATION_ERROR' });
    }

    const category = await Category.findById(id);
    if (!category) throw ApiError.notFound('Category not found');

    const { image: requestedImage, ...patch } = payload;
    // A rename does not move the URL: the slug changes only when passed explicitly,
    // so links already in the wild keep resolving.
    if (patch.slug) patch.slug = slugify(patch.slug);

    const storedImage = category.image ? category.image.toObject() : undefined;
    let replacedPublicId;

    if (uploadedImage) {
      if (requestedImage === null) {
        throw ApiError.badRequest('image cannot be null when an image file is sent', { code: 'VALIDATION_ERROR' });
      }
      patch.image = buildCategoryImage(uploadedImage, requestedImage?.alt ?? storedImage?.alt);
      replacedPublicId = storedImage?.publicId;
    } else if (requestedImage === null) {
      patch.image = undefined;
      replacedPublicId = storedImage?.publicId;
    } else if (requestedImage) {
      if (!storedImage) {
        throw ApiError.badRequest('This category has no image to set alt text on', { code: 'MISSING_IMAGE_FILE' });
      }
      patch.image = buildCategoryImage(storedImage, requestedImage.alt ?? storedImage.alt);
    }

    category.set(patch);
    await category.save();
    await deleteCloudinaryAssetsByPublicIds([replacedPublicId]);
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
    await deleteCloudinaryAssetsByPublicIds([category.image?.publicId]);
    return category;
  },
};

export default categoryService;