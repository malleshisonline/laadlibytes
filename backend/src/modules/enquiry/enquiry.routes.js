import { Router } from 'express';

import { optionalAuth } from '../../middlewares/authenticate.js';
import { enquiryLimiter } from '../../middlewares/rateLimiter.js';
import { validate } from '../../middlewares/validate.js';

import { enquiryController } from './enquiry.controller.js';
import { createEnquirySchema } from './enquiry.validation.js';

/** Contact Us. Guests can send; a signed-in sender's account is linked to the enquiry. */
const router = Router();

router.post('/', enquiryLimiter, optionalAuth, validate({ body: createEnquirySchema }), enquiryController.create);

export default router;