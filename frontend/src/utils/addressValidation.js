import { INDIAN_STATES } from '../constants/indianStates.js'

const PINCODE_PATTERN = /^[1-9]\d{5}$/
// 10 digits starting 6–9, after dropping spaces, dashes and a leading +91, 91 or 0.
const MOBILE_PATTERN = /^[6-9]\d{9}$/

export const EMPTY_ADDRESS = {
  name: '',
  phone: '',
  pincode: '',
  line1: '',
  line2: '',
  landmark: '',
  city: '',
  state: '',
}

/** The 10-digit part of an Indian mobile number, e.g. '+91 98765-43210' → '9876543210'. */
export function localMobileDigits(phone) {
  const digits = String(phone ?? '').replace(/[\s\-().]/g, '')
  return digits.replace(/^(\+91|91(?=\d{10}$)|0(?=\d{10}$))/, '')
}

/** '+919876543210' → '+91 98765 43210', for display. */
export function formatIndianMobile(phone) {
  const local = localMobileDigits(phone)
  return MOBILE_PATTERN.test(local) ? `+91 ${local.slice(0, 5)} ${local.slice(5)}` : phone
}

/** An address on one line, the way Flipkart lists them: street, area, landmark, city, state - PIN. */
export function formatAddressLine({ line1, line2, landmark, city, state, pincode }) {
  const landmarkText = landmark && `Near ${landmark.replace(/^near\s+/i, '')}`
  return [line1, line2, landmarkText, city, `${state} - ${pincode}`].filter(Boolean).join(', ')
}

// Mirrors createAddressSchema in backend/src/modules/address/address.validation.js; the backend still decides.
export function validateAddress(values) {
  const errors = {}
  const name = values.name.trim()
  const line1 = values.line1.trim()
  const city = values.city.trim()

  if (name.length < 2) errors.name = 'Name must be at least 2 characters'
  else if (name.length > 60) errors.name = 'Name must be at most 60 characters'

  if (!values.phone.trim()) errors.phone = 'Mobile number is required'
  else if (!MOBILE_PATTERN.test(localMobileDigits(values.phone))) errors.phone = 'Enter a valid 10-digit mobile number'

  if (!PINCODE_PATTERN.test(values.pincode.trim())) errors.pincode = 'Enter a valid 6-digit PIN code'

  if (line1.length < 3) errors.line1 = 'Enter the house number and street'
  else if (line1.length > 120) errors.line1 = 'Must be at most 120 characters'

  if (values.line2.trim().length > 120) errors.line2 = 'Must be at most 120 characters'
  if (values.landmark.trim().length > 80) errors.landmark = 'Must be at most 80 characters'

  if (city.length < 2) errors.city = 'Enter the city'
  else if (city.length > 60) errors.city = 'Must be at most 60 characters'

  if (!INDIAN_STATES.includes(values.state)) errors.state = 'Choose a state'

  return errors
}

/** Trimmed request body for POST / PATCH /addresses. Empty optional fields are sent as '' so an edit clears them. */
export function toAddressPayload(values) {
  return {
    name: values.name.trim(),
    phone: localMobileDigits(values.phone),
    pincode: values.pincode.trim(),
    line1: values.line1.trim(),
    line2: values.line2.trim(),
    landmark: values.landmark.trim(),
    city: values.city.trim(),
    state: values.state,
  }
}