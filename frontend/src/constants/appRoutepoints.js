export const APP_ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  IDENTIFY: '/identify',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_OTP: '/verify-otp',
  PRODUCTS: '/products',
  PRODUCT_DETAILS: '/products/:slug',
  CART: '/cart',
  CHECKOUT: '/checkout',
  // My Account: one path per section rather than ?tab=, because sign-in's returnTo keeps only the pathname.
  ACCOUNT: '/account',
  ACCOUNT_ORDERS: '/account/orders',
  ACCOUNT_ADDRESSES: '/account/addresses',
  ACCOUNT_SECURITY: '/account/security',
};

/** Link to one product's details page. */
export const productDetailsPath = (slug) => `${APP_ROUTES.PRODUCTS}/${encodeURIComponent(slug)}`;

export default APP_ROUTES;
