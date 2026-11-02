import { Link } from 'react-router'
import { Gift, Sparkles } from 'lucide-react'

import jasmineCornerRight from '../../assets/footer/footerflower.avif'
import { productDetailsPath } from '../../constants/appRoutepoints.js'
import { useHamperFlavours } from '../../hooks/useGiftHampers.js'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'

const PHOTO_SIZE = 32

const ROW_CLASSES =
  'flex min-h-11 items-center gap-3 rounded-lg px-2.5 text-sm text-body transition duration-200 lg:min-h-10'

/** One flavour row, styled like a filter option: a small round photo and the name. Links to the product. */
function FlavourRow({ name, product }) {
  const image = product?.images?.[0]
  const body = (
    <>
      <span className='grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-surface ring-1 ring-cream-200'>
        {image ? (
          <img
            src={cloudinaryImageUrl(image.url, PHOTO_SIZE * 2, PHOTO_SIZE * 2, { crop: 'limit' })}
            alt=''
            width={PHOTO_SIZE}
            height={PHOTO_SIZE}
            loading='lazy'
            decoding='async'
            className='size-full object-contain p-0.5'
          />
        ) : (
          <Sparkles size={14} strokeWidth={1.75} aria-hidden='true' className='text-caramel-500' />
        )}
      </span>
      <span className='min-w-0 truncate'>{name}</span>
    </>
  )

  return product ? (
    <Link
      to={productDetailsPath(product.slug)}
      className={`${ROW_CLASSES} hover:bg-cream-100 hover:font-semibold hover:text-navy-800 motion-safe:hover:translate-x-0.5`}
    >
      {body}
    </Link>
  ) : (
    <div className={ROW_CLASSES}>{body}</div>
  )
}

/**
 * The Gift Store's sidebar, in the Products page filter style: a navy header with the hamper's name, then
 * "What's inside" with every flavour of that hamper. Desktop only: the Gift Store switches `hamper` as the shopper
 * hovers a hamper card. Keyed by the hamper, so the list fades in afresh on each switch.
 */
function HamperFlavoursPanel({ hamper, className = '' }) {
  const flavours = useHamperFlavours(hamper.flavours)

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-cream-200 bg-cream-50 shadow-lg shadow-navy-900/5 ${className}`}
    >
      <div className='relative overflow-hidden bg-navy-800 px-4 py-3.5'>
        <img
          src={jasmineCornerRight}
          alt=''
          aria-hidden='true'
          width='1295'
          height='1214'
          loading='lazy'
          decoding='async'
          className='pointer-events-none absolute -top-3 -right-3 w-20 opacity-40 select-none'
        />
        <p className='relative flex items-center gap-2 font-display text-lg font-semibold text-white'>
          <Gift size={18} strokeWidth={1.75} aria-hidden='true' className='shrink-0 text-caramel-500' />
          <span className='truncate'>{hamper.name}</span>
        </p>
      </div>

      <div key={hamper.id} className='p-3 transition-opacity duration-300 starting:opacity-0'>
        <p className='mb-2 flex items-center gap-2 px-1 text-xs font-extrabold tracking-[0.15em] text-caramel-700 uppercase'>
          <span aria-hidden='true' className='size-1.5 rotate-45 bg-caramel-500' />
          What’s inside · {hamper.flavours.length} flavours
        </p>
        <ul aria-label={`Flavours in ${hamper.name}`} className='space-y-0.5'>
          {flavours.map(({ name, product }) => (
            <li key={name}>
              <FlavourRow name={name} product={product} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export { HamperFlavoursPanel }
export default HamperFlavoursPanel