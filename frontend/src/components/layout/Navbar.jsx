import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link, NavLink, useNavigate } from 'react-router'
import {
  ChevronDown,
  ChevronRight,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShoppingCart,
  User,
  UserRound,
  X,
} from 'lucide-react'

import logo from '../../assets/brand/logo.svg'
import krishnaMascot from '../../assets/illustrations/krishnaavatar.avif'

import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { APP_SETTINGS } from '../../constants/appSettings.js'
import { NAVIGATION_MENU_ITEMS } from '../../content/navigationMenuItems.js'
import { useAuth } from '../../hooks/useAuth.js'
import { useCart } from '../../hooks/useCart.js'
import { formatIndianMobile } from '../../utils/addressValidation.js'

import {
  DesktopShopMenuItem,
  MobileShopMenuItem,
} from './ShopMegaMenu.jsx'


/* =========================================================
   SHARED STYLES
========================================================= */

const ICON_BUTTON_CLASSES =
  'relative inline-flex size-10 items-center justify-center rounded-full text-navy-800 transition hover:bg-lightblue-100'

const ACCOUNT_MENU_ITEM_CLASSES =
  'group flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition focus-visible:outline-2 focus-visible:outline-navy-600'

const ACCOUNT_MENU_ICON_CLASSES =
  'inline-flex size-9 shrink-0 items-center justify-center rounded-full transition'

const ICON_PROPS = {
  size: 19,
  strokeWidth: 1.85,
  'aria-hidden': true,
}


/* =========================================================
   NAVIGATION LINK STYLES
========================================================= */

function desktopLinkClasses({ isActive }) {
  const base =
    'border-b-2 py-1 xl:text-xl text-navy-800 transition'

  return isActive
    ? `${base} border-navy-800 font-semibold`
    : `${base} border-transparent hover:text-caramel-500`
}

function mobileLinkClasses({ isActive }) {
  const base =
    'flex min-h-11 items-center rounded-lg px-3 text-navy-800 transition'

  return isActive
    ? `${base} bg-lightblue-100 font-semibold`
    : `${base} hover:bg-lightblue-100`
}


/* =========================================================
   TOP OFFER BAR
========================================================= */

const TOP_OFFERS = [
  '✨ Special Offers on Traditional Chikki',
  '♥ Made with Love & Tradition',
  '★ Premium Quality Ingredients',
  '🎁 Sweeten Every Celebration',
]


/* =========================================================
   NAVBAR
========================================================= */

function Navbar() {
  const navigate = useNavigate()

  const {
    user,
    isRestoringSession,
    logout,
  } = useAuth()

  const { itemCount } = useCart()


  /* ---------------------------------------------------------
     STATE
  --------------------------------------------------------- */

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')

  const [showMascot, setShowMascot] = useState(false)

  const [offerIndex, setOfferIndex] = useState(0)

  const accountMenuRef = useRef(null)


  /* ---------------------------------------------------------
     OFFER ROTATION
     One offer every 2 seconds
  --------------------------------------------------------- */

  useEffect(() => {
    const interval = window.setInterval(() => {
      setOfferIndex(
        (current) => (current + 1) % TOP_OFFERS.length
      )
    }, 2000)

    return () => window.clearInterval(interval)
  }, [])


  /* ---------------------------------------------------------
     LOGO ↔ KRISHNA MASCOT
     Changes every 2 seconds
  --------------------------------------------------------- */

  useEffect(() => {
    const interval = window.setInterval(() => {
      setShowMascot((current) => !current)
    }, 2000)

    return () => window.clearInterval(interval)
  }, [])


  /* ---------------------------------------------------------
     CLOSE ACCOUNT MENU
     Outside click / Escape
  --------------------------------------------------------- */

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined

    function handleClickOutside(event) {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    document.addEventListener(
      'keydown',
      handleEscape
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )

      document.removeEventListener(
        'keydown',
        handleEscape
      )
    }
  }, [isAccountMenuOpen])


  /* ---------------------------------------------------------
     LOGOUT
  --------------------------------------------------------- */

  async function handleLogout() {
    setIsAccountMenuOpen(false)
    setIsMobileMenuOpen(false)

    await logout()

    toast.success('You have been logged out')

    navigate(APP_ROUTES.HOME)
  }


  /* ---------------------------------------------------------
     SEARCH
  --------------------------------------------------------- */

  function handleSearchSubmit(event) {
    event.preventDefault()

    const term = searchTerm.trim()

    if (!term) return

    setIsSearchOpen(false)

    navigate(
      `${APP_ROUTES.PRODUCTS}?search=${encodeURIComponent(term)}`
    )
  }


  return (
    <header className="sticky top-0 z-40 border-b border-caramel-500 bg-white shadow-sm">

      {/* =====================================================
          TOP GOLDEN OFFER BAR
      ===================================================== */}

      <div className="relative flex h-10 items-center justify-center overflow-hidden border-b-2 border-white bg-amber-700 text-white">
        {/* Flowing Shine */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-1/3 z-10 w-1/4 -skew-x-20 bg-linear-to-r from-transparent via-white/50 to-transparent blur-[1px] animate-[offerShine_3s_ease-in-out_infinite]"
        />

        {/* One Offer At A Time */}

        <div
          key={offerIndex}
          className="animate-[offerChange_500ms_ease-out] px-4 text-center text-[10px] font-semibold tracking-[0.08em] sm:text-[11px]"
        >
          {TOP_OFFERS[offerIndex]}
        </div>

      </div>


      {/* =====================================================
          MAIN NAVBAR
      ===================================================== */}

      <div className="relative flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:h-24">

        <Link
          to={APP_ROUTES.HOME}
          aria-label={`${APP_SETTINGS.SITE_NAME} home`}
          className="relative flex h-11 w-28 shrink-0 items-center sm:w-32 lg:h-12 lg:w-36"
        >

          {/* Logo */}

          <img
            src={logo}
            alt={APP_SETTINGS.SITE_NAME}
            className={`
              absolute left-10 max-h-10 w-auto object-contain
              transition-all duration-500 ease-in-out
              lg:max-h-20
              ${showMascot
                ? 'scale-75 rotate-1 opacity-0'
                : 'scale-100 rotate-0 opacity-100'
              }
            `}
          />


          {/* Krishna Mascot */}

          <img
            src={krishnaMascot}
            alt=""
            aria-hidden="true"
            className={`
              absolute left-10 max-h-11 w-auto object-contain
              transition-all duration-500 ease-in-out
              lg:max-h-20
              ${showMascot
                ? 'scale-100 rotate-0 opacity-100'
                : 'scale-75 -rotate-2 opacity-0'
              }
            `}
          />

        </Link>


        {/* ===================================================
            DESKTOP NAVIGATION
        =================================================== */}

        <nav
          aria-label="Main menu"
          className="hidden lg:block"
        >
          <ul className="flex items-center gap-8">

            {NAVIGATION_MENU_ITEMS.map((item) => (
              <li key={item.label}>

                {item.hasShopMenu ? (

                  <DesktopShopMenuItem
                    item={item}
                    linkClassName={desktopLinkClasses}
                  />

                ) : item.isGiftStore ? (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `${desktopLinkClasses({ isActive })} inline-flex items-center gap-1.5`
                    }
                  >
                    {/* Small Gift Icon */}
                    <Gift
                      size={16}
                      strokeWidth={2}
                      aria-hidden='true'
                      className='shrink-0 text-caramel-500 transition-transform duration-300 group-hover:scale-110'
                    />

                    {/* Gift Store + Floating Label */}
                    <span className='relative inline-flex items-center'>
                      {item.label}

                      <span
                        className='
          pointer-events-none
          absolute
          left-20
          top-1
          z-20
          -translate-x-1/2
          translate-y-[-95%]
          whitespace-nowrap
          rounded-full
          bg-navy-950
          px-2
          py-2
          text-[8px]
          font-bold
          leading-none
          tracking-[0.02em]
          text-white
          shadow-sm
        '
                      >
                        Grab Your Hamper
                      </span>
                    </span>
                  </NavLink>
                ) : (
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={desktopLinkClasses}
                  >
                    <span className="relative inline-flex items-center">
                      {item.label}

                      {item.label
                        .toLowerCase()
                        .replace(/\s+/g, '')
                        .includes('bestseller') && (
                          <span
                            className="
          absolute
          left-15
          top-1
          z-20
          translate-y-[-75%]
          whitespace-nowrap
          rounded-full
          bg-[#d4145a]
          px-1.75
          py-1
          text-[8px]
          font-bold
          leading-none
          text-white
          shadow-sm
        "
                          >
                            Most Loved
                          </span>
                        )}
                    </span>
                  </NavLink>

                )}

              </li>
            ))}

          </ul>
        </nav>


        {/* ===================================================
            RIGHT NAVBAR
        =================================================== */}

        <div className="flex items-center gap-1">


          {/* =================================================
              SEARCH
          ================================================= */}

          <div className="sm:relative">

            <button
              type="button"
              aria-label="Search"
              onClick={() => setIsSearchOpen(true)}
              className={`${ICON_BUTTON_CLASSES} ${isSearchOpen ? 'invisible' : ''
                }`}
            >
              <Search {...ICON_PROPS} />
            </button>


            {isSearchOpen && (

              <form
                role="search"
                onSubmit={handleSearchSubmit}
                className="absolute inset-x-4 top-1/2 z-10 flex -translate-y-1/2 items-center rounded-full bg-white sm:inset-x-auto sm:right-0"
              >

                <label
                  htmlFor="navbar-search-input"
                  className="sr-only"
                >
                  Search products
                </label>


                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute left-1 inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:text-navy-800 sm:size-8"
                >
                  <Search
                    size={16}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </button>


                <input
                  id="navbar-search-input"
                  type="search"
                  autoFocus
                  maxLength={100}
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  onKeyDown={(event) =>
                    event.key === 'Escape' &&
                    setIsSearchOpen(false)
                  }
                  placeholder="Search chikki, nuts…"
                  className="h-11 w-full rounded-full border border-line bg-lightblue-50 pr-10 pl-10 text-base text-navy-800 transition outline-none placeholder:text-muted focus:border-navy-600 focus:bg-white focus:ring-2 focus:ring-lightblue-200 sm:h-10 sm:w-72 sm:pr-9 sm:pl-9 sm:text-sm lg:w-56 xl:w-64 [&::-webkit-search-cancel-button]:hidden"
                />


                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-1 inline-flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-lightblue-100 hover:text-navy-800 sm:size-8"
                >
                  <X
                    size={16}
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </button>

              </form>

            )}

          </div>



          <div
            ref={accountMenuRef}
            className="relative flex items-center"
          >

            {/* -----------------------------------------------
                PROFILE ICON
                Direct navigation — NO dropdown
            ----------------------------------------------- */}

            {isRestoringSession ? (

              <span
                aria-hidden="true"
                className={ICON_BUTTON_CLASSES}
              >
                <User {...ICON_PROPS} />
              </span>

            ) : (

              <Link
                to={
                  user
                    ? APP_ROUTES.ACCOUNT
                    : APP_ROUTES.IDENTIFY
                }
                aria-label={
                  user
                    ? 'Go to My Account'
                    : 'Sign in'
                }
                className={ICON_BUTTON_CLASSES}
              >
                <User {...ICON_PROPS} />
              </Link>

            )}


            {/* -----------------------------------------------
                ACCOUNT TEXT
                Opens dropdown
            ----------------------------------------------- */}

            {!isRestoringSession && (

              <div className="relative hidden sm:block">

                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isAccountMenuOpen}
                  onClick={() =>
                    setIsAccountMenuOpen(
                      (isOpen) => !isOpen
                    )
                  }
                  className="group flex h-10 items-center gap-1 px-1 text-left text-navy-800 transition hover:text-caramel-600"
                >

                  <span className="flex flex-col leading-none">

                    {/* Small greeting */}

                    <span
                      className={
                        user
                          ? 'text-sm font-medium text-muted'
                          : 'text-[11px] font-medium text-muted'
                      }
                    >

                      {user
                        ? `Hello, ${user.name
                          ?.trim()
                          .split(' ')[0] || 'there'
                        }`
                        : 'Hello, Sign in'}

                    </span>


                    {/* Main account label */}

                    <span className="mt-1 whitespace-nowrap text-xs font-bold text-navy-800 transition group-hover:text-caramel-600">

                      {user
                        ? 'My Account'
                        : 'Account & Orders'}

                    </span>

                  </span>


                  <ChevronDown
                    size={13}
                    strokeWidth={2}
                    aria-hidden="true"
                    className={`
                      ml-0.5 transition-transform duration-200
                      ${isAccountMenuOpen
                        ? 'rotate-180'
                        : ''
                      }
                    `}
                  />

                </button>


                {/* ===========================================
                    ACCOUNT DROPDOWN
                =========================================== */}

                {isAccountMenuOpen && (

                  <div
                    role="menu"
                    aria-label="Account options"
                    className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-xl border border-line bg-white shadow-xl shadow-navy-900/10 transition duration-150 starting:scale-95 starting:opacity-0"
                  >

                    {/* =======================================
                        LOGGED-IN DROPDOWN
                    ======================================= */}

                    {user ? (

                      <>

                        {/* User Header */}

                        <div className="flex items-center gap-3 border-b border-line bg-lightblue-50 px-4 py-3">

                          <span
                            aria-hidden="true"
                            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-800 text-base font-bold text-white"
                          >
                            {user.name
                              ?.trim()
                              .charAt(0)
                              .toUpperCase() || 'U'}
                          </span>


                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-navy-800">
                              {user.name}
                            </p>

                            <p className="truncate text-xs text-muted">
                              {user.email ??
                                formatIndianMobile(
                                  user.phone
                                )}
                            </p>

                          </div>

                        </div>


                        {/* Account Options */}

                        <div className="space-y-1 p-2">


                          {/* My Account */}

                          <Link
                            to={APP_ROUTES.ACCOUNT}
                            role="menuitem"
                            onClick={() =>
                              setIsAccountMenuOpen(false)
                            }
                            className={`${ACCOUNT_MENU_ITEM_CLASSES} hover:bg-lightblue-100`}
                          >

                            <span
                              className={`${ACCOUNT_MENU_ICON_CLASSES} bg-lightblue-100 text-navy-800 group-hover:bg-white`}
                            >
                              <UserRound
                                size={18}
                                strokeWidth={1.75}
                                aria-hidden="true"
                              />
                            </span>


                            <span className="min-w-0 flex-1">

                              <span className="block text-sm font-semibold text-navy-800">
                                My Account
                              </span>

                              <span className="block text-xs text-muted">
                                Profile, orders and addresses
                              </span>

                            </span>


                            <ChevronRight
                              size={16}
                              strokeWidth={2}
                              aria-hidden="true"
                              className="text-muted transition group-hover:translate-x-0.5 group-hover:text-navy-800"
                            />

                          </Link>


                          {/* Admin Panel */}

                          {user.role === 'admin' && (

                            <Link
                              to={APP_ROUTES.ADMIN}
                              role="menuitem"
                              onClick={() =>
                                setIsAccountMenuOpen(false)
                              }
                              className={`${ACCOUNT_MENU_ITEM_CLASSES} hover:bg-lightblue-100`}
                            >

                              <span
                                className={`${ACCOUNT_MENU_ICON_CLASSES} bg-lightblue-100 text-navy-800 group-hover:bg-white`}
                              >
                                <LayoutDashboard
                                  size={18}
                                  strokeWidth={1.75}
                                  aria-hidden="true"
                                />
                              </span>


                              <span className="min-w-0 flex-1">

                                <span className="block text-sm font-semibold text-navy-800">
                                  Admin Panel
                                </span>

                                <span className="block text-xs text-muted">
                                  Orders, products and customers
                                </span>

                              </span>


                              <ChevronRight
                                size={16}
                                strokeWidth={2}
                                aria-hidden="true"
                                className="text-muted transition group-hover:translate-x-0.5 group-hover:text-navy-800"
                              />

                            </Link>

                          )}


                          {/* Logout */}

                          <button
                            type="button"
                            role="menuitem"
                            onClick={handleLogout}
                            className={`${ACCOUNT_MENU_ITEM_CLASSES} hover:bg-red-50`}
                          >

                            <span
                              className={`${ACCOUNT_MENU_ICON_CLASSES} bg-red-50 text-error group-hover:bg-white`}
                            >
                              <LogOut
                                size={18}
                                strokeWidth={1.75}
                                aria-hidden="true"
                              />
                            </span>


                            <span className="text-sm font-semibold text-navy-800 group-hover:text-error">
                              Logout
                            </span>

                          </button>

                        </div>

                      </>

                    ) : (

                      /* =====================================
                         LOGGED-OUT DROPDOWN
                      ===================================== */

                      <>

                        {/* Welcome / Sign In */}

                        <div className="border-b border-line bg-lightblue-50 px-4 py-4">

                          <p className="text-sm font-bold text-navy-800">
                            Welcome to{' '}
                            {APP_SETTINGS.SITE_NAME}
                          </p>

                          <p className="mt-1 text-xs leading-relaxed text-muted">
                            Sign in to access your account,
                            orders and saved addresses.
                          </p>


                          <Link
                            to={APP_ROUTES.IDENTIFY}
                            onClick={() =>
                              setIsAccountMenuOpen(false)
                            }
                            className="mt-3 flex h-9 w-full items-center justify-center rounded-full bg-navy-800 px-4 text-xs font-semibold text-white transition hover:bg-navy-700"
                          >
                            Sign In
                          </Link>

                        </div>


                        {/* Guest Options */}

                        <div className="space-y-1 p-2">


                          {/* My Account */}

                          <Link
                            to={APP_ROUTES.IDENTIFY}
                            role="menuitem"
                            onClick={() =>
                              setIsAccountMenuOpen(false)
                            }
                            className={`${ACCOUNT_MENU_ITEM_CLASSES} hover:bg-lightblue-100`}
                          >

                            <span
                              className={`${ACCOUNT_MENU_ICON_CLASSES} bg-lightblue-100 text-navy-800`}
                            >
                              <UserRound
                                size={18}
                                strokeWidth={1.75}
                                aria-hidden="true"
                              />
                            </span>


                            <span className="min-w-0 flex-1">

                              <span className="block text-sm font-semibold text-navy-800">
                                My Account
                              </span>

                              <span className="block text-xs text-muted">
                                Sign in to view your profile
                              </span>

                            </span>


                            <ChevronRight
                              size={16}
                              strokeWidth={2}
                              aria-hidden="true"
                              className="text-muted"
                            />

                          </Link>


                          {/* Orders */}

                          <Link
                            to={APP_ROUTES.IDENTIFY}
                            role="menuitem"
                            onClick={() =>
                              setIsAccountMenuOpen(false)
                            }
                            className={`${ACCOUNT_MENU_ITEM_CLASSES} hover:bg-lightblue-100`}
                          >

                            <span
                              className={`${ACCOUNT_MENU_ICON_CLASSES} bg-caramel-50 text-caramel-700`}
                            >
                              <ShoppingCart
                                size={17}
                                strokeWidth={1.75}
                                aria-hidden="true"
                              />
                            </span>


                            <span className="min-w-0 flex-1">

                              <span className="block text-sm font-semibold text-navy-800">
                                Your Orders
                              </span>

                              <span className="block text-xs text-muted">
                                Sign in to track your orders
                              </span>

                            </span>


                            <ChevronRight
                              size={16}
                              strokeWidth={2}
                              aria-hidden="true"
                              className="text-muted"
                            />

                          </Link>

                        </div>

                      </>

                    )}

                  </div>

                )}

              </div>

            )}

          </div>


          {/* =================================================
              CART
          ================================================= */}

          <Link
            to={APP_ROUTES.CART}
            aria-label={
              itemCount
                ? `Cart, ${itemCount} ${itemCount === 1
                  ? 'item'
                  : 'items'
                }`
                : 'Cart'
            }
            className={ICON_BUTTON_CLASSES}
          >

            <ShoppingCart {...ICON_PROPS} />


            {itemCount > 0 && (

              <span
                aria-hidden="true"
                className="absolute top-1 right-0.5 inline-flex h-4 min-w-0 items-center justify-center rounded-full bg-caramel-500 px-1 text-xs leading-none font-bold text-white xl:top-1 xl:right-1.5"
              >
                {itemCount > 99
                  ? '99+'
                  : itemCount}
              </span>

            )}

          </Link>


          {/* =================================================
              MOBILE MENU BUTTON
          ================================================= */}

          <button
            type="button"
            aria-label={
              isMobileMenuOpen
                ? 'Close menu'
                : 'Open menu'
            }
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
            onClick={() =>
              setIsMobileMenuOpen(
                (isOpen) => !isOpen
              )
            }
            className={`${ICON_BUTTON_CLASSES} lg:hidden`}
          >

            {isMobileMenuOpen ? (
              <X {...ICON_PROPS} />
            ) : (
              <Menu {...ICON_PROPS} />
            )}

          </button>

        </div>

      </div>


      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      {isMobileMenuOpen && (

        <nav
          id="mobile-menu"
          aria-label="Mobile menu"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-caramel-500/40 lg:hidden"
        >

          <ul className="space-y-1 px-4 py-3 sm:px-6">

            {NAVIGATION_MENU_ITEMS.map((item) => (

              <li key={item.label}>

                {item.hasShopMenu ? (

                  <MobileShopMenuItem
                    item={item}
                    linkClassName={mobileLinkClasses}
                    onNavigate={() =>
                      setIsMobileMenuOpen(false)
                    }
                  />

                ) : item.isGiftStore ? (

                  <NavLink
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) => `${mobileLinkClasses({ isActive })} gap-2`}
                  >
                    <Gift size={17} strokeWidth={2} aria-hidden='true' className='text-caramel-500' />
                    {item.label}
                  </NavLink>

                ) : (

                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() =>
                      setIsMobileMenuOpen(false)
                    }
                    className={mobileLinkClasses}
                  >
                    {item.label}
                  </NavLink>

                )}

              </li>

            ))}


            {/* ===============================================
                LOGGED-IN MOBILE ACCOUNT LINKS
            =============================================== */}

            {user && (

              <>
                <li
                  role="separator"
                  className="my-2 border-t border-caramel-500/40"
                />

                <li>

                  <NavLink
                    to={APP_ROUTES.ACCOUNT}
                    onClick={() =>
                      setIsMobileMenuOpen(false)
                    }
                    className={mobileLinkClasses}
                  >
                    My Account
                  </NavLink>

                </li>


                {user.role === 'admin' && (

                  <li>

                    <NavLink
                      to={APP_ROUTES.ADMIN}
                      onClick={() =>
                        setIsMobileMenuOpen(false)
                      }
                      className={mobileLinkClasses}
                    >
                      Admin panel
                    </NavLink>

                  </li>

                )}


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


            {/* ===============================================
                LOGGED-OUT MOBILE SIGN IN
            =============================================== */}

            {!user && !isRestoringSession && (

              <>

                <li
                  role="separator"
                  className="my-2 border-t border-caramel-500/40"
                />

                <li>

                  <NavLink
                    to={APP_ROUTES.IDENTIFY}
                    onClick={() =>
                      setIsMobileMenuOpen(false)
                    }
                    className={mobileLinkClasses}
                  >
                    Sign In / My Account
                  </NavLink>

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