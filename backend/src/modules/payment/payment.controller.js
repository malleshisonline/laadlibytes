import { sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../config/logger.js';

import { paymentService } from './payment.service.js';

export const paymentController = {
  webhook: asyncHandler(async (req, res) => {
    const signature = req.get('x-razorpay-signature');
    if (!paymentService.verifyWebhookSignature(req.rawBody, signature)) {
      throw ApiError.unauthorized('Invalid Razorpay webhook signature', { code: 'INVALID_WEBHOOK_SIGNATURE' });
    }

    await paymentService.processWebhookEvent(req.body);
    logger.info('Razorpay webhook API completed', {
      method: req.method,
      apiPath: req.originalUrl.split('?')[0],
      event: req.body?.event,
    });
    sendResponse(res, { message: 'Razorpay webhook received', data: { received: true } });
  }),
};

export default paymentController;
