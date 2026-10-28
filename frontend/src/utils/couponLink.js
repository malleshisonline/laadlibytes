import { formatPrice } from './productFormatters.js'

// A coupon the shopper picked up from a share link (`?coupon=WELCOME10`) or applied at checkout, kept for this tab
// until an order is placed or they remove it. sessionStorage can be blocked (private mode), so it is a
// convenience: without it the shopper just types the code.
const STORAGE_KEY = 'laadlibytes.couponCode'

export const COUPON_QUERY_PARAM = 'coupon'

// The same characters the backend allows in a code.
const CODE_PATTERN = /^[A-Z0-9_-]{3,30}$/

export function normaliseCouponCode(code) {
  const upper = String(code ?? '').trim().toUpperCase()
  return CODE_PATTERN.test(upper) ? upper : null
}

export function readSavedCouponCode() {
  try {
    return normaliseCouponCode(globalThis.sessionStorage?.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function saveCouponCode(code) {
  try {
    globalThis.sessionStorage?.setItem(STORAGE_KEY, code)
  } catch {
    // Not remembered; checkout still works.
  }
}

// Sent when the banner or a share link picks up a code, so a checkout page already open applies it straight away.
export const COUPON_PICKED_EVENT = 'laadlibytes:coupon-picked'

/** Saves a code the shopper picked up outside checkout (banner, share link) and tells an open checkout. */
export function pickCouponCode(code) {
  saveCouponCode(code)
  globalThis.dispatchEvent?.(new CustomEvent(COUPON_PICKED_EVENT, { detail: code }))
}

export function clearSavedCouponCode() {
  try {
    globalThis.sessionStorage?.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}

/** "10% off up to ₹100 on orders above ₹499", from a coupon's own numbers (banner and admin list). */
export function describeCouponOffer({ type, value, maxDiscount, minOrderValue }) {
  const off = type === 'percent' ? `${value}% off` : `${formatPrice(value)} off`
  const cap = type === 'percent' && maxDiscount ? ` up to ${formatPrice(maxDiscount)}` : ''
  const minimum = minOrderValue > 0 ? ` on orders above ${formatPrice(minOrderValue)}` : ''
  return `${off}${cap}${minimum}`
}

/** The link an admin shares on WhatsApp or Instagram: the shop's home page, which applies the code at checkout. */
export const couponShareLink = (code) =>
  `${globalThis.location.origin}/?${new URLSearchParams({ [COUPON_QUERY_PARAM]: code })}`