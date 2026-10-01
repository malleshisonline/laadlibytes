import { sendNoContent, sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { readRefreshToken } from '../../utils/refreshCookie.js';

import { userService } from './user.service.js';

export const userController = {
  list: asyncHandler(async (req, res) => {
    const { items, meta } = await userService.list(req.validatedQuery ?? {});
    sendResponse(res, { message: 'Users fetched successfully', data: items, meta });
  }),

  me: asyncHandler(async (req, res) => {
    const user = await userService.getById(req.user.id);
    sendResponse(res, { message: 'Profile fetched successfully', data: user });
  }),

  updateMe: asyncHandler(async (req, res) => {
    const user = await userService.updateMe(req.user.id, req.body);
    sendResponse(res, { message: 'Profile updated successfully', data: user });
  }),

  changePassword: asyncHandler(async (req, res) => {
    await userService.changePassword(req.user.id, req.body, readRefreshToken(req));
    sendResponse(res, { message: 'Password changed. Other devices have been signed out.' });
  }),

  getById: asyncHandler(async (req, res) => {
    const user = await userService.getById(req.params.id);
    sendResponse(res, { message: 'User fetched successfully', data: user });
  }),

  update: asyncHandler(async (req, res) => {
    const user = await userService.update(req.params.id, req.body);
    sendResponse(res, { message: 'User updated successfully', data: user });
  }),

  remove: asyncHandler(async (req, res) => {
    await userService.remove(req.params.id);
    sendNoContent(res);
  }),
};

export default userController;
