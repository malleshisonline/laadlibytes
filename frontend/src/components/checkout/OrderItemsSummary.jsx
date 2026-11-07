import { Link } from 'react-router'
import { Trash2 } from 'lucide-react'

import { lineDetailsPath, lineItemOf } from '../../utils/cartLine.js'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'
import { formatPrice } from '../../utils/productFormatters.js'
import QuantityStepper from '../ui/QuantityStepper.jsx'

const IMAGE_SIZE = 64

/** Why a cart line can't be bought as it is, or null (mirrors CartItemRow). */
function issueMessage(item) {
  if (item.issue === 'OUT_OF_STOCK') return 'Out of stock. Remove it to continue.'
  if (item.issue === 'INSUFFICIENT_STOCK') return `Only ${item.product?.stock} left. Lower the quantity to continue.`
  if (item.issue === 'QUANTITY_LIMIT') return `You can order at most ${item.maxQuantity} boxes online.`
  return null
}

/**
 * The order's lines: photo, name, price and the line total, read-only unless `onQuantityChange(item, quantity)`
 * and `onRemove(item)` are given. Then every line, product or gift hamper, has a − / + stepper and a Remove
 * button, and stepping below 1 removes the line, as in the cart. The stepper goes up to `maxQuantityFor(item)`
 * (default: the cart line's own `maxQuantity`); a line with a stock issue can only go down, and an out-of-stock
 * line can only be removed. `isLinePending(item)` disables a line while its change is saving.
 */
function OrderItemsSummary({ items, onQuantityChange, onRemove, maxQuantityFor, isLinePending }) {
  const isEditable = Boolean(onQuantityChange)

  return (
    <ul className='divide-y divide-line'>
      {items.map((item) => {
        const { quantity, lineTotal } = item
        // A product or a gift hamper line; both have { id, name, slug, price, image }.
        const product = lineItemOf(item)
        const isPending = Boolean(isLinePending?.(item))
        const issue = isEditable ? issueMessage(item) : null
        const maxQuantity = item.issue ? quantity : Math.max(maxQuantityFor?.(item) ?? item.maxQuantity ?? quantity, 1)

        return (
          <li
            key={`${item.kind ?? 'product'}:${product.id}`}
            className={`flex items-center gap-3 py-3 ${isPending ? 'opacity-60' : ''}`}
          >
            <Link to={lineDetailsPath(item)} className='shrink-0 overflow-hidden rounded-lg bg-cream-100 p-1'>
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
              {isEditable ? (
                <>
                  <p className='mt-0.5 text-sm text-muted'>{formatPrice(product.price)} each</p>
                  {issue && <p className='mt-1 text-sm font-semibold text-error'>{issue}</p>}
                  <div className='mt-2 flex items-center gap-3'>
                    {item.issue !== 'OUT_OF_STOCK' && (
                      <QuantityStepper
                        value={quantity}
                        min={0}
                        max={maxQuantity}
                        onChange={(next) => {
                          if (next === 0) onRemove(item)
                          else if (next !== quantity) onQuantityChange(item, next)
                        }}
                        label={`Quantity of ${product.name}`}
                        disabled={isPending}
                      />
                    )}
                    <button
                      type='button'
                      onClick={() => onRemove(item)}
                      disabled={isPending}
                      aria-label={`Remove ${product.name}`}
                      className='inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-muted transition hover:text-error disabled:cursor-not-allowed'
                    >
                      <Trash2 size={16} strokeWidth={1.75} aria-hidden='true' />
                      <span className='hidden sm:inline'>Remove</span>
                    </button>
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
        )
      })}
    </ul>
  )
}

export { OrderItemsSummary }
export default OrderItemsSummary