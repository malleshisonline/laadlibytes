import { sendCreated, sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

import { enquiryService } from './enquiry.service.js';

export const enquiryController = {
  // Same answer whether or not the honeypot dropped it, so bots learn nothing.
  create: asyncHandler(async (req, res) => {
    await enquiryService.create(req.body, { userId: req.user?.id ?? null, ip: req.ip });
    sendCreated(res, null, 'Thank you! Your message has been sent.');
  }),

  list: asyncHandler(async (req, res) => {
    const { items, meta } = await enquiryService.list(req.validatedQuery ?? {});
    sendResponse(res, { message: 'Enquiries fetched successfully', data: items, meta });
  }),

  getById: asyncHandler(async (req, res) => {
    const enquiry = await enquiryService.getById(req.params.id);
    sendResponse(res, { message: 'Enquiry fetched successfully', data: enquiry });
  }),

  update: asyncHandler(async (req, res) => {
    const enquiry = await enquiryService.update(req.params.id, req.body);
    sendResponse(res, { message: 'Enquiry updated successfully', data: enquiry });
  }),
};

export default enquiryController;