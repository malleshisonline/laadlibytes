import { APP_ROUTES } from '../constants/appRoutepoints.js'

// Main menu, in display order. `hasShopMenu` marks the item that only opens the categories dropdown (no page).
export const NAVIGATION_MENU_ITEMS = [
  { label: 'Home', path: APP_ROUTES.HOME },
  { label: 'About Us', path: APP_ROUTES.ABOUT },
  { label: 'Shop', hasShopMenu: true },
  { label: 'Products', path: APP_ROUTES.PRODUCTS },
  { label: 'Contact', path: '/contact' },
]

/** Product list filtered to one category (the backend's ?category=<slug>). */
export const categoryProductsPath = (slug) => `${APP_ROUTES.PRODUCTS}?category=${encodeURIComponent(slug)}`

export default NAVIGATION_MENU_ITEMS