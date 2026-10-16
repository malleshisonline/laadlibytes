import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { toast } from 'react-hot-toast'
import {
  ArrowLeft,
  ClipboardCheck,
  LoaderCircle,
  PackageCheck,
  PackageOpen,
  PartyPopper,
  RotateCw,
  Truck,
  X,
} from 'lucide-react'

import { orderApi } from '../../api/orderApi.js'
import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { formatAddressLine, formatIndianMobile } from '../../utils/addressValidation.js'
import { openRazorpayCheckout } from '../../utils/razorpayCheckout.js'
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
  const [isOpen, setIsOpen] = useState(true)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 z-50 grid place-items-center bg-navy-950/60 p-4'
      onClick={(event) => event.target === event.currentTarget && setIsOpen(false)}
    >
      <section
        role='dialog'
        aria-modal='true'
        aria-labelledby='order-received-title'
        aria-describedby='order-received-description'
        className='relative w-full max-w-md rounded-3xl border border-cream-200 bg-surface px-6 pb-6 pt-8 text-center shadow-2xl sm:px-8'
      >
        <button
          type='button'
          aria-label='Close confirmation'
          ref={closeButtonRef}
          onClick={() => setIsOpen(false)}
          className='absolute right-3 top-3 grid size-10 place-items-center rounded-full text-muted transition hover:bg-lightblue-50 hover:text-navy-800 focus-visible:outline-2 focus-visible:outline-navy-600'
        >
          <X size={20} aria-hidden='true' />
        </button>
        <p className='flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide text-leaf-600'>
          <PartyPopper size={18} aria-hidden='true' />
          Payment successful
        </p>
        <h2 id='order-received-title' className='mt-2 text-2xl font-semibold text-navy-800 sm:text-3xl'>
          We’ve received your order!
        </h2>
        <p id='order-received-description' className='mt-2 text-body'>
          Your order <span className='font-bold text-navy-800'>{order.orderNumber}</span> is placed and we’ll start
          preparing it.
        </p>
        <p className='mt-2 text-sm text-muted'>
          We may contact you at {formatIndianMobile(order.contact.phone)} if we need anything else.
        </p>
        <button
          type='button'
          onClick={() => setIsOpen(false)}
          className='mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-navy-800 px-6 text-sm font-bold text-white shadow-md transition hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600'
        >
          View order details
        </button>
      </section>
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

/** Placed → Packed → Shipped → Delivered, done steps filled in with their date. */
function OrderTrackingSteps({ order }) {
  const currentIndex = ORDER_STEPS.indexOf(order.status)
  const dates = stepDates(order.history)

  return (
    <ol className='grid gap-3 sm:grid-cols-4 sm:gap-2'>
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

function PaymentDetails({ order, isRetryingPayment, onRetryPayment }) {
  if (order.paymentStatus === 'paid') {
    return (
      <p className='text-sm text-body'>
        Payment verified{order.paidAt ? ` on ${formatOrderDateTime(order.paidAt)}` : ''}.
      </p>
    )
  }
  return (
    <div>
      <p className='text-sm text-body'>
        {order.paymentStatus === 'failed'
          ? 'Payment was not completed. The order remains placed.'
          : 'Payment has not been verified yet. Packing can begin only after successful payment.'}
      </p>
      {order.status === 'placed' && (
        <button
          type='button'
          disabled={isRetryingPayment}
          onClick={onRetryPayment}
          className='mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-navy-800 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700 disabled:cursor-wait disabled:opacity-70'
        >
          {isRetryingPayment && <LoaderCircle size={16} aria-hidden='true' className='animate-spin' />}
          {isRetryingPayment ? 'Opening secure checkout…' : 'Retry payment'}
        </button>
      )}
    </div>
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
  const [isRetryingPayment, setIsRetryingPayment] = useState(false)

  async function retryPayment() {
    if (isRetryingPayment) return
    setIsRetryingPayment(true)
    try {
      const checkout = await orderApi.resumePayment(order.id)
      const paidOrder = await openRazorpayCheckout(checkout.checkout, (details) =>
        orderApi.verifyPayment(order.id, details),
      )
      if (paidOrder) {
        toast.success('Payment verified. Your order is placed.')
        retry()
      } else {
        toast.error('Payment was cancelled. The order remains placed.')
      }
    } catch (error) {
      toast.error(error.message || 'Could not open payment checkout. Please try again.')
    } finally {
      setIsRetryingPayment(false)
    }
  }

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
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${paymentStatusBadgeClasses(order.paymentStatus)}`}
          >
            {paymentStatusLabel(order.paymentStatus)}
          </span>
        </div>

        <div className='space-y-6'>
          <section>
            <SubHeading>Order status</SubHeading>
            <OrderTrackingSteps order={order} />
          </section>

          <section>
            <SubHeading>Payment</SubHeading>
            <PaymentDetails order={order} isRetryingPayment={isRetryingPayment} onRetryPayment={retryPayment} />
          </section>

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
