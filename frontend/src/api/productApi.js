import { API_ENDPOINTS } from '../constants/apiEndpoints.js'

import { httpClient } from './httpClient.js'

/** `?a=1&b=2` from an object, leaving out empty values. Empty string when nothing is left. */
function toQueryString(query) {
  const params = new URLSearchParams(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const productApi = {
  /**
   * Public product list. Resolves to an array of products ({ id, name, slug, price, images: [{ url, alt }], … }).
   * Query values: limit (1–100), page, sort (newest | oldest | price_asc | price_desc | name_asc | name_desc),
   * category (slug), search, minPrice, maxPrice, inStock, featured.
   */
  list: (query = {}) => httpClient.get(`${API_ENDPOINTS.PRODUCTS.LIST}${toQueryString(query)}`),

  /**
   * One page of the list, with its pagination. Resolves to { products, meta }, where meta is
   * { page, limit, total, totalPages, hasNextPage, hasPrevPage }. Same query values as `list`.
   */
  listPage: async (query = {}) => {
    const { data, meta } = await httpClient.getWithMeta(`${API_ENDPOINTS.PRODUCTS.LIST}${toQueryString(query)}`)
    return { products: data ?? [], meta }
  },

  /** One published product by slug. Rejects with status 404 when there is no such product. */
  getBySlug: (slug) => httpClient.get(API_ENDPOINTS.PRODUCTS.DETAIL(slug)),
}

export default productApi