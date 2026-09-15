import rateLimit from 'express-rate-limit';

import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const baseOptions = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.isTest,
  handler: (_req, _res, next) => next(ApiError.tooMany()),
};

/** Applied to the whole API surface. */
export const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
});

/** Tighter budget for credential endpoints (password login / refresh). */
export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  handler: (_req, _res, next) => next(ApiError.tooMany('Too many attempts, please try again later')),
});

/** Account lookup on the sign-in page. Every request counts, since "no account" is a successful answer. */
export const identifyLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 30,
});

/** Anything that sends an OTP. Every request counts: each send costs money and can spam the recipient. */
export const otpSendLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  handler: (_req, _res, next) => next(ApiError.tooMany('Too many code requests, please try again later')),
});

/** Code guesses across challenges. Per-code attempt limits live in otp.service. */
export const otpVerifyLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  handler: (_req, _res, next) => next(ApiError.tooMany('Too many attempts, please try again later')),
});
