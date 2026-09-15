import { z } from 'zod';

import { parseIdentifier } from '../../utils/identifier.js';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/\d/, 'Password must contain a number');

/** One sign-in input for email or phone. Parses to { channel, value } with value normalized. */
export const identifierSchema = z
  .string({ error: 'Email or mobile number is required' })
  .trim()
  .min(1, 'Email or mobile number is required')
  .max(254)
  .transform((raw, ctx) => {
    const parsed = parseIdentifier(raw);
    if (!parsed) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid email address or mobile number' });
      return z.NEVER;
    }
    return parsed;
  });

// 32 random bytes, base64url-encoded
const verificationIdSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'Invalid verification id');

export const identifySchema = z.object({
  identifier: identifierSchema,
});

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    identifier: identifierSchema,
    name: z.string().trim().min(2).max(60),
    password,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const otpRequestSchema = z.object({
  identifier: identifierSchema,
});

export const otpVerifySchema = z.object({
  verificationId: verificationIdSchema,
  otp: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export const otpResendSchema = z.object({
  verificationId: verificationIdSchema,
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(), // falls back to the httpOnly cookie
});