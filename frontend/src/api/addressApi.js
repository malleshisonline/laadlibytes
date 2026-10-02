import { API_ENDPOINTS } from '../constants/apiEndpoints.js'

import { httpClient } from './httpClient.js'

// Every call resolves to the user's whole address list, default first, so there is nothing to re-fetch.
// An address is { id, name, phone (E.164), pincode, line1, line2?, landmark?, city, state, isDefault }.
export const addressApi = {
  list: () => httpClient.get(API_ENDPOINTS.ADDRESSES.ROOT),
  create: (address) => httpClient.post(API_ENDPOINTS.ADDRESSES.ROOT, address),
  update: (id, address) => httpClient.patch(API_ENDPOINTS.ADDRESSES.ITEM(id), address),
  remove: (id) => httpClient.delete(API_ENDPOINTS.ADDRESSES.ITEM(id)),
  setDefault: (id) => httpClient.post(API_ENDPOINTS.ADDRESSES.DEFAULT(id)),
}

export default addressApi