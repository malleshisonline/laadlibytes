import { API_ENDPOINTS } from '../constants/apiEndpoints.js'

import { httpClient } from './httpClient.js'

export const categoryApi = {
 
  list: () => httpClient.get(API_ENDPOINTS.CATEGORIES.LIST),
}

export default categoryApi