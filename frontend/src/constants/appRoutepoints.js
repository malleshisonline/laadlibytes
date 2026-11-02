export const APP_ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS: '/terms',
  REFUND_POLICY: '/refund-policy',
  SHIPPING_POLICY: '/shipping-policy',
  FAQ: '/faq',
  IDENTIFY: '/identify',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY_OTP: '/verify-otp',
  PRODUCTS: '/products',
  BEST_SELLERS: '/best-sellers',
  GIFT_STORE: '/gift-store',
  GIFT_HAMPER_DETAILS: '/gift-store/:slug',
  PRODUCT_DETAILS: '/products/:slug',
  CART: '/cart',
  CHECKOUT: '/checkout',
  // Thank-you page after a guest (not signed in) pays; signed-in users land on their order instead.
  ORDER_CONFIRMED: '/order-confirmed',
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
  ADMIN_COUPONS: '/admin/coupons',
  ADMIN_COUPON_NEW: '/admin/coupons/new',
  ADMIN_COUPON_EDIT: '/admin/coupons/:id/edit',
  ADMIN_GIFT_HAMPERS: '/admin/gift-hampers',
  ADMIN_GIFT_HAMPER_NEW: '/admin/gift-hampers/new',
  ADMIN_GIFT_HAMPER_EDIT: '/admin/gift-hampers/:id/edit',
};

export const adminOrderPath = (id) => `${APP_ROUTES.ADMIN_ORDERS}/${encodeURIComponent(id)}`;
export const adminProductEditPath = (id) => `${APP_ROUTES.ADMIN_PRODUCTS}/${encodeURIComponent(id)}/edit`;
export const adminCategoryEditPath = (id) => `${APP_ROUTES.ADMIN_CATEGORIES}/${encodeURIComponent(id)}/edit`;
export const adminCouponEditPath = (id) => `${APP_ROUTES.ADMIN_COUPONS}/${encodeURIComponent(id)}/edit`;
export const adminGiftHamperEditPath = (id) => `${APP_ROUTES.ADMIN_GIFT_HAMPERS}/${encodeURIComponent(id)}/edit`;

/** Link to one product's details page. */
export const productDetailsPath = (slug) => `${APP_ROUTES.PRODUCTS}/${encodeURIComponent(slug)}`;

/** Link to one gift hamper's page in the Gift Store. */
export const giftHamperDetailsPath = (slug) => `${APP_ROUTES.GIFT_STORE}/${encodeURIComponent(slug)}`;

/** One of the user's orders, in My Account. Placing an order lands here too. */
export const orderDetailsPath = (id) => `${APP_ROUTES.ACCOUNT_ORDERS}/${encodeURIComponent(id)}`;

/** Order Summary for one product only (Buy Now on a product that isn't in the cart). */
export const buyNowCheckoutPath = (slug, quantity = 1) =>
  `${APP_ROUTES.CHECKOUT}?${new URLSearchParams({ buyNow: slug, qty: String(quantity) })}`;

export default APP_ROUTES;
