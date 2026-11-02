import { Router } from 'express';

import { validate } from '../../middlewares/validate.js';

import { giftHamperController } from './giftHamper.controller.js';
import { giftHamperSlugParamSchema } from './giftHamper.validation.js';

/**
 * The storefront side of gift hampers: reads only, active hampers only. Buying one goes through the
 * normal cart (/cart/hampers) and checkout. Everything that writes lives in giftHamper.admin.routes.js.
 */
const router = Router();

router.get('/', giftHamperController.list);
router.get('/:slug', validate({ params: giftHamperSlugParamSchema }), giftHamperController.getBySlug);

export default router;