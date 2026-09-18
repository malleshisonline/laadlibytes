import { sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

import { adminService } from './admin.service.js';

export const adminController = {
  summary: asyncHandler(async (req, res) => {
    const summary = await adminService.summary(req.validatedQuery ?? {});
    sendResponse(res, { message: 'Admin summary fetched successfully', data: summary });
  }),
};

export default adminController;