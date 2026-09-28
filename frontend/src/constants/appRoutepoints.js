export const APP_ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  IDENTIFY: '/identify',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_OTP: '/verify-otp',
  PRODUCTS: '/products',
  PRODUCT_DETAILS: '/products/:slug',
};

/** Link to one product's details page. */
export const productDetailsPath = (slug) => `${APP_ROUTES.PRODUCTS}/${encodeURIComponent(slug)}`;

export default APP_ROUTES;
