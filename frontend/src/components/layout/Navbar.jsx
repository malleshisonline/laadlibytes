import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link, NavLink, useNavigate } from 'react-router'
import { Menu, Search, ShoppingCart, User, X } from 'lucide-react'

import logo from '../../assets/brand/logo.svg'
import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { APP_SETTINGS } from '../../constants/appSettings.js'
import { useAuth } from '../../hooks/useAuth.js'

// Menu links in the order shown in the design.
const MENU_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Shop', path: '/shop' },
  { label: 'Categories', path: '/categories' },
  { label: '56 Bhog', path: '/56-bhog' },
  { label: 'Contact', path: '/contact' },
]

// Shared look for the round search / account / cart icon targets (44 × 44 px).
const ICON_BUTTON_CLASSES =
  'relative inline-flex size-11 items-center justify-center rounded-full text-navy-800 transition hover:bg-lightblue-100'

// Amazon-style account pill: icon plus "Hello, …" label; the label hides below sm so the bar fits at 360px.
const ACCOUNT_BUTTON_CLASSES =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm text-navy-800 transition hover:bg-lightblue-100'
const ACCOUNT_LABEL_CLASSES = 'hidden max-w-28 truncate sm:inline'

const ICON_PROPS ={ size: 20, strokeWidth: 1.75, 'aria-hidden': true }

function desktopLinkClasses({ isActive }) {
  const base = 'border-b-2 py-1 text-sm text-navy-800 transition'
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
            {MENU_ITEMS.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} end={item.path === '/'} className={desktopLinkClasses}>
                  {item.label}
                </NavLink>
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
              </button>

              {isAccountMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-semibold text-navy-800 transition hover:bg-lightblue-100"
                  >
                    Logout
                  </button>
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

          {/* No cart yet, so the badge is shown without a number. */}
          <Link to="/cart" aria-label="Cart" className={ICON_BUTTON_CLASSES}>
            <ShoppingCart {...ICON_PROPS} />
            <span aria-hidden="true" className="absolute top-2 right-2 size-2.5 rounded-full bg-caramel-500" />
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
        <nav id="mobile-menu" aria-label="Mobile menu" className="border-t border-caramel-500/40 lg:hidden">
          <ul className="space-y-1 px-4 py-3 sm:px-6">
            {MENU_ITEMS.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={mobileLinkClasses}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}

export default Navbar