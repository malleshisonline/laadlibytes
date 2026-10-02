import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link, NavLink, useNavigate } from 'react-router'
import { ChevronDown, ChevronRight, LogOut, Menu, Search, ShoppingCart, User, UserRound, X } from 'lucide-react'

import logo from '../../assets/brand/logo.svg'
import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { APP_SETTINGS } from '../../constants/appSettings.js'
import { NAVIGATION_MENU_ITEMS } from '../../content/navigationMenuItems.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useCart } from '../../hooks/useCart.js'
import { formatIndianMobile } from '../../utils/addressValidation.js'

import { DesktopShopMenuItem, MobileShopMenuItem } from './ShopMegaMenu.jsx'

// Shared look for the round search / account / cart icon targets (44 × 44 px).
const ICON_BUTTON_CLASSES =
  'relative inline-flex size-11 xl:size-14 items-center justify-center rounded-full text-navy-800 transition hover:bg-lightblue-100'

// Amazon-style account pill: icon plus "Hello, …" label; the label hides below sm so the bar fits at 360px.
const ACCOUNT_BUTTON_CLASSES =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm text-navy-800 transition hover:bg-lightblue-100 lg:text-base'
const ACCOUNT_LABEL_CLASSES = 'hidden max-w-28 truncate sm:inline xl:text-xl'

const ICON_PROPS ={ size: 20, strokeWidth: 1.75, 'aria-hidden': true }

// One row of the account dropdown: round icon, label with a short hint, and room for a trailing icon.
const ACCOUNT_MENU_ITEM_CLASSES =
  'group flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition focus-visible:outline-2 focus-visible:outline-navy-600'
const ACCOUNT_MENU_ICON_CLASSES = 'inline-flex size-9 shrink-0 items-center justify-center rounded-full transition'

function desktopLinkClasses({ isActive }) {
  const base = 'border-b-2 py-1  xl:text-xl text-navy-800 transition'
  return isActive
    ? `${base} border-navy-800 font-semibold`
    : `${base} border-transparent hover:text-caramel-500`
}

function mobileLinkClasses({ isActive }) {
  const base = 'flex min-h-11 items-center rounded-lg px-3 text-navy-800 transition'
  return isActive ? `${base} bg-lightblue-100 font-semibold` : `${base} hover:bg-lightblue-100`
}

