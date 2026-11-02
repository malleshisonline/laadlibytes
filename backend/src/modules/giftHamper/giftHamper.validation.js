import { z } from 'zod';

import { idParamSchema, objectIdSchema } from '../../utils/validators.js';

import { HAMPER_ACCENT_COLORS, HAMPER_SELECTION_MODES } from './giftHamper.model.js';

export const giftHamperIdParamSchema = idParamSchema;

export const giftHamperSlugParamSchema = z.object({
  slug: z.string().trim().min(1).max(140),
});

const slugField = z
  .string()
  .trim()
  .min(2)
  .max(140)
  .regex(/^[a-z0-9-]+$/, 'Slug may contain only lowercase letters, digits and hyphens');

const imageAltField = z.string().trim().max(160).optional();

// The same image references as products: a caller never sends a URL (see productService for the rules).
const existingImageReference = z.strictObject({
  publicId: z.string().trim().min(1).max(200),
  alt: imageAltField,
});

const newImageFileReference = z.strictObject({
  newImageFileIndex: z.number().int().min(0),
  alt: imageAltField,
});

const imageListEntry = z.union([existingImageReference, newImageFileReference], {
  error: 'Each image must be { publicId, alt? } or { newImageFileIndex, alt? }',
});

const flavour = z.string().trim().min(1, 'Flavour name is required').max(80);

const wholeNumber = (label, min) =>
  z.number(`${label} must be a number`).int(`${label} must be a whole number`).min(min, `${label} must be at least ${min}`);

/**
 * Field shapes only, with no `.default()` (defaults live on the Mongoose schema, so a PATCH never
 * resets a field it did not mention).
 */
const giftHamperShape = {
  name: z.string().trim().min(2).max(120),
  slug: slugField.optional(),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1)
    .max(12)
    .regex(/^[A-Z0-9-]+$/, 'Code may contain only letters, digits and hyphens'),
  headline: z.string().trim().max(160).optional(),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().max(2000).optional(),
  price: wholeNumber('Price', 1),
  netWeightGrams: wholeNumber('Net weight', 1).optional(),
  piecesPerBox: wholeNumber('Pieces per box', 1).optional(),
  selectionMode: z.enum(HAMPER_SELECTION_MODES).optional(),
  flavours: z.array(flavour).min(1, 'Add at least one flavour').max(60),
  // The complete final order when present; images[0] is the front. Omitted, stored images stay.
  images: z.array(imageListEntry).optional(),
  leadTimeDays: wholeNumber('Lead time', 0).optional(),
  greetingCardLabel: z.string().trim().max(80).optional(),
  accentColor: z.enum(HAMPER_ACCENT_COLORS).nullable().optional(),
  maxQtyPerOrder: wholeNumber('Maximum boxes per order', 1).max(1000).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  seo: z
    .object({
      title: z.string().trim().max(70).optional(),
      description: z.string().trim().max(160).optional(),
    })
    .optional(),
};

export const createGiftHamperSchema = z.object(giftHamperShape);

// No "at least one field" refine: a multipart PATCH may carry only files, which this schema cannot see.
export const updateGiftHamperSchema = z.object(giftHamperShape).partial();

/** The full display order, first to last; each hamper's sortOrder becomes its position. */
export const reorderGiftHampersSchema = z.object({
  ids: z.array(objectIdSchema).min(1).max(100),
});