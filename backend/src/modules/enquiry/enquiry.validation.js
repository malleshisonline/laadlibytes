import { z } from 'zod';

import { idParamSchema, indianMobileSchema, objectIdSchema } from '../../utils/validators.js';

import { ENQUIRY_STATUSES, ENQUIRY_TYPES } from './enquiry.model.js';

export const enquiryIdParamSchema = idParamSchema;

/**
 * A Contact Us message, or with `type: 'bulk'` a gift hamper bulk or corporate quote request. A bulk
 * enquiry needs a phone number; company, hamper and number of boxes are optional.
 */
export const createEnquirySchema = z
  .object({
    type: z.enum(ENQUIRY_TYPES).optional().default('contact'),
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name must be at most 60 characters'),
    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
    subject: z.string().trim().max(150, 'Subject must be at most 150 characters').optional().default(''),
    message: z
      .string()
      .trim()
      .min(10, 'Message must be at least 10 characters')
      .max(2000, 'Message must be at most 2000 characters'),
    company: z.string().trim().max(120, 'Company must be at most 120 characters').optional(),
    phone: indianMobileSchema.optional(),
    hamper: objectIdSchema.optional(),
    quantity: z
      .number('Quantity must be a number')
      .int('Quantity must be a whole number')
      .min(1, 'Quantity must be at least 1')
      .max(1_000_000)
      .optional(),
    // Honeypot: hidden on the form, so only bots fill it in. The service drops those silently.
    website: z.string().max(200).optional(),
  })
  .superRefine((body, ctx) => {
    if (body.type === 'bulk' && !body.phone) {
      ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Mobile number is required' });
    }
  });

// Whitelisted like USER_SORTS; enquiry.service.js maps each label to the real sort.
export const ENQUIRY_SORTS = ['newest', 'oldest'];

export const listEnquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  status: z.enum(ENQUIRY_STATUSES).optional(),
  type: z.enum(ENQUIRY_TYPES).optional(),
  sort: z.enum(ENQUIRY_SORTS).default('newest'),
});

export const updateEnquirySchema = z.object({
  status: z.enum(ENQUIRY_STATUSES),
});