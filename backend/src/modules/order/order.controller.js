import { sendCreated, sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { readGuestToken } from '../../utils/cartCookie.js';
import { logger } from '../../config/logger.js';
import { paymentService } from '../payment/payment.service.js';

import { orderService } from './order.service.js';

export const orderController = {
  place: asyncHandler(async (req, res) => {
    const checkout = await paymentService.createCheckout({ userId: req.user.id }, req.body);
    logger.info('Checkout API completed', {
      method: req.method,
      apiPath: req.originalUrl.split('?')[0],
      orderId: checkout.id,
      orderNumber: checkout.orderNumber,
    });
    sendCreated(res, checkout, 'Razorpay checkout created');
  }),

  resumePayment: asyncHandler(async (req, res) => {
    const checkout = await paymentService.resumeCheckout({ userId: req.user.id }, req.params.id);
    logger.info('Checkout API resumed', {
      method: req.method,
      apiPath: req.originalUrl.split('?')[0],
      orderId: checkout.id,
      orderNumber: checkout.orderNumber,
    });
    sendResponse(res, { message: 'Razorpay checkout loaded', data: checkout });
  }),

  verifyPayment: asyncHandler(async (req, res) => {
    const order = await paymentService.verifyCheckoutPayment({ userId: req.user.id }, req.params.id, req.body);
    logger.info('Payment verification API completed', {
      method: req.method,
      apiPath: req.originalUrl.split('?')[0],
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
    });
    sendResponse(res, { message: 'Payment verified', data: order });
  }),

  /** A guest order: the guest's own checkoutKey identifies it, and a cart order uses the `cartId` cookie. */
  placeGuest: asyncHandler(async (req, res) => {
    const checkout = await paymentService.createCheckout(
      { guestCheckoutKey: req.body.checkoutKey },
      req.body,
      readGuestToken(req)
    );
    logger.info('Guest checkout API completed', {
      method: req.method,
      apiPath: req.originalUrl.split('?')[0],
      orderId: checkout.id,
      orderNumber: checkout.orderNumber,
    });
    sendCreated(res, checkout, 'Razorpay checkout created');
  }),

  verifyGuestPayment: asyncHandler(async (req, res) => {
    const { checkoutKey, ...details } = req.body;
    const order = await paymentService.verifyCheckoutPayment({ guestCheckoutKey: checkoutKey }, req.params.id, details);
    logger.info('Guest payment verification API completed', {
      method: req.method,
      apiPath: req.originalUrl.split('?')[0],
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
    });
    sendResponse(res, { message: 'Payment verified', data: order });
  }),

  paymentStatus: asyncHandler(async (req, res) => {
    const result = await paymentService.syncCheckoutPayment({ userId: req.user.id }, req.params.id, req.body);
    sendResponse(res, { message: 'Payment status fetched', data: result });
  }),

  guestPaymentStatus: asyncHandler(async (req, res) => {
    const { checkoutKey, ...options } = req.body;
    const result = await paymentService.syncCheckoutPayment({ guestCheckoutKey: checkoutKey }, req.params.id, options);
    sendResponse(res, { message: 'Payment status fetched', data: result });
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
