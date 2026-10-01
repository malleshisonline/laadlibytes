import { sendCreated, sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

import { addressService } from './address.service.js';

// Every handler answers with the user's full address list.
export const addressController = {
  list: asyncHandler(async (req, res) => {
    const addresses = await addressService.list(req.user.id);
    sendResponse(res, { message: 'Addresses fetched successfully', data: addresses });
  }),

  create: asyncHandler(async (req, res) => {
    const addresses = await addressService.create(req.user.id, req.body);
    sendCreated(res, addresses, 'Address saved');
  }),

  update: asyncHandler(async (req, res) => {
    const addresses = await addressService.update(req.user.id, req.params.id, req.body);
    sendResponse(res, { message: 'Address updated', data: addresses });
  }),

  remove: asyncHandler(async (req, res) => {
    const addresses = await addressService.remove(req.user.id, req.params.id);
    sendResponse(res, { message: 'Address deleted', data: addresses });
  }),

  setDefault: asyncHandler(async (req, res) => {
    const addresses = await addressService.setDefault(req.user.id, req.params.id);
    sendResponse(res, { message: 'Default address updated', data: addresses });
  }),
};

export default addressController;