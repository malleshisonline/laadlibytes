import { API_ENDPOINTS } from '../constants/apiEndpoints.js'

import { httpClient } from './httpClient.js'

// The signed-in user's own orders. An order keeps its own copy of the items and the address, so it never
// changes when a product or a saved address does. Only the shop changes an order after it is placed.
export const orderApi = {
  /**
   * Places an order and resolves to it. `buyNow` ({ productId, quantity }) orders that product alone and leaves
   * the cart as it is; without it the whole cart is ordered and those lines leave the cart.
   */
  place: ({ addressId, buyNow }) => httpClient.post(API_ENDPOINTS.ORDERS.ROOT, buyNow ? { addressId, buyNow } : { addressId }),

  /** Resolves to { data: orders (newest first), meta: { page, totalPages, hasNextPage, … } }. */
  list: (page = 1) => httpClient.getWithMeta(`${API_ENDPOINTS.ORDERS.ROOT}?${new URLSearchParams({ page: String(page) })}`),

  get: (id) => httpClient.get(API_ENDPOINTS.ORDERS.ITEM(id)),
}

export default orderApi