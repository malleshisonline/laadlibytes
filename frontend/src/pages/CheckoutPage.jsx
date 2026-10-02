import { useEffect } from 'react'
import { Link, Navigate } from 'react-router'
import { ShoppingCart } from 'lucide-react'

import wavingMascot from '../assets/illustrations/mascot-waving-with-flute.avif'
import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { APP_SETTINGS } from '../constants/appSettings.js'
import { useAuth } from '../hooks/useAuth.js'

const PAGE_CLASSES = 'px-3 py-5 sm:px-4 md:py-8 lg:px-6 xl:px-16 2xl:px-24'

/**
 * Checkout. Sign-in is required here (guests shop without an account), so a guest is sent through the
 * sign-in flow and comes back to this page. Placeholder until the order and payment modules exist.
 */
function CheckoutPage() {
  const { user, isRestoringSession } = useAuth()

  useEffect(() => {
    const previousTitle = document.title
    document.title = `Checkout | ${APP_SETTINGS.SITE_NAME}`
    return () => {
      document.title = previousTitle
    }
  }, [])

  if (isRestoringSession) {
    return (
      <div className={PAGE_CLASSES}>
        <div aria-hidden='true' className='mx-auto h-64 max-w-md animate-pulse rounded-2xl bg-cream-100' />
      </div>
    )
  }

  if (!user) return <Navigate to={APP_ROUTES.IDENTIFY} state={{ returnTo: APP_ROUTES.CHECKOUT }} replace />

  return (
    <div className='bg-linear-to-b from-cream-50 via-surface to-surface'>
      <div className={PAGE_CLASSES}>
        <h1 className='mb-6 text-center text-3xl font-semibold text-navy-800 md:mb-8 md:text-4xl'>Checkout</h1>
        <div className='mx-auto max-w-md rounded-2xl border border-line bg-surface p-6 text-center shadow-card'>
          <img src={wavingMascot} alt='' aria-hidden='true' width='400' height='400' className='mx-auto w-32' />
          <h2 className='mt-4 text-2xl font-semibold text-navy-800'>Checkout is coming soon</h2>
          <p className='mt-2 text-body'>Your items are saved in your cart. You will be able to place the order here shortly.</p>
          <Link
            to={APP_ROUTES.CART}
            className='mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-800 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600'
          >
            <ShoppingCart size={16} strokeWidth={1.75} aria-hidden='true' />
            Back to cart
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage