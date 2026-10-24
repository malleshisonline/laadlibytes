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

/**
 * Asks Razorpay for the checkout's payments and returns the captured one, or null. A payment that is
 * only authorized (manual capture in the Razorpay account) is captured here first, so it counts too.
 */
async function findCapturedPayment(order) {
  const { items = [] } = await razorpayRequest(`/orders/${encodeURIComponent(order.razorpayOrderId)}/payments`);
  const amount = amountInPaise(order.total);
  const matching = items.filter((payment) => payment.amount === amount && payment.currency === CURRENCY);

  const captured = matching.find((payment) => payment.status === 'captured');
  if (captured) return captured;

  const authorized = matching.find((payment) => payment.status === 'authorized');
  if (!authorized) return null;
  const capturedNow = await razorpayRequest(`/payments/${encodeURIComponent(authorized.id)}/capture`, {
    method: 'POST',
    body: { amount, currency: CURRENCY },
  });
  return capturedNow.status === 'captured' ? capturedNow : null;
}

/** Records a captured payment on its checkout, which places the order. */
async function placePaidCheckout(order, payment) {
  assertPaymentMatchesOrder(payment, order);
  const paidOrder = await orderService.markPaymentPaid(order, payment.id);
  if (order.checkoutUsesCart) await orderService.removeOrderedCartItems(order);
  return paidOrder;
}

// A checkout left unpaid this long gives its stock back. Checkout's own payment window closes after
// CHECKOUT_TIMEOUT_SECONDS on the storefront, well inside this.
export const ABANDONED_CHECKOUT_AFTER_MS = 30 * 60 * 1000;

/**
 * `owner` is `{ userId }` for a signed-in customer or `{ guestCheckoutKey }` for a guest order; see
 * ownerFilter in order.service.js.
 */
