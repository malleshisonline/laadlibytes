import { sendCreated, sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

import { giftHamperService } from './giftHamper.service.js';

export const giftHamperController = {
  list: asyncHandler(async (_req, res) => {
    const hampers = await giftHamperService.listActive();
    sendResponse(res, { message: 'Gift hampers fetched successfully', data: hampers });
  }),

  getBySlug: asyncHandler(async (req, res) => {
    const hamper = await giftHamperService.getActiveBySlug(req.params.slug);
    sendResponse(res, { message: 'Gift hamper fetched successfully', data: hamper });
  }),

  adminList: asyncHandler(async (_req, res) => {
    const hampers = await giftHamperService.adminList();
    sendResponse(res, { message: 'Gift hampers fetched successfully', data: hampers });
  }),

  adminGetById: asyncHandler(async (req, res) => {
    const hamper = await giftHamperService.getById(req.params.id);
    sendResponse(res, { message: 'Gift hamper fetched successfully', data: hamper });
  }),

  create: asyncHandler(async (req, res) => {
    // Files were already uploaded by uploadGiftHamperImagesToCloudinary; only their URLs travel on.
    const hamper = await giftHamperService.create(req.body, req.uploadedCloudinaryImages, req.user.id);
    sendCreated(res, hamper, 'Gift hamper created successfully');
  }),

  update: asyncHandler(async (req, res) => {
    const hamper = await giftHamperService.update(req.params.id, req.body, req.uploadedCloudinaryImages, req.user.id);
    sendResponse(res, { message: 'Gift hamper updated successfully', data: hamper });
  }),

  reorder: asyncHandler(async (req, res) => {
    const hampers = await giftHamperService.reorder(req.body.ids, req.user.id);
    sendResponse(res, { message: 'Gift hampers reordered', data: hampers });
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await giftHamperService.remove(req.params.id);
    sendResponse(res, {
      message: result.deleted ? 'Gift hamper deleted' : 'This hamper has been ordered, so it was switched off instead',
      data: result,
    });
  }),
};

export default giftHamperController;