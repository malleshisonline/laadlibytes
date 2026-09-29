import { Router } from 'express';

import { validate } from '../../middlewares/validate.js';

import { enquiryController } from './enquiry.controller.js';
import { enquiryIdParamSchema, listEnquiriesQuerySchema, updateEnquirySchema } from './enquiry.validation.js';

/**
 * Mounted at /admin/enquiries by src/modules/admin/admin.routes.js, which already applied
 * `authenticate` and `authorize('admin')` — no route here repeats the guard.
 */
const router = Router();

router.get('/', validate({ query: listEnquiriesQuerySchema }), enquiryController.list);

router
  .route('/:id')
  .get(validate({ params: enquiryIdParamSchema }), enquiryController.getById)
  .patch(validate({ params: enquiryIdParamSchema, body: updateEnquirySchema }), enquiryController.update);

export default router;