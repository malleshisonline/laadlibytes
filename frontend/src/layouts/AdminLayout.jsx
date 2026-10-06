import { Suspense, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { FolderTree, Inbox, LayoutDashboard, LoaderCircle, LogOut, Package, ShoppingBag, Store, Users } from 'lucide-react'

import logo from '../assets/brand/logo.svg'
import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { useAuth } from '../hooks/useAuth.js'

const SECTIONS = [
  { path: APP_ROUTES.ADMIN, label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { path: APP_ROUTES.ADMIN_ORDERS, label: 'Orders', Icon: ShoppingBag },
  { path: APP_ROUTES.ADMIN_PRODUCTS, label: 'Products', Icon: Package },
  { path: APP_ROUTES.ADMIN_CATEGORIES, label: 'Categories', Icon: FolderTree },
  { path: APP_ROUTES.ADMIN_USERS, label: 'Customers', Icon: Users },
  { path: APP_ROUTES.ADMIN_ENQUIRIES, label: 'Enquiries', Icon: Inbox },
]

// A pill in a scrolling row on mobile, a full-width sidebar item from lg.
function sectionLinkClasses({ isActive }) {
  const base =
    'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition lg:w-full lg:rounded-xl'
  return isActive
    ? `${base} bg-navy-800 text-white shadow-sm`
    : `${base} border border-line bg-surface text-navy-800 hover:bg-lightblue-100 lg:border-transparent lg:bg-transparent`
}

function PageLoading() {
  return (
    <div role="status" className="flex justify-center py-16 text-navy-800">
      <LoaderCircle size={26} strokeWidth={1.75} className="animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

/** The admin panel's shell: a top bar, the section navigation and the chosen page. No storefront navbar or footer. */
function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Slightly larger text in the admin panel (see html.admin-panel in global-styles.css); the store keeps 16px.
  useEffect(() => {
    document.documentElement.classList.add('admin-panel')
    return () => document.documentElement.classList.remove('admin-panel')
  }, [])

  async function handleLogout() {
    await logout()
    navigate(APP_ROUTES.HOME, { replace: true })
  }

  return (
    <div className="min-h-screen bg-lightblue-50">
      <header className="sticky top-0 z-30 border-b border-line bg-surface shadow-header">
        <div className="flex min-h-16 items-center justify-between gap-3 px-3 sm:px-4 lg:px-6">
          <Link to={APP_ROUTES.ADMIN} className="flex min-w-0 items-center gap-3">
            <img src={logo} alt="Laadli Bytes" width="120" height="40" className="h-9 w-auto" />
            <span className="rounded-full bg-navy-800 px-2.5 py-0.5 text-xs font-bold tracking-wide text-white uppercase">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="hidden max-w-40 truncate text-sm text-muted md:inline">{user.name}</span>
            <Link
              to={APP_ROUTES.HOME}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-navy-800 hover:bg-lightblue-100"
            >
              <Store size={18} strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden sm:inline">View store</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-navy-800 hover:bg-lightblue-100"
            >
              <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* grid-cols-1 + min-w-0, so the scrolling nav row and wide tables never stretch the page on a phone. */}
      <div className="grid grid-cols-1 gap-4 px-3 py-4 sm:px-4 lg:grid-cols-12 lg:gap-6 lg:px-6 lg:py-6">
        <nav aria-label="Admin sections" className="min-w-0 lg:col-span-3 xl:col-span-2">
          <ul className="-mx-3 lg:h-full lg:max-h-[80vh] flex gap-2 overflow-x-auto px-3 pb-1 lg:sticky lg:top-22 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:border lg:border-line lg:bg-surface lg:p-2 lg:shadow-sm">
            {SECTIONS.map(({ path, label, Icon, end }) => (
              <li key={path}>
                <NavLink to={path} end={end} className={sectionLinkClasses}>
                  <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 lg:col-span-9 xl:col-span-10">
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout