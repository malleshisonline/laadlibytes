import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { productApi } from '../../api/productApi.js'
import bhogBackground from '../../assets/backgrounds/56bhogbg.avif'
import chikkiMascot from '../../assets/illustrations/mascot-waving-with-flute.avif'
import APP_ROUTES from '../../constants/appRoutepoints.js'
import { useScrollPager } from '../../hooks/useScrollPager.js'

// The whole catalogue is 56 products; 100 is the API's page-size maximum.
const PRODUCT_LIMIT = 100

// Skeleton cards while the list loads: one full page on desktop.
const PLACEHOLDER_COUNT = 5

// Prices are whole rupees, so no paise: ₹1,240.
const priceFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

// 2 / 3 / 4 / 5 cards per view, like the other Home carousels.
const CARD_WIDTH_CLASSES =
  'w-[calc((100%-1rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-4.5rem)/4)] lg:w-[calc((100%-6rem)/5)]'

// Off-white card with no border and a deep navy shadow, as on the design's navy band.
const CARD_SURFACE_CLASSES = 'rounded-2xl bg-cream-50 p-3 shadow-lg shadow-navy-950/40 lg:p-4'

// Arrows from sm up; on phones the row is swiped, so the cards get the full width instead of an arrow inset.
const ARROW_CLASSES =
  'absolute top-[42%] z-10 hidden size-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface text-navy-800 shadow-md transition hover:bg-lightblue-100 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-surface sm:inline-flex md:size-10'

// Watercolour wash behind each product, as in the design: a main wash plus a smaller offset tint, both fading to
// transparent before their edge so no circle outline shows. Mostly pink with a blue tint, one cool blue variant;
// cycled by card position.
const GLOW_TONES = [
  { main: 'from-blush-200 via-blush-100', accent: 'from-lightblue-200' },
  { main: 'from-blush-200 via-cream-200', accent: 'from-lightblue-200' },
  { main: 'from-lightblue-200 via-lightblue-100', accent: 'from-blush-200' },
  { main: 'from-cream-200 via-blush-100', accent: 'from-blush-200' },
]

function ShowcaseCard({ product, index }) {
  const image = product.images?.[0]
  const glowTone = GLOW_TONES[index % GLOW_TONES.length]

  return (
    <Link
      to={`/products/${product.slug}`}
      className={`group block h-full transition hover:shadow-xl hover:shadow-navy-950/50 motion-safe:hover:-translate-y-0.5 ${CARD_SURFACE_CLASSES}`}
    >
      {/* No box around the product: it sits on a soft watercolour wash; the multiply blend on the image lets the
          photo's white background take on the wash's colour. */}
      <div className='relative flex aspect-square items-center justify-center overflow-hidden rounded-xl'>
        <div
          aria-hidden='true'
          className={`absolute inset-[2%] bg-radial via-40% to-transparent to-70% ${glowTone.main}`}
        />
        <div
          aria-hidden='true'
          className={`absolute right-[4%] bottom-[6%] size-3/5 bg-radial to-transparent to-65% opacity-80 ${glowTone.accent}`}
        />
        {image && (
          <img
            src={image.url}
            alt={image.alt || product.name}
            width='400'
            height='400'
            loading='lazy'
            decoding='async'
            // mix-blend-multiply: the product JPGs have a white background; this lets it take on the card's colour.
            className='relative h-full w-full object-contain p-3 mix-blend-multiply transition-transform duration-500 ease-out motion-safe:group-hover:scale-110'
          />
        )}
      </div>
      <p title={product.name} className='mt-3 line-clamp-1 px-1 text-sm font-semibold text-navy-600 lg:text-base'>
        {product.name}
      </p>
      <p className='mt-1 px-1 text-sm font-bold text-navy-600 lg:text-base'>{priceFormatter.format(product.price)}</p>
    </Link>
  )
}

function PlaceholderCard() {
  return (
    <div className={CARD_SURFACE_CLASSES}>
      <div className='flex aspect-square items-center justify-center'>
        <div className='size-[86%] animate-pulse rounded-full bg-cream-100' />
      </div>
      <div className='mx-1 mt-3 h-4 w-3/4 animate-pulse rounded bg-cream-100' />
      <div className='mx-1 mt-2 h-4 w-1/3 animate-pulse rounded bg-cream-100' />
    </div>
  )
}

/**
 * Home "56 Bhog" showcase band, as in design-reference/finaLaadliBytesUI.png, on the navy Vrindavan scene.
 * Shows the products that are not best sellers, so it doesn't repeat the Best Sellers row above.
 */
function BhogShowcaseSection() {
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'hidden'
  const { trackRef, pageCount, currentPage, scrollToPage } = useScrollPager(status)

  useEffect(() => {
    let isCancelled = false

    productApi
      .list({ limit: PRODUCT_LIMIT })
      .then((items) => {
        if (isCancelled) return
        const nonFeatured = items.filter((product) => !product.isFeatured)
        setProducts(nonFeatured)
        setStatus(nonFeatured.length ? 'ready' : 'hidden')
      })
      .catch(() => {
        if (!isCancelled) setStatus('hidden')
      })

    return () => {
      isCancelled = true
    }
  }, [])

  if (status === 'hidden') return null

  return (
    // Inset rounded card: margin from the section above and from the screen sides, corners clipped.
    <section
      aria-labelledby='bhog-showcase-heading'
      className='relative mt-5 overflow-hidden py-12 '
    >
      {/* Temples sit on the left of the scene, so it stays anchored there as the width changes. */}
      <img
        src={bhogBackground}
        alt=''
        aria-hidden='true'
        width='2172'
        height='724'
        loading='lazy'
        decoding='async'
        className='absolute inset-0 h-full w-full object-cover object-left'
      />

      <div className='relative z-10 mx-auto max-w-7xl px-3 sm:px-6 xl:max-w-none xl:px-10 2xl:px-16'>
        <header className='mx-auto max-w-xl text-center'>
          <h2 id='bhog-showcase-heading' className='text-3xl font-semibold text-white md:text-4xl'>
            56 Bhog
          </h2>
          <p className='mt-3 text-sm leading-relaxed text-white/90 md:text-base'>
            A divine collection of 56 traditional bhogs,
            <br className='hidden sm:block' /> crafted with pure ingredients and authentic flavours.
          </p>
          <Link
            to={APP_ROUTES.PRODUCTS}
            className='mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-surface px-8 text-sm font-semibold text-navy-800 shadow-md shadow-navy-950/30 transition hover:bg-lightblue-100 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
          >
            View All Products
          </Link>
        </header>

        <div className='relative mt-8 sm:px-10 md:mt-10 md:px-14'>
          <button
            type='button'
            aria-label='Previous products'
            disabled={currentPage === 0}
            onClick={() => scrollToPage(currentPage - 1)}
            className={`${ARROW_CLASSES} left-0`}
          >
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden='true' />
          </button>

          {/* Small mascot standing behind the last visible card: only its top half peeks over the card row. */}
          <img
            src={chikkiMascot}
            alt=''
            aria-hidden='true'
            width='400'
            height='400'
            loading='lazy'
            decoding='async'
            className='pointer-events-none absolute -top-10 right-6 w-16 select-none sm:right-16 sm:w-20 md:-top-12 md:right-20 lg:-top-14 lg:right-24 lg:w-28'
          />

          {/* py-2 leaves room for the card's hover lift and shadow inside the scrolling track. relative z-10 keeps
              the cards in front of the mascot. */}
          <ul
            ref={trackRef}
            className='relative z-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth py-2 md:gap-6 scrollbar-none [&::-webkit-scrollbar]:hidden'
          >
            {status === 'loading'
              ? Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
                  <li key={index} className={CARD_WIDTH_CLASSES}>
                    <PlaceholderCard />
                  </li>
                ))
              : products.map((product, index) => (
                  <li key={product.id} className={CARD_WIDTH_CLASSES}>
                    <ShowcaseCard product={product} index={index} />
                  </li>
                ))}
          </ul>

          <button
            type='button'
            aria-label='Next products'
            disabled={currentPage >= pageCount - 1}
            onClick={() => scrollToPage(currentPage + 1)}
            className={`${ARROW_CLASSES} right-0`}
          >
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden='true' />
          </button>
        </div>

        {pageCount > 1 && (
          <div className='mt-6 flex items-center justify-center gap-1'>
            {Array.from({ length: pageCount }, (_, page) => (
              <button
                key={page}
                type='button'
                aria-label={`Go to page ${page + 1}`}
                aria-current={page === currentPage ? 'true' : undefined}
                onClick={() => scrollToPage(page)}
                className='p-1'
              >
                <span
                  className={`block size-2 rounded-full transition-colors duration-300 ${page === currentPage ? 'bg-white' : 'bg-white/45 hover:bg-white/70'}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export { BhogShowcaseSection }
export default BhogShowcaseSection