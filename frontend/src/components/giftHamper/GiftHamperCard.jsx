import { Link, useNavigate } from 'react-router'
import { Gift, Sparkles } from 'lucide-react'

import { APP_ROUTES, giftHamperDetailsPath } from '../../constants/appRoutepoints.js'
import { useCart } from '../../hooks/useCart.js'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'
import { formatPrice } from '../../utils/productFormatters.js'

// Same sizes and classes as ProductCard, so a hamper sits in the shop like any product.
const CARD_IMAGE_SIZE = 500
const cardImageUrl = (url) => cloudinaryImageUrl(url, CARD_IMAGE_SIZE, CARD_IMAGE_SIZE, { crop: 'limit' })

const BUTTON_BASE_CLASSES =
  'flex h-8 min-w-0 w-full items-center justify-center overflow-hidden rounded-lg border px-1 text-[0.6rem] font-semibold leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 sm:h-9 sm:px-2 sm:text-xs'

const CHIP_CLASSES =
  'flex min-h-6 items-center justify-center gap-1 border border-caramel-500/50 bg-cream-50 px-1 py-1 text-[0.58rem] font-semibold leading-none text-caramel-700 sm:text-[0.62rem]'

/** Add to Cart, or Go to Cart once the hamper is in the cart (like ProductCard). */
function AddHamperButton({ hamper }) {
  const { addHamperToCart, isInCart, isPending } = useCart()

  if (isInCart(hamper.id)) {
    return (
      <Link
        to={APP_ROUTES.CART}
        aria-label={`${hamper.name} is in your cart. Go to cart`}
        className={`${BUTTON_BASE_CLASSES} border-caramel-500 bg-caramel-500 text-navy-950 hover:brightness-95 motion-safe:active:scale-[0.98]`}
      >
        Go to Cart
      </Link>
    )
  }

  return (
    <button
      type='button'
      onClick={() => addHamperToCart(hamper, 1)}
      disabled={isPending(hamper.id)}
      aria-label={`Add ${hamper.name} to cart`}
      className={`${BUTTON_BASE_CLASSES} border-navy-800 bg-navy-800 text-white hover:bg-navy-700 disabled:cursor-wait disabled:opacity-70 motion-safe:active:scale-[0.98]`}
    >
      Add to Cart
    </button>
  )
}

/**
 * Buy Now: puts the hamper in the cart (if it isn't already) and opens the checkout. The order API's own Buy Now
 * takes products only, so a hamper is bought through the cart, the way ProductCard's Buy Now works for a product
 * already in the cart.
 */
function BuyHamperNowButton({ hamper }) {
  const navigate = useNavigate()
  const { addHamperToCart, isInCart, isPending } = useCart()

  async function handleBuyNow() {
    if (!isInCart(hamper.id) && !(await addHamperToCart(hamper, 1))) return // the cart already showed why
    navigate(APP_ROUTES.CHECKOUT)
  }

  return (
    <button
      type='button'
      onClick={handleBuyNow}
      disabled={isPending(hamper.id)}
      aria-label={`Buy ${hamper.name} now`}
      className={`${BUTTON_BASE_CLASSES} border-navy-800 bg-transparent text-navy-800 hover:bg-lightblue-50 disabled:cursor-wait disabled:opacity-70 motion-safe:active:scale-[0.98]`}
    >
      Buy Now
    </button>
  )
}

/**
 * A gift hamper in the Gift Store, built like ProductCard: photo, name with the gold underline, price and weight,
 * two label chips, then Add to Cart and Buy Now. The photo and name open the hamper's page. Hovering or focusing it calls `onActivate`, so the sidebar shows its
 * flavours; `isActive` rings the card being shown. Both only matter on desktop, where the sidebar is.
 */
