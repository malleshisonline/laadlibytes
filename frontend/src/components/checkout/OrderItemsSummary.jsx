import { Link } from 'react-router'
import { Trash2 } from 'lucide-react'

import { productDetailsPath } from '../../constants/appRoutepoints.js'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'
import { formatPrice } from '../../utils/productFormatters.js'
import QuantityStepper from '../ui/QuantityStepper.jsx'

const IMAGE_SIZE = 64

/**
 * The order's lines: photo, name, quantity × price and the line total. Read-only unless `onQuantityChange`
 * is given (Buy Now, which has no cart to change it in): then each line has a stepper up to `maxQuantity` and a
 * Remove button, and stepping below 1 removes the line (`onRemove`), as in the cart.
 */
function OrderItemsSummary({ items, onQuantityChange, onRemove, maxQuantity }) {
  return (
    <ul className='divide-y divide-line'>
      {items.map(({ product, quantity, lineTotal }) => (
        <li key={product.id} className='flex items-center gap-3 py-3'>
          <Link to={productDetailsPath(product.slug)} className='shrink-0 overflow-hidden rounded-lg bg-cream-100 p-1'>
            {product.image ? (
              <img
                src={cloudinaryImageUrl(product.image.url, IMAGE_SIZE * 2, IMAGE_SIZE * 2, { crop: 'limit' })}
                alt={product.image.alt || product.name}
                width={IMAGE_SIZE}
                height={IMAGE_SIZE}
                loading='lazy'
                decoding='async'
                className='size-14 object-contain sm:size-16'
              />
            ) : (
              <div aria-hidden='true' className='size-14 sm:size-16' />
            )}
          </Link>
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-bold text-navy-800 sm:text-base'>{product.name}</p>
            {onQuantityChange ? (
              <>
                <p className='mt-0.5 text-sm text-muted'>{formatPrice(product.price)} each</p>
                <div className='mt-2 flex items-center gap-3'>
                  <QuantityStepper
                    value={quantity}
                    min={0}
                    max={Math.max(maxQuantity ?? quantity, 1)}
                    onChange={(next) => {
                      if (next === 0) onRemove?.()
                      else if (next !== quantity) onQuantityChange(next)
                    }}
                    label={`Quantity of ${product.name}`}
                  />
                  {onRemove && (
                    <button
                      type='button'
                      onClick={onRemove}
                      aria-label={`Remove ${product.name}`}
                      className='inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-muted transition hover:text-error'
                    >
                      <Trash2 size={16} strokeWidth={1.75} aria-hidden='true' />
                      <span className='hidden sm:inline'>Remove</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className='mt-0.5 text-sm text-muted'>
                Qty {quantity} × {formatPrice(product.price)}
              </p>
            )}
          </div>
          <p className='shrink-0 font-extrabold text-navy-800'>{formatPrice(lineTotal)}</p>
        </li>
      ))}
    </ul>
  )
}

export { OrderItemsSummary }
export default OrderItemsSummary