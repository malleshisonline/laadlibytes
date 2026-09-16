import mongoose from 'mongoose';

import { slugify } from '../../utils/slug.js';

export const PACK_UNITS = ['g', 'kg', 'ml', 'l', 'piece'];

// _id: false — an image is positional data, not an entity. images[0] is the front of pack;
// ordering alone decides the primary, so there is no isPrimary flag to keep in sync.
const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image url is required'],
      trim: true,
    },
    // Cloudinary public_id. Optional because the client uploads through the dashboard by hand,
    // but stored when present so a future admin delete can call Cloudinary.
    publicId: { type: String, trim: true },
    alt: { type: String, trim: true, maxlength: 160 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      lowercase: true,
      trim: true,
    },
    // Business key. The seeder upserts on this, so a rerun updates instead of duplicating.
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      uppercase: true,
      trim: true,
      maxlength: 32,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    // Rupees, not paise. Every catalogue price is a whole rupee; the payment module
    // multiplies by 100 at the Razorpay boundary.
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: 0,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    // "100 gm" split into a number and a unit: a string could not be sorted or compared.
    packSize: {
      value: {
        type: Number,
        required: [true, 'Pack size value is required'],
        min: 0,
      },
      unit: {
        type: String,
        enum: PACK_UNITS,
        required: [true, 'Pack size unit is required'],
      },
    },
    // Not supplied by the client yet — optional at seed time, filled in later via admin PATCH.
    description: { type: String, trim: true, maxlength: 2000 },
    // An array, not one blob: ingredient names contain commas ("Fructooligosaccharides (FOS)").
    ingredients: { type: [String], default: [] },
    allergenInfo: { type: String, trim: true, maxlength: 500 },
    // Not supplied by the client yet. A string, because it reads "6 months from packaging".
    shelfLife: { type: String, trim: true, maxlength: 100 },
    nutritionPoints: { type: [String], default: [] },
    taglines: { type: [String], default: [] },
    // Deliberately uncapped: four per product today (front, back, label, nutrition),
    // but more may be added later.
    images: { type: [imageSchema], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    // Publish switch and soft-delete target: DELETE sets this false rather than removing the doc,
    // so future order lines never point at a missing product.
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

productSchema.virtual('discountPercent').get(function discountPercent() {
  if (!this.mrp || this.price >= this.mrp) return 0;
  return Math.round(((this.mrp - this.price) / this.mrp) * 100);
});

// Plain unique, not partial: both are always set.
// slug backs the public detail URL; sku is the business key the seeder upserts on.
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ sku: 1 }, { unique: true });
// The literal shape of the storefront query: filter by category, hide inactive, newest first —
// so the sort is served by the index instead of done in memory.
productSchema.index({ category: 1, isActive: 1, createdAt: -1 });
// The price-sorted listing, the second most common view.
productSchema.index({ isActive: 1, price: 1 });

// Runs on validate, not save, so the slug exists before `required` is checked.
// Mongoose 9 no longer passes `next` to middleware; returning is enough.
productSchema.pre('validate', async function deriveSlug() {
  if (!this.slug && this.name) this.slug = slugify(this.name);
});

export const Product = mongoose.model('Product', productSchema);

export default Product;