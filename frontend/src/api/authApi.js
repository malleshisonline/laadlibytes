import { API_ENDPOINTS } from '../constants/apiEndpoints.js'

import { httpClient } from './httpClient.js'

// An OTP "challenge" is what every send returns:
// { verificationId, purpose, channel, destination, expiresInSeconds, resendAfterSeconds }.
export const authApi = {
  /** Resolves to { channel, identifier, exists }. */
  identify: (identifier) => httpClient.post(API_ENDPOINTS.AUTH.IDENTIFY, { identifier }),

  /** Sends the sign-up OTP. Resolves to a challenge. */
  register: ({ identifier, name, password, confirmPassword }) =>
    httpClient.post(API_ENDPOINTS.AUTH.REGISTER, { identifier, name, password, confirmPassword }),

  /** Resolves to { user, accessToken }; the refresh token arrives as an httpOnly cookie. */
  login: ({ identifier, password }) => httpClient.post(API_ENDPOINTS.AUTH.LOGIN, { identifier, password }),

  /** Sends a login OTP to an existing account. Resolves to a challenge. */
  requestLoginOtp: (identifier) => httpClient.post(API_ENDPOINTS.AUTH.LOGIN_OTP, { identifier }),

  /** Finishes sign-up or OTP login. Resolves to { user, accessToken }. */
  verifyOtp: ({ verificationId, otp }) => httpClient.post(API_ENDPOINTS.AUTH.OTP_VERIFY, { verificationId, otp }),

  /** Sends a new code for the same challenge. Resolves to a challenge. */
  resendOtp: (verificationId) => httpClient.post(API_ENDPOINTS.AUTH.OTP_RESEND, { verificationId }),
}

export default authApi