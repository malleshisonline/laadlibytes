import { sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/ApiError.js';

import { paymentService } from './payment.service.js';

export const paymentController = {
  webhook: asyncHandler(async (req, res) => {
    const signature = req.get('x-razorpay-signature');
    if (!paymentService.verifyWebhookSignature(req.rawBody, signature)) {
      throw ApiError.unauthorized('Invalid Razorpay webhook signature', { code: 'INVALID_WEBHOOK_SIGNATURE' });
    }

    await paymentService.processWebhookEvent(req.body);
    sendResponse(res, { message: 'Razorpay webhook received', data: { received: true } });
  }),
};

export default paymentController;
