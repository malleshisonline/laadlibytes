import { env } from '../../config/env.js';
import { sendCreated, sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

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

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    sendCreated(res, { user, accessToken }, 'Registered successfully');
  }),

  login: asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    sendResponse(res, { message: 'Logged in successfully', data: { user, accessToken } });
  }),

  refresh: asyncHandler(async (req, res) => {
    const presented = req.body?.refreshToken ?? req.cookies?.[REFRESH_COOKIE];
    const { accessToken, refreshToken } = await authService.refresh(presented);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    sendResponse(res, { message: 'Token refreshed successfully', data: { accessToken } });
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.user?.id, req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
    sendResponse(res, { message: 'Logged out successfully' });
  }),
  
};

export default authController;
