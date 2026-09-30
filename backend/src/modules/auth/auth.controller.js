import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { sendCreated, sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { clearCartCookie, readGuestToken } from '../../utils/cartCookie.js';
import { cartService } from '../cart/cart.service.js';

import { authService } from './auth.service.js';

const REFRESH_COOKIE = 'refreshToken';

// Refresh token lives in an httpOnly cookie; the access token goes in the JSON body
// for the client to hold in memory.
const cookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const setSessionCookie = (res, refreshToken) => res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);

/**
 * Moves what the shopper added as a guest into their account cart. Best-effort: a failure is logged
 * and the sign-in still succeeds; the guest cookie is kept then, so the next sign-in can try again.
 */
async function mergeGuestCart(req, res, userId) {
  const guestToken = readGuestToken(req);
  if (!guestToken) return;

  try {
    await cartService.mergeGuestCartIntoUser(guestToken, userId);
    clearCartCookie(res);
  } catch (err) {
    logger.error('Guest cart merge failed', { requestId: req.id, userId, error: err.message });
  }
}

export const authController = {
  identify: asyncHandler(async (req, res) => {
    const result = await authService.identify(req.body.identifier);
    sendResponse(res, { message: 'Identifier checked', data: result });
  }),

  register: asyncHandler(async (req, res) => {
    const challenge = await authService.startRegistration(req.body);
    sendResponse(res, { message: 'Verification code sent', data: challenge });
  }),

  login: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    setSessionCookie(res, refreshToken);
    await mergeGuestCart(req, res, user.id);
    sendResponse(res, { message: 'Logged in successfully', data: { user, accessToken } });
  }),

  requestLoginOtp: asyncHandler(async (req, res) => {
    const challenge = await authService.requestLoginOtp(req.body);
    sendResponse(res, { message: 'Verification code sent', data: challenge });
  }),

  verifyOtp: asyncHandler(async (req, res) => {
    const { purpose, user, accessToken, refreshToken } = await authService.verifyOtp(req.body);
    setSessionCookie(res, refreshToken);
    await mergeGuestCart(req, res, user.id);

    if (purpose === 'register') {
      sendCreated(res, { user, accessToken }, 'Account created successfully');
      return;
    }
    sendResponse(res, { message: 'Logged in successfully', data: { user, accessToken } });
  }),

  resendOtp: asyncHandler(async (req, res) => {
    const challenge = await authService.resendOtp(req.body);
    sendResponse(res, { message: 'Verification code resent', data: challenge });
  }),

  refresh: asyncHandler(async (req, res) => {
    const presented = req.body?.refreshToken ?? req.cookies?.[REFRESH_COOKIE];
    const { accessToken, refreshToken } = await authService.refresh(presented);
    setSessionCookie(res, refreshToken);
    sendResponse(res, { message: 'Token refreshed successfully', data: { accessToken } });
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.user?.id, req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
    sendResponse(res, { message: 'Logged out successfully' });
  }),
};

export default authController;