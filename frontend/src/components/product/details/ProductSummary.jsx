import { Link } from 'react-router'
import { CalendarClock, Check, Leaf, Truck } from 'lucide-react'

import { categoryProductsPath } from '../../../content/navigationMenuItems.js'
import { formatPackSize, formatPrice } from '../../../utils/productFormatters.js'
import GoldenDivider from '../../common/GoldenDivider.jsx'

const BRAND_NAME = 'Laadli Bytes'

/** Price block: discount and price large, MRP struck through below (only when there is a discount). */
export function ProductPrice({ product, size = 'large' }) {
  const hasDiscount = product.mrp > product.price
  const priceClasses = size === 'large' ? 'text-3xl md:text-4xl' : 'text-2xl'

  return (
    <div>
      <p className='flex items-baseline gap-3'>
        {hasDiscount && <span className='text-2xl font-light text-caramel-700'>-{product.discountPercent}%</span>}
        <span className={`font-extrabold text-navy-800 ${priceClasses}`}>{formatPrice(product.price)}</span>
      </p>
      {hasDiscount && (
        <p className='mt-1 text-sm text-muted'>
          M.R.P.: <span className='line-through'>{formatPrice(product.mrp)}</span>
        </p>
      )}
      <p className='mt-0.5 text-xs text-muted'>Inclusive of all taxes</p>
    </div>
  )
}

/**
 * Middle column of the details page, laid out like Amazon's: category link, title, price, three promise tiles,
 * a short details table and the "About this item" bullets (the product's taglines).
 */
function ProductSummary({ product }) {
  const packSize = formatPackSize(product.packSize)

  const promises = [
    { icon: Truck, label: 'Free Delivery', detail: 'On every order' },
    { icon: Leaf, label: 'Natural', detail: 'Wholesome ingredients' },
    product.shelfLife && { icon: CalendarClock, label: 'Shelf Life', detail: product.shelfLife },
  ].filter(Boolean)

  const detailRows = [
    ['Brand', BRAND_NAME],
    ['Category', product.category?.name],
    ['Net quantity', packSize],
    ['Shelf life', product.shelfLife],
  ].filter(([, value]) => value)

  return (
    <div>
      {product.category?.slug && (
        <Link
          to={categoryProductsPath(product.category.slug)}
          className='text-sm font-semibold text-caramel-700 underline-offset-4 transition hover:underline'
        >
          Explore the {product.category.name} collection
        </Link>
      )}

      <h1 className='mt-1 text-2xl leading-snug font-semibold text-navy-800 md:text-3xl'>{product.name}</h1>
      {product.taglines?.[0] && <p className='mt-1 text-base text-body italic'>{product.taglines[0]}</p>}
      {packSize && (
        <p className='mt-2 inline-flex rounded-full bg-lightblue-100 px-3 py-1 text-xs font-bold text-navy-700'>
          {packSize} pack
        </p>
      )}

      <GoldenDivider width={180} className='my-4 mx-0!' />

      <ProductPrice product={product} />

      <ul className='mt-5 grid grid-cols-3 gap-2 border-y border-cream-200 py-4'>
        {promises.map(({ icon: Icon, label, detail }) => (
          <li key={label} className='flex flex-col items-center gap-1.5 text-center'>
            <span className='grid size-11 place-items-center rounded-xl bg-cream-100 text-caramel-700 ring-1 ring-cream-200'>
              <Icon size={20} strokeWidth={1.75} aria-hidden='true' />
            </span>
            <span className='text-xs font-bold text-navy-800'>{label}</span>
            <span className='text-[0.6875rem] leading-tight text-muted'>{detail}</span>
          </li>
        ))}
      </ul>

      <table className='mt-4 w-full text-sm'>
        <tbody>
          {detailRows.map(([label, value]) => (
            <tr key={label}>
              <th scope='row' className='w-32 py-1 pr-3 text-left align-top font-bold text-navy-800'>
                {label}
              </th>
              <td className='py-1 text-body'>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {product.taglines?.length > 0 && (
        <div className='mt-5 border-t border-cream-200 pt-4'>
          <h2 className='font-sans text-base font-extrabold text-navy-800'>About this item</h2>
          <ul className='mt-2 space-y-1.5'>
            {product.taglines.map((tagline) => (
              <li key={tagline} className='flex gap-2 text-sm text-body'>
                <Check size={16} strokeWidth={2.5} aria-hidden='true' className='mt-0.5 shrink-0 text-leaf-600' />
                {tagline}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export { ProductSummary }
export default ProductSummary