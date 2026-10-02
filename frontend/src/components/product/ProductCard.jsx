import { Link } from 'react-router'
import { ArrowRight, ShoppingCart, Zap } from 'lucide-react'

import { APP_ROUTES, productDetailsPath } from '../../constants/appRoutepoints.js'
import { useProductCartActions } from '../../hooks/useProductCartActions.js'
import { formatPackSize, formatPrice } from '../../utils/productFormatters.js'

// Outer shell is a 1px gradient frame: soft cream/blue at rest, gold-to-navy on hover (Tailwind v4 animates the
// gradient stops). The card lifts and casts a warm shadow. Motion only when the user allows it.
const CARD_FRAME_CLASSES =
  'group relative h-full rounded-2xl bg-linear-135 from-cream-200 via-lightblue-200 to-cream-200 p-px shadow-sm transition-all duration-500 hover:from-caramel-500 hover:via-cream-100 hover:to-navy-600 hover:shadow-xl hover:shadow-caramel-500/20 motion-safe:hover:-translate-y-1'

const CARD_BODY_CLASSES =
  'flex h-full flex-col rounded-[calc(1rem-1px)] bg-linear-to-b from-cream-50 via-surface to-surface p-2.5 lg:p-3'

const BUTTON_BASE_CLASSES =
  'group/button relative mt-2.5 flex h-9 w-full items-center justify-between overflow-hidden rounded-full pr-1 pl-3.5 text-xs font-semibold shadow-sm transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 sm:text-sm'

const BUTTON_BUBBLE_CLASSES = 'relative grid size-7 shrink-0 place-items-center rounded-full transition duration-500'

const BUTTON_PENDING_CLASSES = 'disabled:cursor-wait disabled:opacity-70'

/** Add to Cart, or Go to Cart (a link) once the product is in the cart. */
function AddToCartButton({ product, inCart, pending, onAddToCart }) {
  if (!product.inStock) {
    return (
      <button type='button' disabled className={`${BUTTON_BASE_CLASSES} cursor-not-allowed bg-lightblue-100 text-muted shadow-none`}>
        <span>Out of Stock</span>
        <span className={`${BUTTON_BUBBLE_CLASSES} bg-surface text-muted`}>
          <ShoppingCart size={14} strokeWidth={1.75} aria-hidden='true' />
        </span>
      </button>
    )
  }

  if (inCart) {
    return (
      <Link
        to={APP_ROUTES.CART}
        aria-label={`${product.name} is in your cart. Go to cart`}
        className={`${BUTTON_BASE_CLASSES} bg-leaf-600 text-white shadow-leaf-600/30 hover:shadow-md motion-safe:active:scale-95`}
      >
        <span className='relative transition-transform duration-300 motion-safe:group-hover/button:translate-x-0.5'>
          Go to Cart
        </span>
        <span
          className={`${BUTTON_BUBBLE_CLASSES} bg-surface text-leaf-600 motion-safe:group-hover/button:translate-x-0.5`}
        >
          <ArrowRight size={14} strokeWidth={2.5} aria-hidden='true' />
        </span>
      </Link>
    )
  }

  return (
    <button
      type='button'
      onClick={() => onAddToCart(product)}
      disabled={pending}
      aria-label={`Add ${product.name} to cart`}
      className={`${BUTTON_BASE_CLASSES} ${BUTTON_PENDING_CLASSES} bg-navy-800 text-white shadow-navy-900/25 hover:bg-navy-700 hover:shadow-md motion-safe:active:scale-95`}
    >
      {/* Light sweep that crosses the pill on hover. */}
      <span
        aria-hidden='true'
        className='pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/30 to-transparent opacity-0 transition-all duration-700 group-hover/button:left-full group-hover/button:opacity-100'
      />
      <span className='relative transition-transform duration-300 motion-safe:group-hover/button:translate-x-0.5'>
        Add to Cart
      </span>
      {/* Gold bubble spins a full turn and grows on hover. */}
      <span
        className={`${BUTTON_BUBBLE_CLASSES} bg-caramel-500 text-white shadow-sm motion-safe:group-hover/button:scale-110 motion-safe:group-hover/button:rotate-360`}
      >
        <ShoppingCart size={14} strokeWidth={2} aria-hidden='true' />
      </span>
    </button>
  )
}

/** Buy Now: same at all times; adds the product if needed and opens checkout. */
function BuyNowButton({ product, pending, onBuyNow }) {
  return (
    <button
      type='button'
      onClick={() => onBuyNow(product)}
      disabled={pending}
      aria-label={`Buy ${product.name} now`}
      className={`${BUTTON_BASE_CLASSES} ${BUTTON_PENDING_CLASSES} bg-caramel-700 text-white shadow-caramel-700/25 hover:shadow-md motion-safe:active:scale-95`}
    >
      <span className='relative transition-transform duration-300 motion-safe:group-hover/button:translate-x-0.5'>
        Buy Now
      </span>
      <span className={`${BUTTON_BUBBLE_CLASSES} bg-surface text-caramel-700 motion-safe:group-hover/button:scale-110`}>
        <Zap size={14} strokeWidth={2} aria-hidden='true' />
      </span>
    </button>
  )
}

