import { deleteCloudinaryAssetsByPublicIds } from '../../integrations/storage/cloudinaryImageStorage.js';
import { ApiError } from '../../utils/ApiError.js';
import { slugify } from '../../utils/slug.js';
import { Order } from '../order/order.model.js';
import { resolveFinalProductImageList } from '../product/product.service.js';

import { GiftHamper } from './giftHamper.model.js';

const DISPLAY_ORDER = { sortOrder: 1, name: 1 };

const hamperNotFound = () => ApiError.notFound('Gift hamper not found', { code: 'GIFT_HAMPER_NOT_FOUND' });

/** Data access + business rules. Controllers stay free of Mongoose. */
export const giftHamperService = {
  /** The storefront list: active hampers in display order. */
  async listActive() {
    return GiftHamper.find({ isActive: true }).sort(DISPLAY_ORDER);
  },

  async getActiveBySlug(slug) {
    const hamper = await GiftHamper.findOne({ slug: slugify(slug), isActive: true });
    if (!hamper) throw hamperNotFound();
    return hamper;
  },

  /** Admin list: every hamper, inactive ones too. A handful of rows, so no pagination. */
  async adminList() {
    return GiftHamper.find({}).sort(DISPLAY_ORDER);
  },

  async getById(id) {
    const hamper = await GiftHamper.findById(id)
      .select('+createdBy +updatedBy')
      .populate('createdBy updatedBy', 'name email phone');
    if (!hamper) throw hamperNotFound();
    return hamper;
  },

  /** Used by the upload middleware to pick the Cloudinary folder when a PATCH omits the code. */
  async getCodeById(id) {
    const hamper = await GiftHamper.findById(id).select('code').lean();
    if (!hamper) throw hamperNotFound();
    return hamper.code;
  },

  /** For the cart and checkout: one active hamper, or null. */
  async findActive(id) {
    return GiftHamper.findOne({ _id: id, isActive: true }).lean();
  },

  /** For the cart and checkout: the active hampers among `ids`, by id string. */
  async findActiveByIds(ids) {
    if (!ids.length) return new Map();
    const hampers = await GiftHamper.find({ _id: { $in: ids }, isActive: true }).lean();
    return new Map(hampers.map((hamper) => [hamper._id.toString(), hamper]));
  },

  /**
   * `uploadedImages` are files already on Cloudinary ([{ url, publicId }]). If this throws, the upload
   * middleware deletes them again, so a failed create leaves nothing behind.
   */
  async create(payload, uploadedImages = [], actorId = undefined) {
    const slug = slugify(payload.slug ?? payload.name);
    const { finalImages } = resolveFinalProductImageList([], payload.images, uploadedImages);

    const hamper = new GiftHamper({
      ...payload,
      slug,
      images: finalImages,
      createdBy: actorId,
      updatedBy: actorId,
    });
    await hamper.save();
    return giftHamperService.getById(hamper._id);
  },

  /** Replaced or removed images are deleted only after the save succeeds. */
  async update(id, payload, uploadedImages = [], actorId = undefined) {
    if (Object.keys(payload).length === 0 && uploadedImages.length === 0) {
      throw ApiError.badRequest('At least one field or image file is required', { code: 'VALIDATION_ERROR' });
    }

    const hamper = await GiftHamper.findById(id);
    if (!hamper) throw hamperNotFound();

    const { images: requestedImages, ...patch } = payload;
    // A rename does not move the URL: the slug changes only when passed explicitly.
    if (patch.slug) patch.slug = slugify(patch.slug);

    let removedPublicIds = [];
    if (requestedImages !== undefined || uploadedImages.length > 0) {
      const resolved = resolveFinalProductImageList(
        hamper.images.map((image) => image.toObject()),
        requestedImages,
        uploadedImages
      );
      patch.images = resolved.finalImages;
      removedPublicIds = resolved.removedPublicIds;
    }

    hamper.set(patch);
    if (actorId) hamper.set('updatedBy', actorId);
    await hamper.save();
    await deleteCloudinaryAssetsByPublicIds(removedPublicIds);
    return giftHamperService.getById(hamper._id);
  },

  /** Sets sortOrder to each hamper's position in `ids`; hampers not listed keep theirs. */
  async reorder(ids, actorId = undefined) {
    await GiftHamper.bulkWrite(
      ids.map((id, position) => ({
        updateOne: {
          filter: { _id: id },
          update: { $set: { sortOrder: position, ...(actorId ? { updatedBy: actorId } : {}) } },
        },
      }))
    );
    return giftHamperService.adminList();
  },

  /**
   * Deletes a hamper no order has bought, with its images. A bought one is switched off instead: its
   * orders' item image still points at its Cloudinary files.
   */
  async remove(id) {
    const hamper = await GiftHamper.findById(id).select('images').lean();
    if (!hamper) throw hamperNotFound();

    if (await Order.exists({ 'items.hamper': id })) {
      await GiftHamper.updateOne({ _id: id }, { $set: { isActive: false } });
      return { deleted: false };
    }
    await GiftHamper.deleteOne({ _id: id });
    await deleteCloudinaryAssetsByPublicIds((hamper.images ?? []).map((image) => image.publicId));
    return { deleted: true };
  },
};

export default giftHamperService;