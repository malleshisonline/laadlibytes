import { API_ENDPOINTS } from '../constants/apiEndpoints.js'

import { httpClient } from './httpClient.js'

// The signed-in user's own orders, plus guest checkout. An order keeps its own copy of the items and the address, so it never
// changes when a product or a saved address does. Only the shop changes an order after it is placed.
export const orderApi = {
  /**
   * Places an order and resolves to it. `buyNow` ({ productId, quantity }) orders that product alone and leaves
   * the cart as it is; without it the whole cart is ordered and those lines leave the cart.
   */
  place: ({ addressId, buyNow, checkoutKey }) =>
    httpClient.post(
      API_ENDPOINTS.ORDERS.ROOT,
      { addressId, ...(buyNow ? { buyNow } : {}), checkoutKey },
    ),
  resumePayment: (id) => httpClient.post(API_ENDPOINTS.ORDERS.CHECKOUT(id), {}),
  verifyPayment: (id, details) => httpClient.post(API_ENDPOINTS.ORDERS.VERIFY_PAYMENT(id), details),
  /**
   * Asks whether the checkout was paid; resolves to { paymentStatus, order }. `abandon: true` (the shopper closed
   * the payment window) also gives an unpaid checkout's stock back.
   */
  paymentStatus: (id, { abandon = false } = {}) =>
    httpClient.post(API_ENDPOINTS.ORDERS.PAYMENT_STATUS(id), { abandon }),

  /**
   * A guest order (not signed in): the address and an optional email are saved on the order only. Without
   * `buyNow` it orders the guest cart, found by the cart cookie. Keep `checkoutKey`: verifying needs it again.
   */
  placeGuest: ({ address, email, buyNow, checkoutKey }) =>
    httpClient.post(API_ENDPOINTS.ORDERS.GUEST, {
      address,
      ...(email ? { email } : {}),
      ...(buyNow ? { buyNow } : {}),
      checkoutKey,
    }),
  verifyGuestPayment: (id, checkoutKey, details) =>
    httpClient.post(API_ENDPOINTS.ORDERS.GUEST_VERIFY_PAYMENT(id), { ...details, checkoutKey }),
  guestPaymentStatus: (id, checkoutKey, { abandon = false } = {}) =>
    httpClient.post(API_ENDPOINTS.ORDERS.GUEST_PAYMENT_STATUS(id), { checkoutKey, abandon }),

  /** Resolves to { data: orders (newest first), meta: { page, totalPages, hasNextPage, … } }. */
  list: (page = 1) => httpClient.getWithMeta(`${API_ENDPOINTS.ORDERS.ROOT}?${new URLSearchParams({ page: String(page) })}`),

  get: (id) => httpClient.get(API_ENDPOINTS.ORDERS.ITEM(id)),
}

export default orderApi
