import { env } from '../config/env.js';

export const REFRESH_COOKIE = 'refreshToken';

// Matches JWT_REFRESH_EXPIRES_IN's default of 7 days.
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// The refresh token lives in an httpOnly cookie; the access token goes in the JSON body
// for the client to hold in memory.
const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
  path: '/',
};

/** The refresh token from the request cookie, or undefined. */
export const readRefreshToken = (req) => req.cookies?.[REFRESH_COOKIE];

export const setRefreshCookie = (res, token) =>
  res.cookie(REFRESH_COOKIE, token, { ...refreshCookieOptions, maxAge: REFRESH_COOKIE_MAX_AGE_MS });

export const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);

export default readRefreshToken;
