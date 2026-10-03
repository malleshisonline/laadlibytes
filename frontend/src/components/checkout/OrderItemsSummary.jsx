import { Link } from 'react-router'

import { productDetailsPath } from '../../constants/appRoutepoints.js'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'
import { formatPrice } from '../../utils/productFormatters.js'

const IMAGE_SIZE = 64

/** The order's lines, read-only: photo, name, quantity × price and the line total. Changes happen in the cart. */
function OrderItemsSummary({ items }) {
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
            <p className='mt-0.5 text-sm text-muted'>
              Qty {quantity} × {formatPrice(product.price)}
            </p>
          </div>
          <p className='shrink-0 font-extrabold text-navy-800'>{formatPrice(lineTotal)}</p>
        </li>
      ))}
    </ul>
  )
}

export { OrderItemsSummary }
export default OrderItemsSummary