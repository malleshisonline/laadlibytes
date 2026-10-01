import { API_ENDPOINTS } from '../constants/apiEndpoints.js'

import { httpClient } from './httpClient.js'

export const userApi = {
  /** Resolves to the updated user. Only the name can be changed here. */
  updateMe: ({ name }) => httpClient.patch(API_ENDPOINTS.USERS.ME, { name }),

  /** Keeps this device signed in and signs out every other one. */
  changePassword: ({ currentPassword, newPassword, confirmPassword }) =>
    httpClient.post(API_ENDPOINTS.USERS.ME_PASSWORD, { currentPassword, newPassword, confirmPassword }),
}

export default userApi