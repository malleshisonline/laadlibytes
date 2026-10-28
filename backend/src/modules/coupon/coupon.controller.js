import { sendCreated, sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { readGuestToken } from '../../utils/cartCookie.js';
import { orderService } from '../order/order.service.js';

import { couponService } from './coupon.service.js';

export const couponController = {
  // Prices the order the shopper is about to place, so order.service.js owns it like the order itself.
  apply: asyncHandler(async (req, res) => {
    const owner = req.user ? { userId: req.user.id } : {};
    const preview = await orderService.previewCoupon(owner, req.body, readGuestToken(req));
    sendResponse(res, { message: 'Coupon applied', data: preview });
  }),

  // null when no coupon is featured: the storefront then shows no banner.
  featured: asyncHandler(async (_req, res) => {
    const coupon = await couponService.getFeatured();
    sendResponse(res, { message: 'Featured coupon fetched successfully', data: coupon });
  }),

  list: asyncHandler(async (req, res) => {
    const { items, meta } = await couponService.list(req.validatedQuery ?? {});
    sendResponse(res, { message: 'Coupons fetched successfully', data: items, meta });
  }),

  getById: asyncHandler(async (req, res) => {
    const coupon = await couponService.getById(req.params.id);
    sendResponse(res, { message: 'Coupon fetched successfully', data: coupon });
  }),

  create: asyncHandler(async (req, res) => {
    const coupon = await couponService.create(req.body, req.user.id);
    sendCreated(res, coupon, 'Coupon created successfully');
  }),

  update: asyncHandler(async (req, res) => {
    const coupon = await couponService.update(req.params.id, req.body, req.user.id);
    sendResponse(res, { message: 'Coupon updated successfully', data: coupon });
  }),

  remove: asyncHandler(async (req, res) => {
    const result = await couponService.remove(req.params.id);
    sendResponse(res, {
      message: result.deleted ? 'Coupon deleted' : 'This coupon has been used, so it was switched off instead',
      data: result,
    });
  }),
};

export default couponController;