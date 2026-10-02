export const API_ENDPOINTS = {
  AUTH: {
    IDENTIFY: '/auth/identify',
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGIN_OTP: '/auth/login/otp',
    OTP_VERIFY: '/auth/otp/verify',
    OTP_RESEND: '/auth/otp/resend',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',  },
  PRODUCTS: {
    LIST: '/products',
    // One product by slug (or id).
    DETAIL: (idOrSlug) => `/products/${encodeURIComponent(idOrSlug)}`,
  },
  CART: {
    ROOT: '/cart',
    ITEMS: '/cart/items',
    ITEM: (productId) => `/cart/items/${encodeURIComponent(productId)}`,
  },
  CATEGORIES: {
    LIST: '/categories',
  },
  USERS: {
    ME: '/users/me',
    ME_PASSWORD: '/users/me/password',
  },
  ADDRESSES: {
    ROOT: '/addresses',
    ITEM: (id) => `/addresses/${encodeURIComponent(id)}`,
    DEFAULT: (id) => `/addresses/${encodeURIComponent(id)}/default`,
  },
  ENQUIRIES: {
    CREATE: '/enquiries',
  },
}

export default API_ENDPOINTS