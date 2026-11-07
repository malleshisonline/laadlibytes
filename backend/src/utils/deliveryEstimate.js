/**
 * The shop's own delivery estimate, until a courier API gives a real one. Mirrored in
 * frontend/src/utils/deliveryEstimate.js, so checkout and the product page can answer without a request;
 * the date saved on an order is always worked out here.
 *
 * Calendar days, Sundays included. A made-to-order gift hamper adds its lead time before delivery.
 */

// Hyderabad and Secunderabad pincodes all start with 500.
export const LOCAL_PINCODE_PREFIX = '500';
export const LOCAL_DELIVERY_DAYS = 2;
export const STANDARD_DELIVERY_DAYS = 7;

const istDateParts = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Days from payment to the door for this pincode, after `leadTimeDays` of making the order. */
export function deliveryDaysFor(pincode, leadTimeDays = 0) {
  const transitDays = String(pincode ?? '').startsWith(LOCAL_PINCODE_PREFIX) ? LOCAL_DELIVERY_DAYS : STANDARD_DELIVERY_DAYS;
  return Math.max(0, leadTimeDays || 0) + transitDays;
}

/**
 * `days` calendar days after `startDate`'s day in India. Returned as noon IST on that day, so the date
 * reads the same in any time zone a client formats it in.
 */
export function deliveryDateFrom(startDate, days) {
  const [year, month, day] = istDateParts.format(startDate).split('-').map(Number);
  // 06:30 UTC is 12:00 IST.
  return new Date(Date.UTC(year, month - 1, day + days, 6, 30));
}

export default deliveryDaysFor;