import mongoose from 'mongoose';

import { auditFields, stripUnpopulatedAuditRefs } from '../../utils/auditFields.js';

// A hamper is always a pre-curated box: the seller decides what is inside, the customer never does.
// An enum of one, so a pick-your-own mode can never be stored by accident.
export const HAMPER_SELECTION_MODES = ['fixed'];

export const DEFAULT_PIECES_PER_BOX = 12;
export const DEFAULT_LEAD_TIME_DAYS = 14;
// Made to order, so this is a sanity cap per cart line, not stock: high enough for an office order.
export const DEFAULT_MAX_QTY_PER_ORDER = 50;

// Theme tokens the storefront maps to its own classes, so no colour value is ever stored.
export const HAMPER_ACCENT_COLORS = ['caramel', 'cocoa', 'leaf', 'peacock', 'navy'];

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: [true, 'Image url is required'], trim: true },
    publicId: { type: String, required: [true, 'Image publicId is required'], trim: true },
    alt: { type: String, trim: true, maxlength: 160 },
  },
  { _id: false }
);

/**
 * A gift hamper: a fixed box of chikkis sold as one item, separate from the product catalogue.
 * It is bought through the normal cart and checkout (a cart or order line with kind 'hamper'), priced
 * from `price` on the server, and made to order, so it has no stock.
 */
const giftHamperSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Hamper name is required'], trim: true, maxlength: 120 },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 140 },
    // Short business key, e.g. FK. The seeder upserts on it and it names the Cloudinary folder.
    code: { type: String, required: [true, 'Hamper code is required'], uppercase: true, trim: true, maxlength: 12 },
    headline: { type: String, trim: true, maxlength: 160 },
    shortDescription: { type: String, trim: true, maxlength: 300 },
    description: { type: String, trim: true, maxlength: 2000 },
    // Whole rupees, MRP per box, GST included.
    price: { type: Number, required: [true, 'Price is required'], min: 1 },
    netWeightGrams: { type: Number, min: 1, default: 180 },
    piecesPerBox: { type: Number, min: 1, default: DEFAULT_PIECES_PER_BOX },
    selectionMode: { type: String, enum: HAMPER_SELECTION_MODES, default: 'fixed' },
    // Flavour names, shown as badges. Display only: the seller packs the box by its name.
    flavours: {
      type: [{ type: String, trim: true, maxlength: 80 }],
      validate: { validator: (flavours) => flavours.length > 0, message: 'Add at least one flavour' },
    },
    // images[0] is the front of the box.
    images: { type: [imageSchema], default: [] },
    leadTimeDays: { type: Number, min: 0, default: DEFAULT_LEAD_TIME_DAYS },
    // e.g. "Happy Diwali greeting card". The gift message at checkout is written on it.
    greetingCardLabel: { type: String, trim: true, maxlength: 80 },
    accentColor: { type: String, enum: HAMPER_ACCENT_COLORS },
    maxQtyPerOrder: { type: Number, min: 1, default: DEFAULT_MAX_QTY_PER_ORDER },
    isActive: { type: Boolean, default: true },
    // Lower first. Ties fall back to the name.
    sortOrder: { type: Number, default: 0 },
    seo: {
      title: { type: String, trim: true, maxlength: 70 },
      description: { type: String, trim: true, maxlength: 160 },
    },
    ...auditFields(),
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        stripUnpopulatedAuditRefs(ret);
        return ret;
      },
    },
  }
);

giftHamperSchema.index({ slug: 1 }, { unique: true });
giftHamperSchema.index({ code: 1 }, { unique: true });
// The storefront list: active hampers in display order.
giftHamperSchema.index({ isActive: 1, sortOrder: 1 });

export const GiftHamper = mongoose.model('GiftHamper', giftHamperSchema);

export default GiftHamper;