function GiftHamperCard({ hamper, isActive = false, onActivate, priority = false }) {
  const image = hamper.images?.[0]
  const detailsPath = giftHamperDetailsPath(hamper.slug)

  return (
    <article
      onPointerEnter={onActivate}
      onFocus={onActivate}
      className={`group relative h-full border bg-surface transition-shadow duration-300 ${
        // The ring marks the hamper shown in the flavour sidebar, which only desktops have.
        isActive ? 'border-cream-200 lg:border-caramel-500 lg:shadow-lg lg:ring-2 lg:ring-caramel-500/40' : 'border-cream-200 hover:shadow-md'
      }`}
    >
      <div className='flex h-full flex-col'>
        <Link
          to={detailsPath}
          className='block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600'
        >
          <div className='relative aspect-square overflow-hidden bg-radial from-cream-100 via-blush-50 to-lightblue-50'>
            <div
              aria-hidden='true'
              className='absolute inset-[20%] rounded-full bg-radial from-surface via-cream-100/70 to-transparent'
            />
            <div
              aria-hidden='true'
              className='absolute bottom-[11%] left-1/2 h-2 w-1/2 -translate-x-1/2 rounded-full bg-cocoa-900/20 blur-md transition-all duration-700 ease-out motion-safe:group-hover:w-1/3 motion-safe:group-hover:opacity-50'
            />

            {image ? (
              <img
                src={cardImageUrl(image.url)}
                alt={image.alt || hamper.name}
                width='400'
                height='400'
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : undefined}
                decoding='async'
                className='relative h-full w-full object-contain p-0.5 mix-blend-multiply transition-transform duration-500 ease-out motion-safe:group-hover:scale-105'
              />
            ) : (
              <div className='relative grid h-full place-items-center'>
                <Gift size={48} strokeWidth={1.25} aria-hidden='true' className='text-caramel-700' />
              </div>
            )}

            <span className='absolute top-1.5 left-1.5 max-w-[70%] truncate rounded-full border border-cream-200 bg-surface/85 px-1.5 py-0.5 text-[0.55rem] font-bold tracking-wide text-caramel-700 uppercase shadow-sm backdrop-blur-sm'>
              Gift Hamper
            </span>
          </div>

          <h3
            title={hamper.name}
            className='mt-2 line-clamp-1 px-1.5 font-sans text-sm leading-snug font-extrabold tracking-tight text-navy-900 transition-colors group-hover:text-navy-700 sm:text-base'
          >
            {hamper.name}
          </h3>
          <span
            aria-hidden='true'
            className='mx-1.5 mt-0.5 block h-0.5 w-6 rounded-full bg-caramel-500 transition-all duration-500 group-hover:w-12'
          />
        </Link>

        <div className='mt-auto px-1.5 pb-1.5'>
          <p className='mt-1 flex items-center gap-x-1'>
            <span className='text-sm font-extrabold text-navy-800 sm:text-base'>{formatPrice(hamper.price)}</span>
            <span className='text-[0.6rem] text-muted'>GST incl.</span>
            {hamper.netWeightGrams && (
              <span className='ml-auto rounded-full bg-lightblue-100 px-1.5 py-0.5 text-[0.55rem] font-semibold text-navy-700'>
                {hamper.netWeightGrams} g
              </span>
            )}
          </p>

          <div className='mt-1 grid grid-cols-2 gap-0'>
            <button
              type='button'
              onClick={onActivate}
              aria-label={`Show the ${hamper.flavours.length} flavours in ${hamper.name}`}
              // Only desktops have the flavour sidebar; on smaller screens the chip is a plain label.
              className={`${CHIP_CLASSES} pointer-events-none lg:pointer-events-auto lg:cursor-pointer lg:transition-colors lg:hover:bg-cream-100`}
            >
              <Sparkles size={11} strokeWidth={2.2} aria-hidden='true' className='shrink-0' />
              <span className='truncate'>{hamper.flavours.length} Flavours</span>
            </button>
            <span className={CHIP_CLASSES}>
              <Gift size={11} strokeWidth={2.2} aria-hidden='true' className='shrink-0' />
              <span className='truncate'>{hamper.piecesPerBox} Pieces</span>
            </span>
          </div>

          <div className='mt-2 grid grid-cols-2 gap-1.5'>
            <AddHamperButton hamper={hamper} />
            <BuyHamperNowButton hamper={hamper} />
          </div>
        </div>
      </div>
    </article>
  )
}

export { GiftHamperCard }
export default GiftHamperCard