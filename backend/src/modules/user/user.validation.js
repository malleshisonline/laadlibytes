import { z } from 'zod';

import { objectIdSchema } from '../../utils/validators.js';

import { USER_ROLES } from './user.model.js';

// objectIdSchema now lives in utils/validators.js so every feature module can reach it
// without importing from another feature. Re-exported so existing imports keep working.
export { objectIdSchema };

export const userIdParamSchema = z.object({ id: objectIdSchema });

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  role: z.enum(USER_ROLES).optional(),
  sort: z.string().default('-createdAt'),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    role: z.enum(USER_ROLES).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });
