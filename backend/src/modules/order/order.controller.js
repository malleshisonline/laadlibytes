import { sendCreated, sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { paymentService } from '../payment/payment.service.js';

import { orderService } from './order.service.js';

export const orderController = {
  place: asyncHandler(async (req, res) => {
    const checkout = await paymentService.createCheckout(req.user.id, req.body);
    sendCreated(res, checkout, 'Razorpay checkout created');
  }),

  resumePayment: asyncHandler(async (req, res) => {
    const checkout = await paymentService.resumeCheckout(req.user.id, req.params.id);
    sendResponse(res, { message: 'Razorpay checkout loaded', data: checkout });
  }),

  verifyPayment: asyncHandler(async (req, res) => {
    const order = await paymentService.verifyCheckoutPayment(req.user.id, req.params.id, req.body);
    sendResponse(res, { message: 'Payment verified', data: order });
  }),

  listMine: asyncHandler(async (req, res) => {
    const { items, meta } = await orderService.listMine(req.user.id, req.validatedQuery ?? {});
    sendResponse(res, { message: 'Orders fetched successfully', data: items, meta });
  }),

  getMine: asyncHandler(async (req, res) => {
    const order = await orderService.getMine(req.user.id, req.params.id);
    sendResponse(res, { message: 'Order fetched successfully', data: order });
  }),

  list: asyncHandler(async (req, res) => {
    const { items, meta } = await orderService.list(req.validatedQuery ?? {});
    sendResponse(res, { message: 'Orders fetched successfully', data: items, meta });
  }),

  getById: asyncHandler(async (req, res) => {
    const order = await orderService.getById(req.params.id);
    sendResponse(res, { message: 'Order fetched successfully', data: order });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const order = await orderService.updateStatus(req.params.id, req.body, req.user.id);
    sendResponse(res, { message: 'Order status updated', data: order });
  }),

};

export default orderController;
