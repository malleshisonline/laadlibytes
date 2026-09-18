import mongoose from 'mongoose';

import { slugify } from '../../utils/slug.js';

// A subdocument rather than a plain nested path, so url and publicId can be required whenever an
// image exists without making the image itself mandatory.
const categoryImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, 'Image url is required'],
      trim: true,
    },
    // Needed to delete the file from Cloudinary when the image is replaced or the category removed.
    publicId: {
      type: String,
      required: [true, 'Image publicId is required'],
      trim: true,
    },
    alt: { type: String, trim: true, maxlength: 160 },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: 60,
    },
    // Public URL segment, and the value the product list accepts as ?category=
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Cloudinary banner, uploaded through the admin API or the seeder. Absent until one is uploaded.
    image: {
      type: categoryImageSchema,
      default: undefined,
    },
    // The six categories have a client-mandated order that is not alphabetical.
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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

// Both plain unique, not partial: neither field is ever absent.
// slug guarantees two categories cannot claim the same URL; name is the key the seed file
// joins products on, so a duplicate name would make seeding ambiguous.
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ name: 1 }, { unique: true });

// Runs on validate, not save, so the slug exists before `required` is checked.
// Mongoose 9 no longer passes `next` to middleware; returning is enough.
categorySchema.pre('validate', async function deriveSlug() {
  if (!this.slug && this.name) this.slug = slugify(this.name);
});

export const Category = mongoose.model('Category', categorySchema);

export default Category;