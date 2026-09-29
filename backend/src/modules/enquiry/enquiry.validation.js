import { z } from 'zod';

import { idParamSchema } from '../../utils/validators.js';

import { ENQUIRY_STATUSES } from './enquiry.model.js';

export const enquiryIdParamSchema = idParamSchema;

export const createEnquirySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name must be at most 60 characters'),
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  subject: z.string().trim().max(150, 'Subject must be at most 150 characters').optional().default(''),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be at most 2000 characters'),
  // Honeypot: hidden on the form, so only bots fill it in. The service drops those silently.
  website: z.string().max(200).optional(),
});

// Whitelisted like USER_SORTS; enquiry.service.js maps each label to the real sort.
export const ENQUIRY_SORTS = ['newest', 'oldest'];

export const listEnquiriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  status: z.enum(ENQUIRY_STATUSES).optional(),
  sort: z.enum(ENQUIRY_SORTS).default('newest'),
});

export const updateEnquirySchema = z.object({
  status: z.enum(ENQUIRY_STATUSES),
});