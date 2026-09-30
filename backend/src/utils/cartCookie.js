import crypto from 'node:crypto';

import { env } from '../config/env.js';

export const CART_COOKIE = 'cartId';

// Matches GUEST_CART_TTL_DAYS in cart.service.js: the cookie and the guest cart expire together.
const CART_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// 32 random bytes as base64url: 43 characters.
const GUEST_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const cartCookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
  path: '/',
};

export const newGuestToken = () => crypto.randomBytes(32).toString('base64url');

/** The guest cart token from the request, or null when missing or malformed. */
export const readGuestToken = (req) => {
  const token = req.cookies?.[CART_COOKIE];
  return typeof token === 'string' && GUEST_TOKEN_PATTERN.test(token) ? token : null;
};

export const setCartCookie = (res, token) =>
  res.cookie(CART_COOKIE, token, { ...cartCookieOptions, maxAge: CART_COOKIE_MAX_AGE_MS });

export const clearCartCookie = (res) => res.clearCookie(CART_COOKIE, cartCookieOptions);

export default readGuestToken;