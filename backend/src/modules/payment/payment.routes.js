import { Router } from 'express';

import { paymentController } from './payment.controller.js';

const router = Router();

router.post('/webhook', paymentController.webhook);

export default router;
