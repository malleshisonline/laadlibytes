import { APP_ROUTES } from '../constants/appRoutepoints.js'

// Main menu, in display order. `hasShopMenu` marks the item that only opens the categories dropdown (no page).
export const NAVIGATION_MENU_ITEMS = [
  { label: 'Home', path: APP_ROUTES.HOME },
  { label: 'Best Sellers', path: APP_ROUTES.BEST_SELLERS },
  { label: 'Ladli ji Store', hasShopMenu: true },
  { label: 'Gift Store', path: APP_ROUTES.GIFT_STORE, isGiftStore: true },
  { label: 'About Us', path: APP_ROUTES.ABOUT },
]

/** Product list filtered to one category (the backend's ?category=<slug>). */
export const categoryProductsPath = (slug) => `${APP_ROUTES.PRODUCTS}?category=${encodeURIComponent(slug)}`

export default NAVIGATION_MENU_ITEMS