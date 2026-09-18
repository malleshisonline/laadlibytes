import { z } from 'zod';

/**
 * Zod primitives shared across feature modules.
 * These live here rather than inside one module so that, say, product validation
 * never has to import from user validation just to check an id.
 */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

/** Standard `/:id` route param. */
export const idParamSchema = z.object({ id: objectIdSchema });

/**
 * Query-string booleans. `z.coerce.boolean()` is wrong here because Boolean('false')
 * is true, so ?inStock=false would filter the opposite way.
 */
export const booleanQuerySchema = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((value) => value === true || value === 'true' || value === '1');