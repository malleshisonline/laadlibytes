import { z } from 'zod';

import { booleanQuerySchema, idParamSchema } from '../../utils/validators.js';

export const categoryIdParamSchema = idParamSchema;

const slugField = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9-]+$/, 'Slug may contain only lowercase letters, digits and hyphens');

/**
 * A caller never sends an image URL; the file itself goes in the multipart `image` field.
 * `{ alt }` sets the alt text (of the uploaded file, or of the stored image when none is sent).
 * `null` removes the stored image. Strict, so a legacy `{ url }` payload is refused.
 */
const categoryImageInput = z.strictObject({ alt: z.string().trim().max(160).optional() }).nullable();

const categoryShape = {
  name: z.string().trim().min(2).max(60),
  // Optional: derived from name when omitted.
  slug: slugField.optional(),
  description: z.string().trim().max(500).optional(),
  image: categoryImageInput.optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
};

export const createCategorySchema = z.object(categoryShape);

// No "at least one field" refine: a multipart PATCH may carry only a file, which this schema
// cannot see. categoryService.update rejects a request with neither fields nor a file.
export const updateCategorySchema = z.object(categoryShape).partial();

export const listCategoriesQuerySchema = z.object({
  // Honoured for admins only; the service ignores it for everyone else.
  includeInactive: booleanQuerySchema.default(false),
});