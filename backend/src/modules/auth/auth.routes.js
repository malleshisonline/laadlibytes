import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { authLimiter, identifyLimiter, otpSendLimiter, otpVerifyLimiter } from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';

import { authController } from './auth.controller.js';
import {
  identifySchema,
  loginSchema,
  otpRequestSchema,
  otpResendSchema,
  otpVerifySchema,
  refreshSchema,
  registerSchema,
} from './auth.validation.js';

const router = Router();

router.post('/identify', identifyLimiter, validate({ body: identifySchema }), authController.identify);

router.post('/register', otpSendLimiter, validate({ body: registerSchema }), authController.register);

router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post('/login/otp', otpSendLimiter, validate({ body: otpRequestSchema }), authController.requestLoginOtp);

router.post('/otp/verify', otpVerifyLimiter, validate({ body: otpVerifySchema }), authController.verifyOtp);
router.post('/otp/resend', otpSendLimiter, validate({ body: otpResendSchema }), authController.resendOtp);

router.post('/refresh', authLimiter, validate({ body: refreshSchema }), authController.refresh);
router.post('/logout', authenticate, authController.logout);

export default router;