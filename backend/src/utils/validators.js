import { z } from 'zod';

import { parseIdentifier } from './identifier.js';

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

/** Password rules for sign-up and password changes. Login only checks that one was sent. */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/\d/, 'Password must contain a number');

/** An Indian mobile number in any common spelling, normalized to E.164 (+919876543210). */
export const indianMobileSchema = z
  .string({ error: 'Mobile number is required' })
  .trim()
  .min(1, 'Mobile number is required')
  .max(20)
  .transform((raw, ctx) => {
    const parsed = parseIdentifier(raw);
    if (parsed?.channel !== 'phone') {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid 10-digit mobile number' });
      return z.NEVER;
    }
    return parsed.value;
  });

/** Indian PIN code: six digits, never starting with 0. */
export const pincodeSchema = z
  .string({ error: 'PIN code is required' })
  .trim()
  .regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit PIN code');