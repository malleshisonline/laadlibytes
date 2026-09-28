export const API_ENDPOINTS = {
  AUTH: {
    IDENTIFY: '/auth/identify',
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGIN_OTP: '/auth/login/otp',
    OTP_VERIFY: '/auth/otp/verify',
    OTP_RESEND: '/auth/otp/resend',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  PRODUCTS: {
    LIST: '/products',
    // One product by slug (or id).
    DETAIL: (idOrSlug) => `/products/${encodeURIComponent(idOrSlug)}`,
  },
  CATEGORIES: {
    LIST: '/categories',
  },
  USERS: {
    ME: '/users/me',
  },
}

export default API_ENDPOINTS