import { API_ENDPOINTS } from '../constants/apiEndpoints.js'

import { httpClient } from './httpClient.js'

/**
 * The shopper's cart. Guests have one too: the backend keeps it under an httpOnly `cartId` cookie and merges
 * it into the account cart on sign-in. Every call resolves to the whole cart:
 * { items: [{ product: { id, name, slug, price, mrp, image, stock }, quantity, maxQuantity, lineTotal, issue }],
 *   itemCount, subtotal, mrpTotal, savings }, where `issue` is null, 'OUT_OF_STOCK' or 'INSUFFICIENT_STOCK'.
 */
export const cartApi = {
  get: () => httpClient.get(API_ENDPOINTS.CART.ROOT),

  /** Adds to the quantity already in the cart. Rejects with 409 (code INSUFFICIENT_STOCK / CART_LIMIT) past a limit. */
  addItem: (productId, quantity = 1) => httpClient.post(API_ENDPOINTS.CART.ITEMS, { productId, quantity }),

  updateItem: (productId, quantity) => httpClient.patch(API_ENDPOINTS.CART.ITEM(productId), { quantity }),

  removeItem: (productId) => httpClient.delete(API_ENDPOINTS.CART.ITEM(productId)),

  clear: () => httpClient.delete(API_ENDPOINTS.CART.ROOT),
}

export default cartApi