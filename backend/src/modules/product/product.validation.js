import { z } from 'zod';

import { booleanQuerySchema, idParamSchema, objectIdSchema } from '../../utils/validators.js';

import { PACK_UNITS } from './product.model.js';

export const productIdParamSchema = idParamSchema;

/** The public detail route takes either a 24-hex id or a slug; the service tells them apart. */
export const productIdOrSlugParamSchema = z.object({
  idOrSlug: z.string().trim().min(1).max(140),
});

// Whitelisted, rather than letting a caller pass a raw Mongo sort string and order by any field.
export const PRODUCT_SORTS = ['newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc'];

const slugField = z
  .string()
  .trim()
  .min(2)
  .max(140)
  .regex(/^[a-z0-9-]+$/, 'Slug may contain only lowercase letters, digits and hyphens');

const imageAltField = z.string().trim().max(160).optional();

/**
 * One slot in the final, ordered image list. A caller never sends a URL: an image is either one
 * the product already has (by publicId) or the n-th file uploaded with this same request.
 * Strict objects, so a legacy `{ url }` payload is refused instead of silently stripped.
 */
const existingProductImageReference = z.strictObject({
  publicId: z.string().trim().min(1).max(200),
  alt: imageAltField,
});

const newProductImageFileReference = z.strictObject({
  newImageFileIndex: z.number().int().min(0),
  alt: imageAltField,
});

const productImageListEntry = z.union([existingProductImageReference, newProductImageFileReference], {
  error: 'Each image must be { publicId, alt? } or { newImageFileIndex, alt? }',
});

/**
 * No `.default()` anywhere in here. Defaults live on the Mongoose schema instead, so that
 * updateProductSchema (which is this shape, partial'd) cannot resurrect a default and silently
 * wipe a field the admin never mentioned in a PATCH.
 */
const productShape = {
  name: z.string().trim().min(2).max(120),
  slug: slugField.optional(),
  sku: z
    .string()
    .trim()
    .min(2)
    .max(32)
    .regex(/^[A-Za-z0-9._-]+$/, 'SKU may contain only letters, digits, dot, underscore and hyphen'),
  category: objectIdSchema,
  mrp: z.coerce.number().min(0),
  // Optional on create: defaults to mrp, so nothing looks discounted on day one.
  price: z.coerce.number().min(0).optional(),
  packSize: z.object({
    value: z.coerce.number().positive(),
    unit: z.enum(PACK_UNITS),
  }),
  description: z.string().trim().max(2000).optional(),
  ingredients: z.array(z.string().trim().min(1).max(120)).optional(),
  allergenInfo: z.string().trim().max(500).optional(),
  shelfLife: z.string().trim().max(100).optional(),
  nutritionPoints: z.array(z.string().trim().min(1).max(200)).max(8).optional(),
  taglines: z.array(z.string().trim().min(1).max(160)).max(5).optional(),
  // The complete final order when present; images[0] is the front. No .max(): unbounded by design.
  // Omitted, the stored images stay as they are and uploaded files are appended.
  images: z.array(productImageListEntry).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
};

export const createProductSchema = z.object(productShape);

// No "at least one field" refine here: a multipart PATCH may carry only files, which this schema
// cannot see. productService.update rejects a request with neither fields nor files.
export const updateProductSchema = z.object(productShape).partial();

/**
 * Every filter both the storefront list and the admin list accept. Kept as a shape rather than a
 * finished schema because `.refine()` returns a ZodEffects, which cannot be `.extend()`ed — the
 * two exported list schemas differ only in the default for `includeInactive`.
 */
const listProductsQueryShape = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  // A category slug, not an id: the storefront URL already carries the slug.
  category: z.string().trim().max(140).optional(),
  search: z.string().trim().max(100).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: booleanQuerySchema.optional(),
  featured: booleanQuerySchema.optional(),
  sort: z.enum(PRODUCT_SORTS).default('newest'),
};

const priceRangeRefinement = [
  (data) => data.minPrice === undefined || data.maxPrice === undefined || data.minPrice <= data.maxPrice,
  { path: ['minPrice'], message: 'minPrice cannot be greater than maxPrice' },
];

export const listProductsQuerySchema = z
  .object({
    ...listProductsQueryShape,
    // Honoured for admins only; the service ignores it for everyone else.
    includeInactive: booleanQuerySchema.optional(),
  })
  .refine(...priceRangeRefinement);

/**
 * The admin list. Same filters, but inactive products are in by default: an admin opening the
 * catalogue is managing it, not shopping it. `?includeInactive=false` still narrows it to the
 * published rows.
 */
export const adminListProductsQuerySchema = z
  .object({
    ...listProductsQueryShape,
    includeInactive: booleanQuerySchema.default(true),
  })
  .refine(...priceRangeRefinement);