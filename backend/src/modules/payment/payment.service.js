import crypto from 'node:crypto';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { ApiError } from '../../utils/ApiError.js';
import { orderService } from '../order/order.service.js';

const CURRENCY = 'INR';
const RAZORPAY_API = 'https://api.razorpay.com/v1';

function paymentError(message, code = 'PAYMENT_PROVIDER_ERROR') {
  return ApiError.internal(message, { code });
}

function assertApiCredentials() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw paymentError('Razorpay is not configured on the server', 'PAYMENT_PROVIDER_NOT_CONFIGURED');
  }
}

function assertWebhookSecret() {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw paymentError(
      'Configure RAZORPAY_WEBHOOK_SECRET in the Razorpay dashboard before enabling webhook delivery',
      'PAYMENT_WEBHOOK_NOT_CONFIGURED'
    );
  }
}

function amountInPaise(amountInRupees) {
  const amount = amountInRupees * 100;
  if (!Number.isSafeInteger(amount) || amount < 100) {
    throw ApiError.badRequest('Order total must be at least 1 INR and represent whole paise', {
      code: 'INVALID_ORDER_AMOUNT',
    });
  }
  return amount;
}

function timingSafeHexEqual(actual, expected) {
  if (!/^[a-f\d]+$/i.test(actual) || actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

async function razorpayRequest(path, { method = 'GET', body } = {}) {
  assertApiCredentials();
  const authorization = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');

  logger.info('Razorpay API request started', { method, path });

  let response;
  try {
    response = await fetch(`${RAZORPAY_API}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${authorization}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    logger.error('Razorpay request could not be completed', { path, message: error.message });
    throw paymentError('Could not connect to the payment provider');
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    logger.error('Razorpay returned an invalid response', { path, status: response.status, message: error.message });
    throw paymentError('The payment provider returned an invalid response');
  }


  if (!response.ok) {
    logger.error('Razorpay rejected a server request', {
      path,
      status: response.status,
      providerCode: payload?.error?.code,
      providerDescription: payload?.error?.description,
      providerReason: payload?.error?.reason,
    });

    throw paymentError(
      'The payment provider could not process this request'
    );
  }

  logger.info('Razorpay API request completed', {
    method,
    path,
    status: response.status,
    providerId: payload?.id,
    providerOrderId: payload?.order_id,
    amount: payload?.amount,
    currency: payload?.currency,
    providerStatus: payload?.status,
  });

  return payload;
}

function checkoutResponse(order, razorpayOrderId) {
  return {
    ...order,
    checkout: {
      keyId: env.RAZORPAY_KEY_ID,
      orderId: razorpayOrderId,
      amount: amountInPaise(order.total),
      currency: CURRENCY,
      name: 'LaadliBytes',
      description: `Order ${order.orderNumber}`,
      prefill: {
        name: order.address.name,
        contact: order.contact.phone,
        ...(order.contact.email ? { email: order.contact.email } : {}),
      },
    },
  };
}

function logCheckoutReady(order, razorpayOrderId, outcome) {
  logger.info(`Razorpay checkout ${outcome}`, {
    orderId: order.id,
    orderNumber: order.orderNumber,
    razorpayOrderId,
    amount: amountInPaise(order.total),
    currency: CURRENCY,
  });
  return checkoutResponse(order, razorpayOrderId);
}

function assertPaymentMatchesOrder(payment, order) {
  if (
    payment.order_id !== order.razorpayOrderId ||
    payment.amount !== amountInPaise(order.total) ||
    payment.currency !== CURRENCY
  ) {
    throw ApiError.badRequest('The Razorpay payment does not match this order', { code: 'PAYMENT_DETAILS_MISMATCH' });
  }
}

function expectedCheckoutSignature(orderId, paymentId) {
  return crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

function expectedWebhookSignature(rawBody) {
  return crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
}

export const paymentService = {
  async resumeCheckout(userId, orderId) {
    assertApiCredentials();
    const order = await orderService.getCheckoutForUser(orderId, userId);
    if (!order) throw ApiError.notFound('Order not found', { code: 'ORDER_NOT_FOUND' });
    if (
      order.status !== 'placed' ||
      !['pending', 'failed'].includes(order.paymentStatus) ||
      !order.razorpayOrderId
    ) {
      throw ApiError.conflict('This order is not available for payment', { code: 'CHECKOUT_CLOSED' });
    }
    return logCheckoutReady(await orderService.getMine(userId, order.id), order.razorpayOrderId, 'resumed');
  },

  async createCheckout(userId, payload) {
    assertApiCredentials();
    const existing = await orderService.findCheckout(userId, payload.checkoutKey);
    if (existing) {
      if (existing.status !== 'placed' || existing.paymentStatus === 'paid') {
        throw ApiError.conflict('This checkout can no longer accept payment', { code: 'CHECKOUT_CLOSED' });
      }
      if (!existing.razorpayOrderId) {
        throw ApiError.conflict('Checkout is still being created. Please retry shortly.', {
          code: 'CHECKOUT_IN_PROGRESS',
        });
      }
      return logCheckoutReady(await orderService.getMine(userId, existing.id), existing.razorpayOrderId, 'reused');
    }

    let order;
    try {
      order = await orderService.placeOrder(userId, payload, { deferCartRemoval: true });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const raced = await orderService.findCheckout(userId, payload.checkoutKey);
      if (raced?.razorpayOrderId) {
        return logCheckoutReady(await orderService.getMine(userId, raced.id), raced.razorpayOrderId, 'reused');
      }
      throw ApiError.conflict('Checkout is already being created. Please retry shortly.', {
        code: 'CHECKOUT_IN_PROGRESS',
      });
    }

    try {
      const providerOrder = await razorpayRequest('/orders', {
        method: 'POST',
        body: {
          amount: amountInPaise(order.total),
          currency: CURRENCY,
          receipt: order.orderNumber,
          notes: { localOrderId: order.id },
        },
      });

      if (
        typeof providerOrder.id !== 'string' ||
        providerOrder.amount !== amountInPaise(order.total) ||
        providerOrder.currency !== CURRENCY ||
        providerOrder.receipt !== order.orderNumber
      ) {
        throw paymentError('The payment provider returned order details that do not match');
      }

      const linkedOrder = await orderService.attachRazorpayOrder(order.id, userId, providerOrder.id);
      if (!linkedOrder) {
        throw ApiError.conflict('The order changed while checkout was being created', { code: 'ORDER_CHANGED' });
      }

      return logCheckoutReady(await orderService.getMine(userId, order.id), linkedOrder.razorpayOrderId, 'created');
    } catch (error) {
      try {
        await orderService.discardUnpaidCheckout(order.id, userId);
      } catch (cleanupError) {
        logger.error('Could not release stock for a failed Razorpay checkout setup', {
          orderId: order.id,
          message: cleanupError.message,
        });
      }
      throw error;
    }
  },

  async verifyCheckoutPayment(userId, localOrderId, details) {
    assertApiCredentials();
    const order = await orderService.getCheckoutForUser(localOrderId, userId);
    if (!order) throw ApiError.notFound('Order not found', { code: 'ORDER_NOT_FOUND' });
    if (!order.razorpayOrderId || details.razorpay_order_id !== order.razorpayOrderId) {
      throw ApiError.badRequest('The Razorpay order does not match this checkout', { code: 'PAYMENT_ORDER_MISMATCH' });
    }

    const expected = expectedCheckoutSignature(details.razorpay_order_id, details.razorpay_payment_id);
    if (!timingSafeHexEqual(details.razorpay_signature, expected)) {
      throw ApiError.badRequest('Razorpay payment signature is invalid', { code: 'PAYMENT_SIGNATURE_INVALID' });
    }
    if (order.paymentStatus === 'paid' && order.paymentReference === details.razorpay_payment_id) {
      const paidOrder = await orderService.getMine(userId, localOrderId);
      if (order.checkoutUsesCart) await orderService.removeOrderedCartItems(userId, paidOrder.items);
      logger.info('Razorpay payment verification reused', {
        orderId: localOrderId,
        razorpayOrderId: order.razorpayOrderId,
        paymentStatus: paidOrder.paymentStatus,
      });
      return paidOrder;
    }

    const payment = await razorpayRequest(`/payments/${encodeURIComponent(details.razorpay_payment_id)}`);
    assertPaymentMatchesOrder(payment, order);
    if (payment.status !== 'captured') {
      throw ApiError.conflict('Payment has not been captured yet. Please wait for confirmation.', {
        code: 'PAYMENT_NOT_CAPTURED',
      });
    }

    const removeFromCart = order.checkoutUsesCart;
    const paidOrder = await orderService.markPaymentPaid(order, details.razorpay_payment_id);
    if (removeFromCart) await orderService.removeOrderedCartItems(userId, paidOrder.items);
    logger.info('Razorpay payment verified', {
      orderId: localOrderId,
      razorpayOrderId: order.razorpayOrderId,
      paymentStatus: paidOrder.paymentStatus,
    });
    return paidOrder;
  },

  verifyWebhookSignature(rawBody, signature) {
    assertApiCredentials();
    assertWebhookSecret();
    if (!Buffer.isBuffer(rawBody) || typeof signature !== 'string') return false;
    return timingSafeHexEqual(signature, expectedWebhookSignature(rawBody));
  },

  async processWebhookEvent(event) {
    const type = event?.event;
    if (!['order.paid', 'payment.captured', 'payment.failed'].includes(type)) {
      logger.info('Razorpay webhook event ignored', {
        event: typeof type === 'string' ? type : 'unknown',
      });
      return;
    }

    logger.info('Razorpay webhook event received', { event: type });

    const payment = event.payload?.payment?.entity;
    if (
      !payment ||
      typeof payment.id !== 'string' ||
      typeof payment.order_id !== 'string' ||
      !Number.isInteger(payment.amount) ||
      typeof payment.currency !== 'string'
    ) {
      throw ApiError.badRequest('Razorpay webhook payment details are invalid', { code: 'INVALID_PAYMENT_EVENT' });
    }

    const order = await orderService.checkoutForRazorpayOrder(payment.order_id);
    if (!order) {
      logger.warn('Ignoring a Razorpay event for an unknown local order', { razorpayOrderId: payment.order_id });
      return;
    }
    assertPaymentMatchesOrder(payment, order);

    if (type === 'order.paid' || type === 'payment.captured') {
      if (payment.status !== 'captured') {
        throw ApiError.badRequest('Razorpay capture event is not captured', { code: 'INVALID_PAYMENT_EVENT' });
      }
      await orderService.markPaymentPaid(order, payment.id);
      if (order.checkoutUsesCart) await orderService.removeOrderedCartItems(order.user, order.items);
      logger.info('Razorpay webhook payment marked paid', {
        event: type,
        orderId: order.id,
        razorpayOrderId: payment.order_id,
        paymentStatus: 'paid',
      });
    } else {
      if (payment.status !== 'failed') {
        throw ApiError.badRequest('Razorpay failure event is not failed', { code: 'INVALID_PAYMENT_EVENT' });
      }
      await orderService.markPaymentFailed(order, payment.id);
      logger.info('Razorpay webhook payment marked failed', {
        event: type,
        orderId: order.id,
        razorpayOrderId: payment.order_id,
        paymentStatus: 'failed',
      });
    }
  },
};

export default paymentService;
