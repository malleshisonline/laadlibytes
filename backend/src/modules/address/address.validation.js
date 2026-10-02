import { z } from 'zod';

import { indianMobileSchema, pincodeSchema } from '../../utils/validators.js';

import { INDIAN_STATES } from './address.model.js';

// line2 and landmark are optional; an empty string clears them on update.
const addressFields = {
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  phone: indianMobileSchema,
  pincode: pincodeSchema,
  line1: z.string().trim().min(3, 'Enter the house number and street').max(120),
  line2: z.string().trim().max(120).optional(),
  landmark: z.string().trim().max(80).optional(),
  city: z.string().trim().min(2, 'Enter the city').max(60),
  state: z.enum(INDIAN_STATES, { error: 'Choose a state' }),
};

export const createAddressSchema = z.object({
  ...addressFields,
  isDefault: z.boolean().optional(),
});

// The default is changed through POST /addresses/:id/default, not here.
export const updateAddressSchema = z
  .object(addressFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });