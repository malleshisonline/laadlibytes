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
  ACCOUNT_ORDER_DETAILS: '/account/orders/:id',
  ACCOUNT_ADDRESSES: '/account/addresses',
  ACCOUNT_SECURITY: '/account/security',
  // Admin panel: its own layout, admins only (RequireAdmin).
  ADMIN: '/admin',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_DETAILS: '/admin/orders/:id',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_NEW: '/admin/products/new',
  ADMIN_PRODUCT_EDIT: '/admin/products/:id/edit',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_CATEGORY_NEW: '/admin/categories/new',
  ADMIN_CATEGORY_EDIT: '/admin/categories/:id/edit',
  ADMIN_USERS: '/admin/users',
  ADMIN_ENQUIRIES: '/admin/enquiries',
};

export const adminOrderPath = (id) => `${APP_ROUTES.ADMIN_ORDERS}/${encodeURIComponent(id)}`;
export const adminProductEditPath = (id) => `${APP_ROUTES.ADMIN_PRODUCTS}/${encodeURIComponent(id)}/edit`;
export const adminCategoryEditPath = (id) => `${APP_ROUTES.ADMIN_CATEGORIES}/${encodeURIComponent(id)}/edit`;

/** Link to one product's details page. */
export const productDetailsPath = (slug) => `${APP_ROUTES.PRODUCTS}/${encodeURIComponent(slug)}`;

/** One of the user's orders, in My Account. Placing an order lands here too. */
export const orderDetailsPath = (id) => `${APP_ROUTES.ACCOUNT_ORDERS}/${encodeURIComponent(id)}`;

/** Order Summary for one product only (Buy Now on a product that isn't in the cart). */
export const buyNowCheckoutPath = (slug, quantity = 1) =>
  `${APP_ROUTES.CHECKOUT}?${new URLSearchParams({ buyNow: slug, qty: String(quantity) })}`;

export default APP_ROUTES;
