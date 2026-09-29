import { API_ENDPOINTS } from '../constants/apiEndpoints.js'
import { httpClient } from './httpClient.js'

export const enquiryApi = {
  /** Contact Us message: { name, email, subject?, message, website? (honeypot) }. */
  send: (enquiry) => httpClient.post(API_ENDPOINTS.ENQUIRIES.CREATE, enquiry),
}

export default enquiryApi