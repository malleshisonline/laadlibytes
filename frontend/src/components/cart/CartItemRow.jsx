import { Link } from 'react-router'
import { Trash2 } from 'lucide-react'

import { productDetailsPath } from '../../constants/appRoutepoints.js'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'
import { formatPrice } from '../../utils/productFormatters.js'
import QuantityStepper from '../ui/QuantityStepper.jsx'

const IMAGE_SIZE = 96

/** Why a line can't be bought as it is, or null. */
function issueMessage(item) {
  if (item.issue === 'OUT_OF_STOCK') return 'Out of stock. Remove it to continue.'
  if (item.issue === 'INSUFFICIENT_STOCK') return `Only ${item.product.stock} left. Lower the quantity to continue.`
  return null
}

/** One cart line: photo, name and price, quantity stepper, line total and a remove button. */
function CartItemRow({ item, onQuantityChange, onRemove, isPending = false }) {
  const { product, quantity } = item
  const detailsPath = productDetailsPath(product.slug)
  const issue = issueMessage(item)
  // With a stock issue the stepper can only go down, towards what is available.
  const maxQuantity = item.issue ? quantity : Math.max(item.maxQuantity, 1)

  return (
    <li className={`flex gap-3 py-4 sm:gap-4 ${isPending ? 'opacity-60' : ''}`}>
      <Link to={detailsPath} className='shrink-0 overflow-hidden rounded-xl bg-cream-100 p-1.5'>
        {product.image ? (
          <img
            src={cloudinaryImageUrl(product.image.url, IMAGE_SIZE * 2, IMAGE_SIZE * 2, { crop: 'limit' })}
            alt={product.image.alt || product.name}
            width={IMAGE_SIZE}
            height={IMAGE_SIZE}
            loading='lazy'
            decoding='async'
            className='size-20 object-contain sm:size-24'
          />
        ) : (
          <div aria-hidden='true' className='size-20 sm:size-24' />
        )}
      </Link>

      <div className='flex min-w-0 flex-1 flex-col gap-2'>
        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <Link to={detailsPath} className='text-sm font-bold text-navy-800 hover:text-navy-700 sm:text-base'>
              {product.name}
            </Link>
            <p className='mt-0.5 text-sm'>
              <span className='font-bold text-navy-800'>{formatPrice(product.price)}</span>
              {product.mrp > product.price && (
                <span className='ml-2 text-muted line-through'>{formatPrice(product.mrp)}</span>
              )}
            </p>
          </div>
          <p className='shrink-0 text-base font-extrabold text-navy-800'>{formatPrice(item.lineTotal)}</p>
        </div>

        {issue && <p className='text-sm font-semibold text-error'>{issue}</p>}

        <div className='flex items-center justify-between gap-3'>
          {item.issue === 'OUT_OF_STOCK' ? (
            <span />
          ) : (
            <QuantityStepper
              value={quantity}
              min={1}
              max={maxQuantity}
              onChange={(next) => next !== quantity && onQuantityChange(product.id, next)}
              label={`Quantity of ${product.name}`}
              disabled={isPending}
            />
          )}
          <button
            type='button'
            onClick={() => onRemove(product.id)}
            disabled={isPending}
            aria-label={`Remove ${product.name} from cart`}
            className='inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-muted transition hover:text-error disabled:cursor-not-allowed'
          >
            <Trash2 size={16} strokeWidth={1.75} aria-hidden='true' />
            <span className='hidden sm:inline'>Remove</span>
          </button>
        </div>
      </div>
    </li>
  )
}

export { CartItemRow }
export default CartItemRow