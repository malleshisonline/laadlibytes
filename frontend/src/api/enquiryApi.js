import { API_ENDPOINTS } from '../constants/apiEndpoints.js'
import { httpClient } from './httpClient.js'

export const enquiryApi = {
  /**
   * Contact Us message: { name, email, subject?, message, website? (honeypot) }. A gift hamper bulk/corporate
   * quote adds { type: 'bulk', phone (required), company?, hamper? (id), quantity? }.
   */
  send: (enquiry) => httpClient.post(API_ENDPOINTS.ENQUIRIES.CREATE, enquiry),
}

export default enquiryApi