function Navbar() {
  const navigate = useNavigate()
  const { user, isRestoringSession, logout } = useAuth()
  const { itemCount } = useCart()

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const accountMenuRef = useRef(null)

  // While the account dropdown is open, close it on an outside click or on Escape.
  useEffect(() => {
    if (!isAccountMenuOpen) return undefined

    function handleClickOutside(event) {
      if (!accountMenuRef.current?.contains(event.target)) setIsAccountMenuOpen(false)
    }
    function handleEscape(event) {
      if (event.key === 'Escape') setIsAccountMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isAccountMenuOpen])

  async function handleLogout() {
    setIsAccountMenuOpen(false)
    setIsMobileMenuOpen(false)
    await logout()
    toast.success('You have been logged out')
    navigate(APP_ROUTES.HOME)
  }

  // The backend's GET /products takes `search`; the listing page reads it from the URL.
  function handleSearchSubmit(event) {
    event.preventDefault()
    const term = searchTerm.trim()
    if (!term) return
    setIsSearchOpen(false)
    navigate(`${APP_ROUTES.PRODUCTS}?search=${encodeURIComponent(term)}`)
  }

  return (
    // Fixed to the top edge, solid white, golden border on the sides and bottom, rounded bottom corners only.
    // The bar is 64px tall on mobile and 80px from lg; HeaderSection pulls the hero up by that, so the hero
    // image (not white page) shows in the rounded bottom corners.
    <header className="sticky top-0 z-40 rounded-b-2xl border-x border-b border-caramel-500 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:h-20">
        {/* Left: logo */}
        <Link to={APP_ROUTES.HOME} aria-label={`${APP_SETTINGS.SITE_NAME} home`} className="shrink-0">
          <img src={logo} alt={APP_SETTINGS.SITE_NAME} className="h-12 w-auto lg:h-18" />
        </Link>

        {/* Centre: menu (desktop only) */}
        <nav aria-label="Main menu" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {NAVIGATION_MENU_ITEMS.map((item) => (
              <li key={item.label}>
                {item.hasShopMenu ? (
                  <DesktopShopMenuItem item={item} linkClassName={desktopLinkClasses} />
                ) : (
                  <NavLink to={item.path} end={item.path === '/'} className={desktopLinkClasses}>
                    {item.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Right: search, account, cart and (mobile) menu toggle */}
        <div className="flex items-center gap-1">
          {/* Search opens as a pill that grows leftwards from the search icon into the empty space before it, so
              the menu and the account/cart icons neither move nor get covered. Enter searches; Escape or X closes. */}
          <div className="relative">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setIsSearchOpen(true)}
              className={`${ICON_BUTTON_CLASSES} ${isSearchOpen ? 'invisible' : ''}`}
            >
              <Search {...ICON_PROPS} />
            </button>

            {isSearchOpen && (
              <form
                role="search"
                onSubmit={handleSearchSubmit}
                className="absolute top-1/2 right-0 z-10 flex -translate-y-1/2 items-center rounded-full bg-white"
              >
                <label htmlFor="navbar-search-input" className="sr-only">
                  Search products
                </label>
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute left-1 inline-flex size-8 items-center justify-center rounded-full text-muted transition hover:text-navy-800"
                >
                  <Search size={16} strokeWidth={1.75} aria-hidden="true" />
                </button>
                <input
                  id="navbar-search-input"
                  type="search"
                  autoFocus
                  maxLength={100}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  onKeyDown={(event) => event.key === 'Escape' && setIsSearchOpen(false)}
                  placeholder="Search chikki, nuts…"
                  className="h-10 w-44 rounded-full border border-line bg-lightblue-50 pr-9 pl-9 text-sm text-navy-800 transition outline-none placeholder:text-muted focus:border-navy-600 focus:bg-white focus:ring-2 focus:ring-lightblue-200 sm:w-72 lg:w-56 xl:w-64 [&::-webkit-search-cancel-button]:hidden"
                />
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-1 inline-flex size-8 items-center justify-center rounded-full text-muted transition hover:bg-lightblue-100 hover:text-navy-800"
                >
                  <X size={16} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </form>
            )}
          </div>

          {user ? (
            <div ref={accountMenuRef} className="relative">
              <button
                type="button"
                aria-label={`Account menu for ${user.name}`}
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
                className={ACCOUNT_BUTTON_CLASSES}
              >
                <User {...ICON_PROPS} />
                <span className={ACCOUNT_LABEL_CLASSES}>Hello, {user.name.split(' ')[0]}</span>
                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  aria-hidden="true"
                  className={`hidden transition-transform sm:block ${isAccountMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isAccountMenuOpen && (
                // starting: gives a short fade-and-grow as the menu mounts.
                <div
                  role="menu"
                  aria-label="Account"
                  className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-line bg-white shadow-xl shadow-navy-900/10 transition duration-150 starting:scale-95 starting:opacity-0"
                >
                  {/* Who is signed in */}
                  <div className="flex items-center gap-3 border-b border-line bg-lightblue-50 px-4 py-4">
                    <span
                      aria-hidden="true"
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-navy-800 text-lg font-semibold text-white"
                    >
                      {user.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy-800">{user.name}</p>
                      <p className="truncate text-sm text-muted">{user.email ?? formatIndianMobile(user.phone)}</p>
                    </div>
                  </div>

                  <div className="space-y-1 p-2">
                    <Link
                      to={APP_ROUTES.ACCOUNT}
                      role="menuitem"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className={`${ACCOUNT_MENU_ITEM_CLASSES} hover:bg-lightblue-100`}
                    >
                      <span className={`${ACCOUNT_MENU_ICON_CLASSES} bg-lightblue-100 text-navy-800 group-hover:bg-white`}>
                        <UserRound size={18} strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-navy-800">My Account</span>
                        <span className="block text-xs text-muted">Profile, orders and addresses</span>
                      </span>
                      <ChevronRight
                        size={16}
                        strokeWidth={2}
                        aria-hidden="true"
                        className="text-muted transition group-hover:translate-x-0.5 group-hover:text-navy-800"
                      />
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className={`${ACCOUNT_MENU_ITEM_CLASSES} hover:bg-red-50`}
                    >
                      <span className={`${ACCOUNT_MENU_ICON_CLASSES} bg-red-50 text-error group-hover:bg-white`}>
                        <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <span className="text-sm font-semibold text-navy-800 group-hover:text-error">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isRestoringSession ? (
            // Session still being restored from the refresh cookie: no "sign in" flash for signed-in users.
            <span aria-hidden="true" className={ACCOUNT_BUTTON_CLASSES}>
              <User {...ICON_PROPS} />
            </span>
          ) : (
            <Link to={APP_ROUTES.IDENTIFY} aria-label="Sign in" className={ACCOUNT_BUTTON_CLASSES}>
              <User {...ICON_PROPS} />
              <span className={ACCOUNT_LABEL_CLASSES}>Hello, sign in</span>
            </Link>
          )}

          <Link
            to={APP_ROUTES.CART}
            aria-label={itemCount ? `Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : 'Cart'}
            className={ICON_BUTTON_CLASSES}
          >
            <ShoppingCart {...ICON_PROPS} />
            {itemCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-1 right-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-caramel-500 px-1 text-xs leading-none font-bold text-white xl:top-2 xl:right-1.5"
              >
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            className={`${ICON_BUTTON_CLASSES} lg:hidden`}
          >
            {isMobileMenuOpen ? <X {...ICON_PROPS} /> : <Menu {...ICON_PROPS} />}
          </button>
        </div>
      </div>

      {/* Mobile menu: opens below the bar inside the same card, closes when a link is tapped. */}
      {isMobileMenuOpen && (
        <nav id="mobile-menu" aria-label="Mobile menu" className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-caramel-500/40 lg:hidden">
          <ul className="space-y-1 px-4 py-3 sm:px-6">
            {NAVIGATION_MENU_ITEMS.map((item) => (
              <li key={item.label}>
                {item.hasShopMenu ? (
                  <MobileShopMenuItem
                    item={item}
                    linkClassName={mobileLinkClasses}
                    onNavigate={() => setIsMobileMenuOpen(false)}
                  />
                ) : (
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={mobileLinkClasses}
                  >
                    {item.label}
                  </NavLink>
                )}
              </li>
            ))}

            {user && (
              <>
                <li role="separator" className="my-2 border-t border-caramel-500/40" />
                <li>
                  <NavLink to={APP_ROUTES.ACCOUNT} onClick={() => setIsMobileMenuOpen(false)} className={mobileLinkClasses}>
                    My Account
                  </NavLink>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-navy-800 transition hover:bg-lightblue-100"
                  >
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  )
}

export default Navbar