export const paymentService = {
  async resumeCheckout(owner, orderId) {
    assertApiCredentials();
    const order = await orderService.getCheckoutFor(owner, orderId);
    if (!order) throw ApiError.notFound('Order not found', { code: 'ORDER_NOT_FOUND' });
    if (
      order.status !== 'placed' ||
      !['pending', 'failed'].includes(order.paymentStatus) ||
      !order.razorpayOrderId ||
      order.stockReleased
    ) {
      throw ApiError.conflict('This order is not available for payment', { code: 'CHECKOUT_CLOSED' });
    }
    return logCheckoutReady(await orderService.getFor(owner, order.id), order.razorpayOrderId, 'resumed');
  },

  /** `guestCartToken` is the guest's raw `cartId` cookie, used only for a guest cart order. */
  async createCheckout(owner, payload, guestCartToken = null) {
    assertApiCredentials();
    const existing = await orderService.findCheckout(owner, payload.checkoutKey);
    if (existing) {
      // An abandoned checkout gave its stock back, so it cannot be reopened; the storefront starts a new one.
      if (existing.status !== 'placed' || existing.paymentStatus === 'paid' || existing.stockReleased) {
        throw ApiError.conflict('This checkout can no longer accept payment', { code: 'CHECKOUT_CLOSED' });
      }
      if (!existing.razorpayOrderId) {
        throw ApiError.conflict('Checkout is still being created. Please retry shortly.', {
          code: 'CHECKOUT_IN_PROGRESS',
        });
      }
      return logCheckoutReady(await orderService.getFor(owner, existing.id), existing.razorpayOrderId, 'reused');
    }

    let order;
    try {
      order = await orderService.placeFor(owner, payload, guestCartToken);
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const raced = await orderService.findCheckout(owner, payload.checkoutKey);
      if (raced?.razorpayOrderId) {
        return logCheckoutReady(await orderService.getFor(owner, raced.id), raced.razorpayOrderId, 'reused');
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

      const linkedOrder = await orderService.attachRazorpayOrder(order.id, owner, providerOrder.id);
      if (!linkedOrder) {
        throw ApiError.conflict('The order changed while checkout was being created', { code: 'ORDER_CHANGED' });
      }

      return logCheckoutReady(await orderService.getFor(owner, order.id), linkedOrder.razorpayOrderId, 'created');
    } catch (error) {
      try {
        await orderService.discardUnpaidCheckout(order.id, owner);
      } catch (cleanupError) {
        logger.error('Could not release stock for a failed Razorpay checkout setup', {
          orderId: order.id,
          message: cleanupError.message,
        });
      }
      throw error;
    }
  },

  async verifyCheckoutPayment(owner, localOrderId, details) {
    assertApiCredentials();
    const order = await orderService.getCheckoutFor(owner, localOrderId);
    if (!order) throw ApiError.notFound('Order not found', { code: 'ORDER_NOT_FOUND' });
    if (!order.razorpayOrderId || details.razorpay_order_id !== order.razorpayOrderId) {
      throw ApiError.badRequest('The Razorpay order does not match this checkout', { code: 'PAYMENT_ORDER_MISMATCH' });
    }

    const expected = expectedCheckoutSignature(details.razorpay_order_id, details.razorpay_payment_id);
    if (!timingSafeHexEqual(details.razorpay_signature, expected)) {
      throw ApiError.badRequest('Razorpay payment signature is invalid', { code: 'PAYMENT_SIGNATURE_INVALID' });
    }
    if (order.paymentStatus === 'paid' && order.paymentReference === details.razorpay_payment_id) {
      const paidOrder = await orderService.getFor(owner, localOrderId);
      if (order.checkoutUsesCart) await orderService.removeOrderedCartItems(order);
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
    if (removeFromCart) await orderService.removeOrderedCartItems(order);
    logger.info('Razorpay payment verified', {
      orderId: localOrderId,
      razorpayOrderId: order.razorpayOrderId,
      paymentStatus: paidOrder.paymentStatus,
    });
    return paidOrder;
  },

  /**
   * Whether the checkout has been paid, asked of Razorpay directly so it never waits on a webhook.
   * Resolves to `{ paymentStatus: 'paid', order }` once paid (placing the order if this call found the
   * payment), else `{ paymentStatus: 'pending' | 'failed', order: null }`. With `abandon`, sent when the
   * shopper closes the payment window, an unpaid checkout also gives its stock back.
   */
  async syncCheckoutPayment(owner, localOrderId, { abandon = false } = {}) {
    assertApiCredentials();
    const order = await orderService.getCheckoutFor(owner, localOrderId);
    if (!order?.razorpayOrderId) throw ApiError.notFound('Order not found', { code: 'ORDER_NOT_FOUND' });

    if (order.paymentStatus !== 'paid') {
      const payment = await findCapturedPayment(order);
      if (payment) {
        const paidOrder = await placePaidCheckout(order, payment);
        logger.info('Razorpay payment found by status check', { orderId: order.id, razorpayOrderId: order.razorpayOrderId });
        return { paymentStatus: 'paid', order: paidOrder };
      }
      if (abandon) await orderService.releaseCheckoutStock(order);
      return { paymentStatus: order.paymentStatus, order: null };
    }

    return { paymentStatus: 'paid', order: await orderService.getFor(owner, order.id) };
  },

  /**
   * Gives back the stock of checkouts left unpaid past ABANDONED_CHECKOUT_AFTER_MS (a closed tab never
   * sends `abandon`). Each is checked with Razorpay first, so a payment that did go through places its
   * order instead. One failing checkout is logged and never stops the rest.
   */
  async releaseAbandonedCheckouts() {
    const checkouts = await orderService.findAbandonedCheckouts(new Date(Date.now() - ABANDONED_CHECKOUT_AFTER_MS));
    for (const order of checkouts) {
      try {
        const payment = await findCapturedPayment(order);
        if (payment) await placePaidCheckout(order, payment);
        else await orderService.releaseCheckoutStock(order);
      } catch (error) {
        logger.error('Could not settle an abandoned checkout', { orderId: order.id, message: error.message });
      }
    }
    if (checkouts.length) logger.info('Abandoned checkouts settled', { count: checkouts.length });
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
      if (order.checkoutUsesCart) await orderService.removeOrderedCartItems(order);
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
      // Razorpay's own reason, so a failure can be diagnosed from the logs alone.
      logger.info('Razorpay webhook payment marked failed', {
        event: type,
        orderId: order.id,
        razorpayOrderId: payment.order_id,
        paymentStatus: 'failed',
        errorCode: payment.error_code,
        errorDescription: payment.error_description,
        errorReason: payment.error_reason,
        errorSource: payment.error_source,
      });
    }
  },
};

export default paymentService;
