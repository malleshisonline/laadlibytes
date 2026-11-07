// Mirrors backend/src/utils/deliveryEstimate.js: change both together. The date saved on an order
// (order.estimatedDeliveryBy) is always the backend's; this copy only previews it before payment.

// Hyderabad and Secunderabad pincodes all start with 500.
export const LOCAL_PINCODE_PREFIX = '500'
export const LOCAL_DELIVERY_DAYS = 2
export const STANDARD_DELIVERY_DAYS = 7

const PINCODE_PATTERN = /^[1-9]\d{5}$/

const istDateParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const deliveryDateFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

export const isValidPincode = (pincode) => PINCODE_PATTERN.test(String(pincode ?? '').trim())

export const isLocalPincode = (pincode) => String(pincode ?? '').trim().startsWith(LOCAL_PINCODE_PREFIX)

/** Days from payment to the door for this pincode, after `leadTimeDays` of making a gift hamper. */
export function deliveryDaysFor(pincode, leadTimeDays = 0) {
  return Math.max(0, leadTimeDays || 0) + (isLocalPincode(pincode) ? LOCAL_DELIVERY_DAYS : STANDARD_DELIVERY_DAYS)
}

/** `days` calendar days after `startDate`'s day in India, as noon IST on that day. */
export function deliveryDateFrom(startDate, days) {
  const [year, month, day] = istDateParts.format(startDate).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days, 6, 30))
}

/** The preview for an order paid today, or null without a valid pincode. */
export function estimateDelivery(pincode, leadTimeDays = 0, today = new Date()) {
  if (!isValidPincode(pincode)) return null
  const days = deliveryDaysFor(pincode, leadTimeDays)
  return { days, date: deliveryDateFrom(today, days), isLocal: isLocalPincode(pincode) }
}

/** "Mon, 9 Nov", in India's calendar whatever the browser's time zone. */
export const formatDeliveryDate = (value) => deliveryDateFormatter.format(new Date(value))

/**
 * One line about when a placed order arrives: "Delivered on Mon, 9 Nov", "Expected by Mon, 9 Nov", or null
 * for an order paid before estimates existed.
 */
export function orderDeliveryNote(order) {
  if (order.status === 'delivered') {
    const deliveredAt = order.history?.findLast?.((entry) => entry.event === 'status' && entry.value === 'delivered')?.at
    return deliveredAt ? `Delivered on ${formatDeliveryDate(deliveredAt)}` : null
  }
  return order.estimatedDeliveryBy ? `Expected by ${formatDeliveryDate(order.estimatedDeliveryBy)}` : null
}

/** True once the promised day in India is over and the order is still not delivered. */
export function isDeliveryOverdue(estimatedDeliveryBy, status) {
  if (!estimatedDeliveryBy || status === 'delivered') return false
  return istDateParts.format(new Date()) > istDateParts.format(new Date(estimatedDeliveryBy))
}