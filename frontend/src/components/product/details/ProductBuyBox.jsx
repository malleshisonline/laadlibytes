import { Link } from 'react-router'
import { ArrowRight, Lock, Share2, ShoppingCart, Store, Truck, Zap } from 'lucide-react'

import { APP_ROUTES } from '../../../constants/appRoutepoints.js'
import { LOW_STOCK_THRESHOLD, maxQuantityFor } from '../../../utils/productStock.js'
import QuantityStepper from '../../ui/QuantityStepper.jsx'
import { ProductPrice } from './ProductSummary.jsx'

/** Stock line: green in stock, amber when running low, red when out. */
export function StockStatus({ product }) {
  if (!product.inStock) return <p className='text-base font-bold text-error'>Currently out of stock</p>
  if (product.stock < LOW_STOCK_THRESHOLD) {
    return <p className='text-base font-bold text-warning'>Only {product.stock} left in stock – order soon</p>
  }
  return <p className='text-base font-bold text-success'>In stock</p>
}

const CART_BUTTON_CLASSES =
  'inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold text-white shadow-md transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 disabled:cursor-not-allowed disabled:bg-lightblue-100 disabled:text-muted disabled:shadow-none motion-safe:active:scale-95'

/**
 * Add to Cart (Go to Cart, a link, while the product is in the cart) and Buy Now. Both are disabled while a
 * change for this product is in flight; out of stock shows a single disabled button. `className` lays the
 * pair out: stacked in the buy box, side by side in the phone bar.
 */
export function ProductCartButtons({ product, inCart, pending, onAddToCart, onBuyNow, className = '' }) {
  if (!product.inStock) {
    return (
      <div className={`flex ${className}`}>
        <button type='button' disabled className={CART_BUTTON_CLASSES}>
          <ShoppingCart size={18} strokeWidth={2} aria-hidden='true' />
          Out of Stock
        </button>
      </div>
    )
  }

  return (
    <div className={`flex gap-2 ${className}`}>
      {inCart ? (
        <Link to={APP_ROUTES.CART} className={`${CART_BUTTON_CLASSES} bg-leaf-600 hover:shadow-lg`}>
          Go to Cart
          <ArrowRight size={18} strokeWidth={2.5} aria-hidden='true' />
        </Link>
      ) : (
        <button
          type='button'
          onClick={onAddToCart}
          disabled={pending}
          className={`${CART_BUTTON_CLASSES} bg-navy-800 hover:bg-navy-700 disabled:cursor-wait`}
        >
          <ShoppingCart size={18} strokeWidth={2} aria-hidden='true' />
          Add to Cart
        </button>
      )}
      <button
        type='button'
        onClick={onBuyNow}
        disabled={pending}
        className={`${CART_BUTTON_CLASSES} bg-caramel-700 hover:shadow-lg disabled:cursor-wait`}
      >
        <Zap size={18} strokeWidth={2} aria-hidden='true' />
        Buy Now
      </button>
    </div>
  )
}

/**
 * Right-hand buy box, like Amazon's: price, free delivery, stock, quantity, Add to Cart / Buy Now, Share and
 * seller lines, in a cream card with a caramel top edge. Sticky on desktop.
 */
function ProductBuyBox({ product, quantity, onQuantityChange, inCart, pending, onAddToCart, onBuyNow, onShare }) {
  const maxQuantity = maxQuantityFor(product)

  return (
    <div className='overflow-hidden rounded-2xl border border-cream-200 border-t-4 border-t-caramel-500 bg-cream-50 p-5 shadow-lg shadow-navy-900/5'>
      <ProductPrice product={product} size='small' />

      <p className='mt-3 flex items-start gap-2 text-sm text-body'>
        <Truck size={18} strokeWidth={1.75} aria-hidden='true' className='mt-0.5 shrink-0 text-caramel-700' />
        <span>
          <span className='font-bold text-navy-800'>FREE delivery</span> on every order, no minimum.
        </span>
      </p>

      <div className='mt-3'>
        <StockStatus product={product} />
      </div>

      {product.inStock && (
        <div className='mt-4 flex items-center gap-3'>
          <span className='text-sm font-semibold text-navy-800'>Quantity</span>
          <QuantityStepper value={quantity} min={1} max={maxQuantity} onChange={onQuantityChange} />
        </div>
      )}

      <ProductCartButtons
        product={product}
        inCart={inCart}
        pending={pending}
        onAddToCart={onAddToCart}
        onBuyNow={onBuyNow}
        className='mt-4 flex-col'
      />

      <button
        type='button'
        onClick={onShare}
        className='mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-navy-800 bg-surface text-sm font-semibold text-navy-800 transition hover:bg-lightblue-100'
      >
        <Share2 size={16} strokeWidth={1.75} aria-hidden='true' />
        Share
      </button>

      <dl className='mt-4 space-y-1.5 border-t border-cream-200 pt-4 text-xs'>
        <div className='flex items-center gap-2'>
          <Store size={14} strokeWidth={1.75} aria-hidden='true' className='text-caramel-700' />
          <dt className='text-muted'>Sold by</dt>
          <dd className='font-semibold text-navy-800'>Laadli Bytes</dd>
        </div>
        <div className='flex items-center gap-2'>
          <Lock size={14} strokeWidth={1.75} aria-hidden='true' className='text-caramel-700' />
          <dt className='text-muted'>Checkout</dt>
          <dd className='font-semibold text-navy-800'>Secure sign-in at checkout</dd>
        </div>
      </dl>
    </div>
  )
}

export { ProductBuyBox }
export default ProductBuyBox