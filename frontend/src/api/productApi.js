import { API_ENDPOINTS } from '../constants/apiEndpoints.js'

import { httpClient } from './httpClient.js'

export const productApi = {
  /**
   * Public product list. Resolves to an array of products ({ id, name, slug, price, images: [{ url, alt }], … }).
   * Query values: limit (1–100), page, sort (newest | oldest | price_asc | price_desc | name_asc | name_desc),
   * category (slug), search.
   */
  list: (query = {}) => {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    )
    const queryString = params.toString()
    return httpClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}${queryString ? `?${queryString}` : ''}`)
  },
}

export default productApi