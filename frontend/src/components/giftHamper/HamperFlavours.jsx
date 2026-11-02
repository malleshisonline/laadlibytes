import { Link } from 'react-router'
import { Sparkles } from 'lucide-react'

import { productDetailsPath } from '../../constants/appRoutepoints.js'
import { useHamperFlavours } from '../../hooks/useGiftHampers.js'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'

import { hamperAccentClasses } from './hamperAccent.js'

const PHOTO_SIZE = 112
// How many flavour names the compact version shows before "+N more".
const CHIP_LIMIT = 4

/** One flavour: a round photo of that chikki and its name. Links to the product when there is one. */
function FlavourCard({ name, product, accent }) {
  const image = product?.images?.[0]
  const body = (
    <>
      <span
        className={`grid size-24 place-items-center overflow-hidden rounded-full bg-cream-100 ring-4 sm:size-28 ${accent.ring}`}
      >
        {image ? (
          <img
            src={cloudinaryImageUrl(image.url, PHOTO_SIZE * 2, PHOTO_SIZE * 2, { crop: 'limit' })}
            alt=''
            width={PHOTO_SIZE}
            height={PHOTO_SIZE}
            loading='lazy'
            decoding='async'
            className='size-full object-contain p-2 transition-transform duration-300 group-hover:scale-110'
          />
        ) : (
          <Sparkles size={28} strokeWidth={1.5} aria-hidden='true' className={accent.text} />
        )}
      </span>
      <span className='mt-3 font-display text-sm leading-snug font-semibold text-navy-800'>{name}</span>
    </>
  )

  const cardClasses = 'group flex flex-col items-center rounded-2xl p-2 text-center'
  return product ? (
    <Link to={productDetailsPath(product.slug)} className={`${cardClasses} transition hover:bg-cream-50`}>
      {body}
    </Link>
  ) : (
    <div className={cardClasses}>{body}</div>
  )
}

/**
 * What's inside a hamper. `compact` (the Gift Store cards): a few flavour names as chips and "+N more".
 * Otherwise (the hamper page): a grid of flavour cards with each chikki's own photo, found by name in the catalogue.
 */
function HamperFlavours({ hamper, compact = false }) {
  const flavours = useHamperFlavours(compact ? [] : hamper.flavours)
  const accent = hamperAccentClasses(hamper.accentColor)

  if (compact) {
    const shown = hamper.flavours.slice(0, CHIP_LIMIT)
    const hiddenCount = hamper.flavours.length - shown.length
    return (
      <ul aria-label={`Flavours in ${hamper.name}`} className='flex flex-wrap gap-1.5'>
        {shown.map((name) => (
          <li key={name} className='rounded-full border border-cream-200 bg-cream-50 px-2.5 py-1 text-xs font-semibold text-body'>
            {name}
          </li>
        ))}
        {hiddenCount > 0 && (
          <li className={`rounded-full px-2.5 py-1 text-xs font-bold ${accent.text}`}>+{hiddenCount} more</li>
        )}
      </ul>
    )
  }

  return (
    <ul className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-6'>
      {flavours.map(({ name, product }) => (
        <li key={name}>
          <FlavourCard name={name} product={product} accent={accent} />
        </li>
      ))}
    </ul>
  )
}

export { HamperFlavours }
export default HamperFlavours