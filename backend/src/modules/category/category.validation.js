import { z } from 'zod';

import { booleanQuerySchema, idParamSchema } from '../../utils/validators.js';

export const categoryIdParamSchema = idParamSchema;

const slugField = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9-]+$/, 'Slug may contain only lowercase letters, digits and hyphens');

const imageField = z.object({
  url: z.url('Image url must be a valid URL'),
  publicId: z.string().trim().max(200).optional(),
  alt: z.string().trim().max(160).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(60),
  // Optional: derived from name when omitted.
  slug: slugField.optional(),
  description: z.string().trim().max(500).optional(),
  image: imageField.optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

export const listCategoriesQuerySchema = z.object({
  // Honoured for admins only; the service ignores it for everyone else.
  includeInactive: booleanQuerySchema.default(false),
});