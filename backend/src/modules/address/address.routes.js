import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema } from '../../utils/validators.js';

import { addressController } from './address.controller.js';
import { createAddressSchema, updateAddressSchema } from './address.validation.js';

/** The signed-in user's own delivery addresses. There is no admin view of these. */
const router = Router();

router.use(authenticate);

router.get('/', addressController.list);
router.post('/', validate({ body: createAddressSchema }), addressController.create);
router.patch('/:id', validate({ params: idParamSchema, body: updateAddressSchema }), addressController.update);
router.delete('/:id', validate({ params: idParamSchema }), addressController.remove);
router.post('/:id/default', validate({ params: idParamSchema }), addressController.setDefault);

export default router;