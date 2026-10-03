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
  ORDERS: {
    ROOT: '/orders',
    ITEM: (id) => `/orders/${encodeURIComponent(id)}`,
  },
  // Everything under /admin needs an admin token; the backend checks the role once for the whole surface.
  ADMIN: {
    SUMMARY: '/admin/summary',
    ORDERS: '/admin/orders',
    ORDER: (id) => `/admin/orders/${encodeURIComponent(id)}`,
    ORDER_STATUS: (id) => `/admin/orders/${encodeURIComponent(id)}/status`,
    ORDER_PAYMENT: (id) => `/admin/orders/${encodeURIComponent(id)}/payment`,
    PRODUCTS: '/admin/products',
    PRODUCT: (id) => `/admin/products/${encodeURIComponent(id)}`,
    CATEGORIES: '/admin/categories',
    CATEGORY: (id) => `/admin/categories/${encodeURIComponent(id)}`,
    USERS: '/admin/users',
    USER: (id) => `/admin/users/${encodeURIComponent(id)}`,
    ENQUIRIES: '/admin/enquiries',
    ENQUIRY: (id) => `/admin/enquiries/${encodeURIComponent(id)}`,
  },
}

export default API_ENDPOINTS