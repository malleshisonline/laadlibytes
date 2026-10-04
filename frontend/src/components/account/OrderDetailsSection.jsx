import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import {
  ArrowLeft,
  BadgeCheck,
  CircleAlert,
  ClipboardCheck,
  PackageCheck,
  PackageOpen,
  PartyPopper,
  PhoneCall,
  RotateCw,
  Truck,
} from 'lucide-react'

import { orderApi } from '../../api/orderApi.js'
import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { formatAddressLine, formatIndianMobile } from '../../utils/addressValidation.js'
import {
  formatOrderDate,
  formatOrderDateTime,
  ORDER_STEPS,
  orderStatusBadgeClasses,
  orderStatusLabel,
  paymentStatusBadgeClasses,
  paymentStatusLabel,
  toSummaryItem,
} from '../../utils/orderStatus.js'
import PriceDetailsBox from '../cart/PriceDetailsBox.jsx'
import OrderItemsSummary from '../checkout/OrderItemsSummary.jsx'

import AccountCard from './AccountCard.jsx'

const STEP_ICONS = {
  placed: ClipboardCheck,
  confirmed: BadgeCheck,
  packed: PackageOpen,
  shipped: Truck,
  delivered: PackageCheck,
}

const BACK_LINK_CLASSES = 'inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-navy-700 hover:underline'

/** One order by id. Returns { order, status: 'loading' | 'ready' | 'not-found' | 'error', retry }. */
function useMyOrder(id) {
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${id}#${attempt}`
  const [result, setResult] = useState({ key: null, order: null, status: 'loading' })

  useEffect(() => {
    let isCancelled = false
    orderApi
      .get(id)
      .then((order) => {
        if (!isCancelled) setResult({ key: requestKey, order, status: 'ready' })
      })
      .catch((error) => {
        // A malformed id is a 400; for the shopper it is the same "no such order".
        const isMissing = error.status === 404 || error.status === 400
        if (!isCancelled) setResult({ key: requestKey, order: null, status: isMissing ? 'not-found' : 'error' })
      })
    return () => {
      isCancelled = true
    }
  }, [id, requestKey])

  const retry = useCallback(() => setAttempt((count) => count + 1), [])

  const isCurrent = result.key === requestKey
  return { order: isCurrent ? result.order : null, status: isCurrent ? result.status : 'loading', retry }
}

/**
 * True once, right after checkout opened this page. The flag is then cleared from the history entry, so a
 * reload or a later visit shows the plain order.
 */
function useJustPlaced() {
  const location = useLocation()
  const navigate = useNavigate()
  const [justPlaced] = useState(() => Boolean(location.state?.justPlaced))

  useEffect(() => {
    if (location.state?.justPlaced) navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, location.state, navigate])

  return justPlaced
}

function OrderPlacedBanner({ order }) {
  return (
    <div role='status' className='mb-5 rounded-2xl border border-cream-200 bg-cream-50 p-4 sm:p-5'>
      <p className='flex items-center gap-2 text-lg font-semibold text-navy-800'>
        <PartyPopper size={22} strokeWidth={1.75} aria-hidden='true' className='text-caramel-700' />
        Thank you! Your order is placed.
      </p>
      <p className='mt-2 text-body'>
        Order number <span className='font-bold text-navy-800'>{order.orderNumber}</span>
      </p>
      <p className='mt-2 flex items-start gap-2 text-sm text-body'>
        <PhoneCall size={18} strokeWidth={1.75} aria-hidden='true' className='mt-0.5 shrink-0 text-navy-800' />
        <span>
          Our team will call you on{' '}
          <span className='font-semibold text-navy-800'>{formatIndianMobile(order.contact.phone)}</span> to confirm the
          order and share the UPI payment details.
        </span>
      </p>
    </div>
  )
}

/** When each status was reached, from the order's history. */
function stepDates(history) {
  return history.reduce((dates, entry) => {
    if (entry.event === 'status') dates[entry.value] = entry.at
    return dates
  }, {})
}

