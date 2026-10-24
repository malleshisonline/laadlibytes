import { Link } from 'react-router'
import { Home, ShoppingBag } from 'lucide-react'

import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

const PRIMARY_LINK_CLASSES =
  'inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-800 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'

const SECONDARY_LINK_CLASSES =
  'inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-6 text-sm font-semibold text-navy-800 transition hover:bg-lightblue-50'

/** Any address that matches no page, shown inside the storefront layout so the menu and footer stay. */
function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <main className='mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 md:py-24'>
      <p className='text-sm font-bold tracking-wider text-caramel-700'>404</p>
      <h1 className='mt-2 font-display text-3xl font-semibold text-navy-800 md:text-4xl'>Page not found</h1>
      <p className='mx-auto mt-4 max-w-prose text-body'>
        The page you are looking for doesn’t exist or may have moved.
      </p>
      <div className='mt-8 flex flex-wrap justify-center gap-3'>
        <Link to={APP_ROUTES.HOME} className={PRIMARY_LINK_CLASSES}>
          <Home size={16} strokeWidth={1.75} aria-hidden='true' />
          Go to Home
        </Link>
        <Link to={APP_ROUTES.PRODUCTS} className={SECONDARY_LINK_CLASSES}>
          <ShoppingBag size={16} strokeWidth={1.75} aria-hidden='true' />
          Shop all products
        </Link>
      </div>
    </main>
  )
}

export default NotFoundPage