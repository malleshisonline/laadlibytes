import { API_ENDPOINTS } from '../constants/apiEndpoints.js'

import { httpClient } from './httpClient.js'

// Coupons on the storefront. The discount is always worked out by the backend; the page only shows it.
export const couponApi = {
  /** The coupon for the top banner: { code, description, type, value, maxDiscount, minOrderValue, endsAt }, or null. */
  featured: () => httpClient.get(API_ENDPOINTS.COUPONS.FEATURED),

  /**
   * Prices `code` against the cart, or the Buy Now line, and resolves to { code, description, subtotal, discount,
   * total }. `phone` (the delivery number) lets the per-customer limit be checked before paying.
   */
  apply: ({ code, buyNow, phone }) =>
    httpClient.post(API_ENDPOINTS.COUPONS.APPLY, {
      code,
      ...(buyNow ? { buyNow } : {}),
      ...(phone ? { phone } : {}),
    }),
}

export default couponApi