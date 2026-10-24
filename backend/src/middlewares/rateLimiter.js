import rateLimit from 'express-rate-limit';

import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const baseOptions = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) =>
    env.isTest ||
    [`${env.API_PREFIX}/payments/webhook`, `${env.API_PREFIX}/webhooks/razorpay`].includes(req.originalUrl.split('?')[0]),
  handler: (_req, _res, next) => next(ApiError.tooMany()),
};

// The checkout page polls this while the payment window is open; paymentStatusLimiter covers it.
const PAYMENT_STATUS_PATH = /\/orders\/(guest\/)?[a-f\d]{24}\/payment\/status$/i;

/** Applied to the whole API surface. */
export const apiLimiter = rateLimit({
  ...baseOptions,
  skip: (req) => baseOptions.skip(req) || PAYMENT_STATUS_PATH.test(req.originalUrl.split('?')[0]),
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
});

/** The payment-status poll: one request every few seconds for as long as the payment window stays open. */
export const paymentStatusLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 300,
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

/** Contact Us messages. Every request counts: each one emails the shop and the sender. */
export const enquiryLimiter = rateLimit({
  ...baseOptions,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  handler: (_req, _res, next) => next(ApiError.tooMany('Too many messages, please try again later')),
});

/** Code guesses across challenges. Per-code attempt limits live in otp.service. */
export const otpVerifyLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  handler: (_req, _res, next) => next(ApiError.tooMany('Too many attempts, please try again later')),
});
