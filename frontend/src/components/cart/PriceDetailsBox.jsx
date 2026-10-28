import { formatPrice } from '../../utils/productFormatters.js'

/**
 * Cart totals: MRP, discount, free delivery and the amount to pay. Delivery is free on every order, so there is
 * no shipping line to calculate. `coupon` ({ code, discount }, from the backend) adds a coupon line and takes the
 * discount off the total; without it the box is the plain cart total. `children` goes under the total (the
 * checkout button).
 */
function PriceDetailsBox({ cart, coupon, children }) {
  const { itemCount, subtotal, mrpTotal, savings } = cart
  const couponDiscount = coupon?.discount > 0 ? coupon.discount : 0
  const totalSavings = savings + couponDiscount

  return (
    <section
      aria-labelledby='price-details-heading'
      className='overflow-hidden rounded-2xl border border-cream-200 border-t-4 border-t-caramel-500 bg-cream-50 p-5 shadow-lg shadow-navy-900/5'
    >
      <h2 id='price-details-heading' className='text-lg font-semibold text-navy-800'>
        Price Details
      </h2>

      <dl className='mt-4 space-y-2.5 text-sm text-body'>
        <div className='flex justify-between gap-4'>
          <dt>
            Price ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </dt>
          <dd>{formatPrice(mrpTotal)}</dd>
        </div>
        {savings > 0 && (
          <div className='flex justify-between gap-4'>
            <dt>Discount</dt>
            <dd className='font-semibold text-success'>− {formatPrice(savings)}</dd>
          </div>
        )}
        {couponDiscount > 0 && (
          <div className='flex justify-between gap-4'>
            <dt>
              Coupon <span className='font-semibold text-navy-800'>{coupon.code}</span>
            </dt>
            <dd className='font-semibold text-success'>− {formatPrice(couponDiscount)}</dd>
          </div>
        )}
        <div className='flex justify-between gap-4'>
          <dt>Delivery</dt>
          <dd className='font-semibold text-success'>FREE</dd>
        </div>
        <div className='flex justify-between gap-4 border-t border-cream-200 pt-3 text-base font-extrabold text-navy-800'>
          <dt>Total Amount</dt>
          <dd>{formatPrice(subtotal - couponDiscount)}</dd>
        </div>
      </dl>

      {totalSavings > 0 && (
        <p className='mt-3 text-sm font-semibold text-success'>You save {formatPrice(totalSavings)} on this order</p>
      )}

      {children && <div className='mt-5'>{children}</div>}
    </section>
  )
}

export { PriceDetailsBox }
export default PriceDetailsBox