/** Placed → Confirmed → Packed → Shipped → Delivered, done steps filled in with their date. */
function OrderTrackingSteps({ order }) {
  const currentIndex = ORDER_STEPS.indexOf(order.status)
  const dates = stepDates(order.history)

  return (
    <ol className='grid gap-3 sm:grid-cols-5 sm:gap-2'>
      {ORDER_STEPS.map((step, index) => {
        const Icon = STEP_ICONS[step]
        const isDone = index <= currentIndex
        return (
          <li key={step} className='flex items-center gap-3 sm:flex-col sm:text-center'>
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-full ${
                isDone ? 'bg-navy-800 text-white' : 'border border-line bg-surface text-muted'
              }`}
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden='true' />
            </span>
            <span className='min-w-0'>
              <span className={`block text-sm font-semibold ${isDone ? 'text-navy-800' : 'text-muted'}`}>
                {orderStatusLabel(step)}
                <span className='sr-only'>{isDone ? ' (done)' : ' (not yet)'}</span>
              </span>
              {isDone && dates[step] && <span className='block text-xs text-muted'>{formatOrderDate(dates[step])}</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function PaymentDetails({ order }) {
  if (order.paymentStatus === 'paid') {
    return (
      <p className='text-sm text-body'>
        Paid by UPI{order.paidAt ? ` on ${formatOrderDateTime(order.paidAt)}` : ''}.
      </p>
    )
  }
  return (
    <p className='text-sm text-body'>
      Our team will call you on{' '}
      <span className='font-semibold text-navy-800'>{formatIndianMobile(order.contact.phone)}</span> to share the UPI
      payment details.
    </p>
  )
}

function SubHeading({ children }) {
  return <h3 className='mb-3 text-lg font-semibold text-navy-800'>{children}</h3>
}

/** My Account → one order: how far it has got, payment, items, address and price details. */
function OrderDetailsSection() {
  const { id } = useParams()
  const { order, status, retry } = useMyOrder(id)
  const justPlaced = useJustPlaced()

  const backLink = (
    <Link to={APP_ROUTES.ACCOUNT_ORDERS} className={BACK_LINK_CLASSES}>
      <ArrowLeft size={16} strokeWidth={1.75} aria-hidden='true' />
      All orders
    </Link>
  )

  if (status === 'loading') {
    return (
      <AccountCard title='Order details' action={backLink}>
        <div aria-hidden='true' className='space-y-3'>
          <div className='h-20 animate-pulse rounded-xl bg-cream-100' />
          <div className='h-40 animate-pulse rounded-xl bg-cream-100' />
        </div>
        <span role='status' className='sr-only'>
          Loading your order…
        </span>
      </AccountCard>
    )
  }

  if (status === 'not-found' || status === 'error') {
    return (
      <AccountCard title='Order details' action={backLink}>
        <div className='py-8 text-center'>
          <p className='text-body'>
            {status === 'not-found' ? 'We couldn’t find this order.' : 'We couldn’t load this order right now.'}
          </p>
          {status === 'error' && (
            <button
              type='button'
              onClick={retry}
              className='mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-800 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'
            >
              <RotateCw size={16} strokeWidth={1.75} aria-hidden='true' />
              Try again
            </button>
          )}
        </div>
      </AccountCard>
    )
  }

  const isVoided = order.status === 'voided'

  return (
    <>
      {justPlaced && <OrderPlacedBanner order={order} />}

      <AccountCard
        title={order.orderNumber}
        description={`Placed on ${formatOrderDateTime(order.createdAt)}`}
        action={backLink}
      >
        <div className='mb-6 flex flex-wrap gap-2'>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${orderStatusBadgeClasses(order.status)}`}>
            {orderStatusLabel(order.status)}
          </span>
          {!isVoided && (
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${paymentStatusBadgeClasses(order.paymentStatus)}`}
            >
              {paymentStatusLabel(order.paymentStatus)}
            </span>
          )}
        </div>

        <div className='space-y-6'>
          {isVoided ? (
            <p className='flex items-start gap-2 rounded-xl bg-cream-100 p-3 text-sm text-body'>
              <CircleAlert size={18} strokeWidth={1.75} aria-hidden='true' className='mt-0.5 shrink-0 text-error' />
              This order was not completed because the payment was not received.
            </p>
          ) : (
            <section>
              <SubHeading>Order status</SubHeading>
              <OrderTrackingSteps order={order} />
            </section>
          )}

          {!isVoided && (
            <section>
              <SubHeading>Payment</SubHeading>
              <PaymentDetails order={order} />
            </section>
          )}

          <section>
            <SubHeading>Items ({order.itemCount})</SubHeading>
            <OrderItemsSummary items={order.items.map(toSummaryItem)} />
          </section>

          <div className='grid gap-6 md:grid-cols-2'>
            <section>
              <SubHeading>Delivery address</SubHeading>
              <p className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                <span className='font-semibold text-navy-800'>{order.address.name}</span>
                <span className='text-sm font-semibold text-body'>{formatIndianMobile(order.address.phone)}</span>
              </p>
              <address className='mt-1 text-sm leading-relaxed not-italic wrap-break-word text-body'>
                {formatAddressLine(order.address)}
              </address>
            </section>

            <PriceDetailsBox cart={order} />
          </div>
        </div>
      </AccountCard>
    </>
  )
}

export default OrderDetailsSection