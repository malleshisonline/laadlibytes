import { API_ENDPOINTS } from '../constants/apiEndpoints.js'

import { httpClient } from './httpClient.js'

/**
 * Gift hampers: fixed festive boxes, bought through the normal cart. A hamper is
 * { id, name, slug, code, headline, shortDescription, description, price, netWeightGrams, piecesPerBox,
 *   flavours: [name], images: [{ url, alt }], leadTimeDays, greetingCardLabel, accentColor, maxQtyPerOrder, seo }.
 */
export const giftHamperApi = {
  /** The hampers on sale, in display order. */
  list: () => httpClient.get(API_ENDPOINTS.GIFT_HAMPERS.LIST),

  /** One hamper on sale. Rejects with status 404 when there is no such hamper. */
  getBySlug: (slug) => httpClient.get(API_ENDPOINTS.GIFT_HAMPERS.DETAIL(slug)),
}

export default giftHamperApi