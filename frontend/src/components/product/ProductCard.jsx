import { Link } from 'react-router'
import {
  Heart,
  Star,
  Sparkles,
  Gift,
} from 'lucide-react'
import { APP_ROUTES, productDetailsPath } from '../../constants/appRoutepoints.js'
import { useProductCartActions } from '../../hooks/useProductCartActions.js'
import { formatPackSize, formatPrice } from '../../utils/productFormatters.js'

const CARD_FRAME_CLASSES =
  'group relative h-full bg-surface border border-cream-200'

const CARD_BODY_CLASSES =
  'flex h-full flex-col bg-surface p-0'

const BUTTON_BASE_CLASSES =
  'flex h-8 min-w-0 w-full items-center justify-center overflow-hidden rounded-lg border px-1 text-[0.6rem] font-semibold leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 sm:h-9 sm:px-2 sm:text-xs'

const BUTTON_PENDING_CLASSES =
  'disabled:cursor-wait disabled:opacity-70'


/* -------------------------------------------------------
   Small traditional labels
------------------------------------------------------- */

const PRODUCT_LABELS = [
  { text: 'Made with', icon: Heart },
  { text: 'Favourite', icon: Star },
  { text: '56Bhog', icon: Sparkles },
  { text: 'Special Treat', icon: Gift },
  { text: ' for Your Ladli', icon: Heart },
  // { text: 'Taste of Tradition', icon: Star },
]

function getProductLabels(product) {
  const value = String(product.id || product.slug || product.name || '')
  let hash = 0

  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }

  const startIndex = Math.abs(hash) % PRODUCT_LABELS.length

  return Array.from({ length: 4 }, (_, index) => {
    return PRODUCT_LABELS[(startIndex + index) % PRODUCT_LABELS.length]
  })
}

/** Add to Cart, or Go to Cart once product is already in cart. */
function AddToCartButton({ product, inCart, pending, onAddToCart }) {
  if (!product.inStock) {
    return (
      <button
        type='button'
        disabled
        className={`${BUTTON_BASE_CLASSES} col-span-2 cursor-not-allowed border-line bg-cream-50 text-muted`}
      >
        Out of Stock
      </button>
    )
  }

  if (inCart) {
    return (
      <Link
        to={APP_ROUTES.CART}
        aria-label={`${product.name} is in your cart. Go to cart`}
        className={`${BUTTON_BASE_CLASSES} border-caramel-500 bg-caramel-500 text-navy-950 hover:brightness-95 motion-safe:active:scale-[0.98]`}
      >
        Go to Cart
      </Link>
    )
  }

  return (
    <button
      type='button'
      onClick={() => onAddToCart(product)}
      disabled={pending}
      aria-label={`Add ${product.name} to cart`}
      className={`${BUTTON_BASE_CLASSES} ${BUTTON_PENDING_CLASSES} border-navy-800 bg-navy-800 text-white hover:bg-navy-700 motion-safe:active:scale-[0.98]`}
    >
      Add to Cart
    </button>
  )
}


/** Buy Now button */
function BuyNowButton({ product, pending, onBuyNow }) {
  return (
    <button
      type='button'
      onClick={() => onBuyNow(product)}
      disabled={pending}
      aria-label={`Buy ${product.name} now`}
      className={`${BUTTON_BASE_CLASSES} ${BUTTON_PENDING_CLASSES} border-navy-800 bg-transparent text-navy-800 hover:bg-lightblue-50 motion-safe:active:scale-[0.98]`}
    >
      Buy Now
    </button>
  )
}


/**
 * Storefront Product Card
 */
function ProductCard({ product }) {
  const {
    addToCart,
    buyNow,
    isInCart,
    isPending,
  } = useProductCartActions()

  const pending = isPending(product.id)

  const image = product.images?.[0]

  // Third product image for hover
  const hoverImage = product.images?.[2]

  const showMrp = product.mrp > product.price
  const packSize = formatPackSize(product.packSize)

  const productLabels = getProductLabels(product)

  return (
    <article className={CARD_FRAME_CLASSES}>

      <div className={CARD_BODY_CLASSES}>

        {/* -------------------------------------------------
            PRODUCT IMAGE
        ------------------------------------------------- */}

        <Link
          to={productDetailsPath(product.slug)}
          className='block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600'
        >

          <div className='relative aspect-square overflow-hidden bg-radial from-cream-100 via-blush-50 to-lightblue-50'>
            

            {/* Soft light */}
            <div
              aria-hidden='true'
              className='absolute inset-[20%] rounded-full bg-radial from-surface via-cream-100/70 to-transparent'
            />

            {/* Product shadow */}
            <div
              aria-hidden='true'
              className='absolute bottom-[11%] left-1/2 h-2 w-1/2 -translate-x-1/2 rounded-full bg-cocoa-900/20 blur-md transition-all duration-700 ease-out motion-safe:group-hover:w-1/3 motion-safe:group-hover:opacity-50'
            />

            {/* ---------------------------------------------
                NORMAL IMAGE
            --------------------------------------------- */}

            {image && (
              <img
                src={image.url}
                alt={image.alt || product.name}
                width='400'
                height='400'
                loading='lazy'
                decoding='async'
                className={`
  relative h-full w-full object-contain p-0.5 mix-blend-multiply
  transition-all duration-500 ease-out
  ${hoverImage
                    ? 'group-hover:opacity-0 group-hover:scale-95'
                    : 'motion-safe:group-hover:scale-105'
                  }
`}
              />
            )}

            {/* ---------------------------------------------
                THIRD IMAGE - HOVER
            --------------------------------------------- */}

            {hoverImage && (
              <img
                src={hoverImage.url}
                alt=''
                aria-hidden='true'
                width='400'
                height='400'
                loading='lazy'
                decoding='async'
                className='absolute inset-0 h-full w-full scale-95 object-contain p-0.5 opacity-0 mix-blend-multiply transition-all duration-500 ease-out group-hover:scale-100 group-hover:opacity-100' />
            )}

            {/* Category */}
            {product.category?.name && (
              <span className='absolute top-1.5 left-1.5 max-w-[70%] truncate rounded-full border border-cream-200 bg-surface/85 px-1.5 py-0.5 text-[0.55rem] font-bold tracking-wide text-caramel-700 uppercase shadow-sm backdrop-blur-sm'>
                {product.category.name}
              </span>
            )}

            {/* Discount */}
            {product.discountPercent > 0 && (
              <span className='absolute top-1.5 right-1.5 rounded-full bg-caramel-700 px-1.5 py-0.5 text-[0.55rem] font-bold text-white shadow-sm'>
                {product.discountPercent}% off
              </span>
            )}

          </div>

          {/* Product name */}
          <h3
            title={product.name}
            className='mt-2 line-clamp-1 px-0.5 font-sans text-sm leading-snug font-extrabold tracking-tight text-navy-900 transition-colors group-hover:text-navy-700 sm:text-base'
          >
            {product.name}
          </h3>

          {/* Gold underline */}
          <span
            aria-hidden='true'
            className='mx-0.5 mt-0.5 block h-0.5 w-6 rounded-full bg-caramel-500 transition-all duration-500 group-hover:w-12'
          />

        </Link>


        {/* -------------------------------------------------
            PRICE + ACTION AREA
        ------------------------------------------------- */}

        <div className='mt-auto px-1.5 pb-1.5'>

          {/* Price */}
          <p className='mt-1 flex items-center gap-x-1'>

            <span className='text-sm font-extrabold text-navy-800 sm:text-base'>
              {formatPrice(product.price)}
            </span>

            {showMrp && (
              <span className='text-[0.65rem] text-muted line-through'>
                <span className='sr-only'>MRP </span>
                {formatPrice(product.mrp)}
              </span>
            )}

            {packSize && (
              <span className='ml-auto rounded-full bg-lightblue-100 px-1.5 py-0.5 text-[0.55rem] font-semibold text-navy-700'>
                {packSize}
              </span>
            )}

          </p>


          <div className='mt-1 grid grid-cols-2 gap-0'>
            {productLabels.map(({ text, icon: Icon }, index) => (
              <span
                key={`${text}-${index}`}
                title={text}
                className='flex min-h-6 items-center justify-center gap-1 border border-caramel-500/50 bg-caramel-50 px-1 py-1 text-[0.58rem] font-semibold leading-none text-caramel-800 sm:text-[0.62rem]'
              >
                <Icon
                  size={11}
                  strokeWidth={2.2}
                  className='shrink-0 text-caramel-700'
                  aria-hidden='true'
                />

                <span className='truncate'>
                  {text}
                </span>
              </span>
            ))}
          </div>


          <div className='mt-2 grid grid-cols-2 gap-1.5'>
            <AddToCartButton
              product={product}
              inCart={isInCart(product.id)}
              pending={pending}
              onAddToCart={addToCart}
            />

            {product.inStock && <BuyNowButton product={product} pending={pending} onBuyNow={buyNow} />}
          </div>

        </div>

      </div>

    </article>
  )
}

export { ProductCard }
export default ProductCard