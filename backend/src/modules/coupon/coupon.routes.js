import { Router } from 'express';

import { optionalAuthStrict } from '../../middlewares/authenticate.js';
import { couponApplyLimiter } from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';

import { couponController } from './coupon.controller.js';
import { applyCouponSchema } from './coupon.validation.js';

/**
 * The storefront side of coupons. Only the featured one is listed; every other code stays private
 * and is shared by link. Applying a code prices it on the server; placing the order checks it again.
 */
const router = Router();

router.get('/featured', couponController.featured);

// Guests too, like the cart: no token is a guest (their cart comes from the `cartId` cookie), but an
// expired one is a 401 so the client refreshes instead of pricing the guest cart.
router.post('/apply', couponApplyLimiter, optionalAuthStrict, validate({ body: applyCouponSchema }), couponController.apply);

export default router;