/**
 * Storefront product card. The image and name link to the product page; the cart buttons sit beside the link
 * rather than inside it (a button inside a link is invalid HTML and confuses screen readers). Add to Cart turns
 * into Go to Cart while the product is in the cart; Buy Now stays. Out of stock shows only a disabled button.
 */
function ProductCard({ product }) {
  const { addToCart, buyNow, isInCart, isPending } = useProductCartActions()
  const pending = isPending(product.id)
  const image = product.images?.[0]
  const showMrp = product.mrp > product.price
  const packSize = formatPackSize(product.packSize)

  return (
    <article className={CARD_FRAME_CLASSES}>
      <div className={CARD_BODY_CLASSES}>
        <Link
          to={productDetailsPath(product.slug)}
          className='block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600'
        >
          {/* Image stage: the pack floats over a round offering plate (thali) and its shadow. */}
          <div className='relative aspect-square overflow-hidden rounded-xl bg-radial from-cream-100 via-blush-50 to-lightblue-50'>
            {/* Dashed gold rim of the plate: turns a quarter and widens on hover. */}
            <div
              aria-hidden='true'
              className='absolute inset-[12%] rounded-full border border-dashed border-caramel-500/40 transition duration-1000 ease-out group-hover:border-caramel-500/70 motion-safe:group-hover:scale-105 motion-safe:group-hover:rotate-90'
            />
            {/* Soft light pooled in the middle of the plate. */}
            <div aria-hidden='true' className='absolute inset-[20%] rounded-full bg-radial from-surface via-cream-100/70 to-transparent' />
            {/* Shadow under the pack: narrows and fades as the pack rises, so it reads as floating. */}
            <div
              aria-hidden='true'
              className='absolute bottom-[11%] left-1/2 h-2.5 w-1/2 -translate-x-1/2 rounded-full bg-cocoa-900/20 blur-md transition-all duration-700 ease-out motion-safe:group-hover:w-1/3 motion-safe:group-hover:opacity-50'
            />

            {image && (
              <img
                src={image.url}
                alt={image.alt || product.name}
                width='400'
                height='400'
                loading='lazy'
                decoding='async'
                // Zooms in and rises on hover; zooms back out when the pointer leaves. mix-blend-multiply lets the
                // white background baked into the product JPGs take on the stage colour instead of showing a box.
                className='relative h-full w-full object-contain p-3 mix-blend-multiply transition-transform duration-700 ease-out motion-safe:group-hover:-translate-y-1.5 motion-safe:group-hover:scale-110'
              />
            )}

            {product.category?.name && (
              <span className='absolute top-2 left-2 max-w-[70%] truncate rounded-full border border-cream-200 bg-surface/85 px-2 py-0.5 text-[0.625rem] font-bold tracking-wide text-caramel-700 uppercase shadow-sm backdrop-blur-sm'>
                {product.category.name}
              </span>
            )}

            {product.discountPercent > 0 && (
              <span className='absolute top-2 right-2 rounded-full bg-caramel-700 px-2 py-0.5 text-[0.625rem] font-bold text-white shadow-sm'>
                {product.discountPercent}% off
              </span>
            )}
          </div>

          {/* Name stands out: larger and extra-bold, with a short gold underline that stretches on hover. */}
          <h3
            title={product.name}
            className='mt-3 line-clamp-1 px-0.5 font-sans text-base leading-snug font-extrabold tracking-tight text-navy-900 transition-colors group-hover:text-navy-700 lg:text-lg'
          >
            {product.name}
          </h3>
          <span
            aria-hidden='true'
            className='mx-0.5 mt-1 block h-0.5 w-8 rounded-full bg-caramel-500 transition-all duration-500 group-hover:w-16'
          />
        </Link>

        {/* mt-auto pins price and button to the bottom, so buttons line up across cards. */}
        <div className='mt-auto px-0.5'>
          <p className='mt-1 flex items-center gap-x-1.5'>
            <span className='text-base font-extrabold text-navy-800'>{formatPrice(product.price)}</span>
            {showMrp && (
              <span className='text-xs text-muted line-through'>
                <span className='sr-only'>MRP </span>
                {formatPrice(product.mrp)}
              </span>
            )}
            {packSize && (
              <span className='ml-auto rounded-full bg-lightblue-100 px-2 py-0.5 text-[0.625rem] font-semibold text-navy-700'>
                {packSize}
              </span>
            )}
          </p>

          <AddToCartButton product={product} inCart={isInCart(product.id)} pending={pending} onAddToCart={addToCart} />
          {product.inStock && <BuyNowButton product={product} pending={pending} onBuyNow={buyNow} />}
        </div>
      </div>
    </article>
  )
}

export { ProductCard }
export default ProductCard