import { Check, Lock, Share2, ShoppingCart, Store, Truck } from 'lucide-react'

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

/** Add to Cart button; shows "Added" for a moment after a click (see useAddToCartFeedback). */
export function AddToCartButton({ product, isAdded, onAddToCart, className = '' }) {
  const disabled = !product.inStock
  return (
    <button
      type='button'
      onClick={onAddToCart}
      disabled={disabled}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold shadow-md transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 disabled:cursor-not-allowed disabled:bg-lightblue-100 disabled:text-muted disabled:shadow-none motion-safe:active:scale-95 ${
        isAdded ? 'bg-leaf-600 text-white' : 'bg-navy-800 text-white hover:bg-navy-700'
      } ${className}`}
    >
      {isAdded ? (
        <Check size={18} strokeWidth={2.5} aria-hidden='true' />
      ) : (
        <ShoppingCart size={18} strokeWidth={2} aria-hidden='true' />
      )}
      {disabled ? 'Out of Stock' : isAdded ? 'Added to Cart' : 'Add to Cart'}
    </button>
  )
}

/**
 * Right-hand buy box, like Amazon's: price, free delivery, stock, quantity, Add to Cart, Share and seller
 * lines, in a cream card with a caramel top edge. Sticky on desktop.
 */
function ProductBuyBox({ product, quantity, onQuantityChange, isAdded, onAddToCart, onShare }) {
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

      <AddToCartButton product={product} isAdded={isAdded} onAddToCart={onAddToCart} className='mt-4 w-full' />

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