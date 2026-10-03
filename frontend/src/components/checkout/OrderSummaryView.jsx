import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { MapPin, Package, ShieldCheck, Wallet } from 'lucide-react'

import { formatPrice } from '../../utils/productFormatters.js'
import PriceDetailsBox from '../cart/PriceDetailsBox.jsx'

import OrderItemsSummary from './OrderItemsSummary.jsx'
import PaymentMethodOptions from './PaymentMethodOptions.jsx'

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

/**
 * The Order Summary layout shared by the whole-cart and Buy Now checkouts: delivery address, items, payment
 * method (UPI and QR only) and the price details with Place Order. `order` has the cart's shape
 * ({ items, itemCount, subtotal, mrpTotal, savings }). `address` is the delivery section's body; when
 * `addressAction` is given it sits in the section header. Placing the order waits for the order and payment
 * modules, so the button says so for now.
 */
function OrderSummaryView({ order, address, addressAction, itemsAction, canPlaceOrder = true }) {
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const hasIssues = order.items.some((item) => item.issue)

  function handlePlaceOrder() {
    toast('Online payment is coming soon.')
  }

  return (
    <div className='grid gap-6 lg:grid-cols-12 lg:gap-8'>
      <div className='space-y-4 lg:col-span-8'>
        <SummarySection step={1} title='Delivery address' Icon={MapPin} action={addressAction}>
          {address}
        </SummarySection>

        <SummarySection step={2} title={`Order items (${order.itemCount})`} Icon={Package} action={itemsAction}>
          {hasIssues && (
            <p role='alert' className='mb-2 rounded-lg bg-cream-100 px-3 py-2 text-sm font-semibold text-error'>
              Some items are out of stock or have less stock than you picked. Update them to continue.
            </p>
          )}
          <OrderItemsSummary items={order.items} />
        </SummarySection>

        <SummarySection step={3} title='Payment' Icon={Wallet}>
          <PaymentMethodOptions value={paymentMethod} onChange={setPaymentMethod} />
        </SummarySection>
      </div>

      <div className='lg:col-span-4'>
        <div className='lg:sticky lg:top-28'>
          <PriceDetailsBox cart={order}>
            <button
              type='button'
              onClick={handlePlaceOrder}
              disabled={hasIssues || !canPlaceOrder}
              className='inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy-800 px-6 text-sm font-bold text-white shadow-md transition hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 disabled:cursor-not-allowed disabled:bg-lightblue-100 disabled:text-muted disabled:shadow-none'
            >
              <ShieldCheck size={18} strokeWidth={2} aria-hidden='true' />
              Place Order · {formatPrice(order.subtotal)}
            </button>
            <p className='mt-2 text-center text-xs text-muted'>
              {canPlaceOrder ? 'Safe and secure payments through UPI.' : 'Choose a delivery address to place the order.'}
            </p>
          </PriceDetailsBox>
        </div>
      </div>
    </div>
  )
}

export { OrderSummaryView }
export default OrderSummaryView