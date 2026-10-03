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
  // My Account: one path per section rather than ?tab=.
  ACCOUNT: '/account',
  ACCOUNT_ORDERS: '/account/orders',
  ACCOUNT_ADDRESSES: '/account/addresses',
  ACCOUNT_SECURITY: '/account/security',
};

/** Link to one product's details page. */
export const productDetailsPath = (slug) => `${APP_ROUTES.PRODUCTS}/${encodeURIComponent(slug)}`;

/** Order Summary for one product only (Buy Now on a product that isn't in the cart). */
export const buyNowCheckoutPath = (slug, quantity = 1) =>
  `${APP_ROUTES.CHECKOUT}?${new URLSearchParams({ buyNow: slug, qty: String(quantity) })}`;

export default APP_ROUTES;
