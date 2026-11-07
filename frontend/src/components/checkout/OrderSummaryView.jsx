import { useState } from 'react'
import { Gift, LoaderCircle, MapPin, Package, ShieldCheck, Truck } from 'lucide-react'

import { estimateDelivery, formatDeliveryDate } from '../../utils/deliveryEstimate.js'
import { formatPrice } from '../../utils/productFormatters.js'
import ApplyCouponBox from '../cart/ApplyCouponBox.jsx'
import PriceDetailsBox from '../cart/PriceDetailsBox.jsx'

import OrderItemsSummary from './OrderItemsSummary.jsx'

/** A numbered checkout section with an optional action (e.g. "Change") on the right. */
function SummarySection({ step, title, Icon, action, children }) {
  return (
    <section
      aria-labelledby={`checkout-step-${step}`}
      className='rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5'
    >
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h2 id={`checkout-step-${step}`} className='flex items-center gap-2 text-lg font-semibold text-navy-800'>
          <span className='grid size-6 place-items-center rounded-full bg-navy-800 text-xs font-bold text-white'>{step}</span>
          <Icon size={20} strokeWidth={1.75} aria-hidden='true' className='text-caramel-700' />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** "Delivery by Mon, 9 Nov" for the chosen pincode, or nothing until there is one. */
function DeliveryEstimateLine({ pincode, leadTimeDays }) {
  const estimate = estimateDelivery(pincode, leadTimeDays)
  if (!estimate) return null
  return (
    <p className='mt-3 flex items-start gap-2 rounded-lg bg-lightblue-50 px-3 py-2 text-sm text-body'>
      <Truck size={18} strokeWidth={1.75} aria-hidden='true' className='mt-0.5 shrink-0 text-navy-800' />
      <span>
        Delivery by <span className='font-bold text-navy-800'>{formatDeliveryDate(estimate.date)}</span>
        <span className='text-muted'>
          {' '}
          · {estimate.days} days{leadTimeDays > 0 ? ', gift hampers are made to order' : ''}
        </span>
      </span>
    </p>
  )
}

/**
 * The Order Summary layout shared by the whole-cart and Buy Now checkouts: delivery address, items, how payment
 * works and the price details with Pay / Place Order. `order` has the cart's shape
 * ({ items, itemCount, subtotal, mrpTotal, savings }). `address` is the delivery section's body; when
 * `addressAction` is given it sits in the section header. `onPlaceOrder` is awaited; the button stays disabled
 * meanwhile, so a double click never places two orders. `coupon` (from useCheckoutCoupon) adds the Apply Coupon
 * box; the button waits while a code is being priced, so it never shows an amount the backend has not confirmed.
 * `giftDetails` (an order with a gift hamper) adds a Gift details section; `placeOrderHint` replaces the line
 * under the button while the order cannot be placed. `deliveryPincode` (plus a hamper's `leadTimeDays`) adds the
 * estimated delivery date under the address; the date saved on the order is the backend's.
 */
function OrderSummaryView({
  order,
  address,
  addressAction,
  itemsAction,
  canPlaceOrder = true,
  onPlaceOrder,
  onQuantityChange,
  onRemoveItem,
  maxQuantity,
  coupon,
  giftDetails,
  placeOrderHint = 'Choose a delivery address to place the order.',
  deliveryPincode,
  leadTimeDays = 0,
}) {
  const [isPlacing, setIsPlacing] = useState(false)
  const hasIssues = order.items.some((item) => item.issue)
  const appliedCoupon = coupon?.preview ? { code: coupon.preview.code, discount: coupon.preview.discount } : null
  const amountToPay = order.subtotal - (appliedCoupon?.discount ?? 0)

  async function handlePlaceOrder() {
    if (isPlacing) return
    setIsPlacing(true)
    try {
      await onPlaceOrder()
    } finally {
      setIsPlacing(false)
    }
  }

  return (
    <div className='grid gap-6 lg:grid-cols-12 lg:gap-8'>
      <div className='space-y-4 lg:col-span-8'>
        <SummarySection step={1} title='Delivery address' Icon={MapPin} action={addressAction}>
          {address}
          <DeliveryEstimateLine pincode={deliveryPincode} leadTimeDays={leadTimeDays} />
        </SummarySection>

        <SummarySection step={2} title={`Order items (${order.itemCount})`} Icon={Package} action={itemsAction}>
          {hasIssues && (
            <p role='alert' className='mb-2 rounded-lg bg-cream-100 px-3 py-2 text-sm font-semibold text-error'>
              Some items are out of stock or have less stock than you picked. Update them to continue.
            </p>
          )}
          <OrderItemsSummary
            items={order.items}
            onQuantityChange={onQuantityChange}
            onRemove={onRemoveItem}
            maxQuantity={maxQuantity}
          />
        </SummarySection>

        {giftDetails && (
          <SummarySection step={3} title='Gift details' Icon={Gift}>
            {giftDetails}
          </SummarySection>
        )}
      </div>

      <div className='lg:col-span-4'>
        <div className='space-y-4 lg:sticky lg:top-28'>
          {coupon && <ApplyCouponBox coupon={coupon} />}
          <PriceDetailsBox cart={order} coupon={appliedCoupon}>
            <button
              type='button'
              onClick={handlePlaceOrder}
              disabled={hasIssues || !canPlaceOrder || isPlacing || Boolean(coupon?.isApplying)}
              aria-busy={isPlacing}
              className='inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy-800 px-6 text-sm font-bold text-white shadow-md transition hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 disabled:cursor-not-allowed disabled:bg-lightblue-100 disabled:text-muted disabled:shadow-none'
            >
              {isPlacing ? (
                <LoaderCircle size={18} strokeWidth={2} aria-hidden='true' className='animate-spin' />
              ) : (
                <ShieldCheck size={18} strokeWidth={2} aria-hidden='true' />
              )}
              {isPlacing ? 'Opening secure checkout…' : `Pay / Place Order · ${formatPrice(amountToPay)}`}
            </button>
            <p className='mt-2 text-center text-xs text-muted'>
              {canPlaceOrder ? 'Payment confirmation is verified securely by the store.' : placeOrderHint}
            </p>
          </PriceDetailsBox>
        </div>
      </div>
    </div>
  )
}

export { OrderSummaryView }
export default OrderSummaryView
