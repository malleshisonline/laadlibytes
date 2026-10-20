import { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { CircleCheck, ShoppingBag } from 'lucide-react'

import PriceDetailsBox from '../components/cart/PriceDetailsBox.jsx'
import OrderItemsSummary from '../components/checkout/OrderItemsSummary.jsx'
import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { APP_SETTINGS } from '../constants/appSettings.js'
import { useCart } from '../hooks/useCart.js'
import { formatAddressLine, formatIndianMobile } from '../utils/addressValidation.js'
import { toSummaryItem } from '../utils/orderStatus.js'

const PAGE_CLASSES = 'px-3 py-5 sm:px-4 md:py-8 lg:px-6 xl:px-16 2xl:px-24'

const PRIMARY_LINK_CLASSES =
  'inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-800 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'

const CARD_CLASSES = 'rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5'

/**
 * Thank-you page after a guest (not signed in) pays. The paid order arrives in router state from checkout, so it
 * survives a reload of this tab. Opened any other way, it shows a short "order placed" note instead. Guests
 * have no My Orders page; the order number is what they quote to the shop.
 */
function OrderConfirmedPage() {
  const { state } = useLocation()
  const { reload: reloadCart } = useCart()
  const order = state?.order

  // A paid cart order has just left the guest cart on the server; show the cart as it now is.
  useEffect(() => {
    reloadCart()
  }, [reloadCart])

  useEffect(() => {
    const previousTitle = document.title
    document.title = `Order Confirmed | ${APP_SETTINGS.SITE_NAME}`
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <div className='bg-linear-to-b from-cream-50 via-surface to-surface'>
      <div className={PAGE_CLASSES}>
        <div className='mx-auto max-w-3xl'>
          <div className='text-center'>
            <CircleCheck size={48} strokeWidth={1.75} aria-hidden='true' className='mx-auto text-success' />
            <h1 className='mt-3 text-3xl font-semibold text-navy-800 md:text-4xl'>Thank you for your order!</h1>
            {order ? (
              <p className='mx-auto mt-2 max-w-prose text-body'>
                Your payment is confirmed and order <span className='font-bold text-navy-800'>{order.orderNumber}</span>{' '}
                is placed. We’ll contact you on {formatIndianMobile(order.contact.phone)} about delivery. Please keep
                the order number handy if you need to reach us.
              </p>
            ) : (
              <p className='mx-auto mt-2 max-w-prose text-body'>
                Your order has been placed. We’ll contact you on your mobile number about delivery.
              </p>
            )}
          </div>

          {order && (
            <div className='mt-8 space-y-4'>
              <section aria-labelledby='confirmed-items-heading' className={CARD_CLASSES}>
                <h2 id='confirmed-items-heading' className='mb-3 text-lg font-semibold text-navy-800'>
                  Items ({order.itemCount})
                </h2>
                <OrderItemsSummary items={order.items.map(toSummaryItem)} />
              </section>

              <div className='grid gap-4 md:grid-cols-2'>
                <section aria-labelledby='confirmed-address-heading' className={CARD_CLASSES}>
                  <h2 id='confirmed-address-heading' className='mb-3 text-lg font-semibold text-navy-800'>
                    Delivery address
                  </h2>
                  <p className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                    <span className='font-semibold text-navy-800'>{order.address.name}</span>
                    <span className='text-sm font-semibold text-body'>{formatIndianMobile(order.address.phone)}</span>
                  </p>
                  {order.contact.email && <p className='text-sm break-all text-body'>{order.contact.email}</p>}
                  <address className='mt-1 text-sm leading-relaxed not-italic wrap-break-word text-body'>
                    {formatAddressLine(order.address)}
                  </address>
                </section>

                <PriceDetailsBox cart={order} />
              </div>
            </div>
          )}

          <div className='mt-8 text-center'>
            <Link to={APP_ROUTES.PRODUCTS} className={PRIMARY_LINK_CLASSES}>
              <ShoppingBag size={16} strokeWidth={1.75} aria-hidden='true' />
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmedPage