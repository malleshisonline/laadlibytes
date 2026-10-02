import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router'
import { MapPin, Package, ShieldCheck, UserRound } from 'lucide-react'

import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { APP_SETTINGS } from '../constants/appSettings.js'
import { useAuth } from '../hooks/useAuth.js'

const PAGE_CLASSES = 'px-3 py-5 sm:px-4 md:py-8 lg:px-6 xl:px-16 2xl:px-24'

const SECTIONS = [
  { path: APP_ROUTES.ACCOUNT, label: 'Profile', icon: UserRound, end: true },
  { path: APP_ROUTES.ACCOUNT_ORDERS, label: 'My Orders', icon: Package },
  { path: APP_ROUTES.ACCOUNT_ADDRESSES, label: 'Addresses', icon: MapPin },
  { path: APP_ROUTES.ACCOUNT_SECURITY, label: 'Security', icon: ShieldCheck },
]

// A tab in a scrolling row on mobile, a full-width sidebar item from lg.
function sectionLinkClasses({ isActive }) {
  const base =
    'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition lg:w-full lg:rounded-xl lg:text-base'
  return isActive
    ? `${base} bg-navy-800 text-white shadow-md`
    : `${base} border border-line bg-white text-navy-800 hover:bg-lightblue-100 lg:border-transparent lg:bg-transparent`
}

/** /account: section navigation plus the chosen section (Profile, My Orders, Addresses, Security). */
function AccountPage() {
  const { user } = useAuth()

  useEffect(() => {
    const previousTitle = document.title
    document.title = `My Account | ${APP_SETTINGS.SITE_NAME}`
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <div className="bg-linear-to-b from-cream-50 via-surface to-surface">
      <div className={PAGE_CLASSES}>
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl font-semibold text-navy-800 md:text-4xl">My Account</h1>
          <p className="mt-1 wrap-break-word text-muted">Hello, {user.name}</p>
        </div>

        {/* grid-cols-1 and min-w-0, not the implicit auto column: that column cannot shrink below its widest
            content, so the sideways-scrolling tab row would stretch the whole page past the phone's width. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <nav aria-label="Account sections" className="min-w-0 lg:col-span-3">
            <ul className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:border lg:border-line lg:bg-surface lg:p-2 lg:shadow-sm">
              {SECTIONS.map(({ path, label, icon: Icon, end }) => (
                <li key={path}>
                  <NavLink to={path} end={end} className={sectionLinkClasses}>
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <section className="min-w-0 lg:col-span-9">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  )
}

export default AccountPage