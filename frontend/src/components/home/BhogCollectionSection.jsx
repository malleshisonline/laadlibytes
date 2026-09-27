import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { productApi } from '../../api/productApi.js'
import bhogLabel from '../../assets/illustrations/56bhoglabel.avif'
import fluteLeft from '../../assets/backgrounds/fluteone.avif'
import fluteRight from '../../assets/illustrations/flutetwo.avif'

import BestSellersSection from './BestSellersSection.jsx'

const PLACEHOLDER_COUNT = 6


const CARD_WIDTH_CLASSES =
  'w-[calc((100%-1rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-4.5rem)/4)] lg:w-[calc((100%-6rem)/5)]'

const CARD_SURFACE_CLASSES =
  'rounded-2xl border border-lightblue-200 bg-linear-to-b from-blush-50 via-white to-lightblue-50 shadow-sm'


// Decorative flutes at the left and right corners of the 56 Bhog plaque row, level with the plaque. Each is
// rotated 20° towards horizontal (the artwork is drawn at about 30°). top-[58%] makes up for the flute sitting in
// the upper half of its image once rotated. Hidden on phones, where there is no room beside the plaque.
const FLUTE_CLASSES =
  'pointer-events-none absolute top-[58%] hidden -translate-y-1/2 select-none drop-shadow-md sm:block sm:w-36 md:w-44 lg:w-64 xl:w-80 2xl:w-96'

const ARROW_CLASSES =
  'absolute top-[38%] z-10 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-lightblue-200 bg-white text-navy-800 shadow-md transition hover:bg-lightblue-100 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-white md:size-10'

function BhogCard({ product }) {
  const image = product.images?.[0]

  return (
    <Link
      to={`/products/${product.slug}`}
      className={`group block h-full p-3 transition lg:p-4 hover:-translate-y-0.5 hover:shadow-md ${CARD_SURFACE_CLASSES}`}
    >
      <div className='flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-radial from-cream-100 via-blush-50 to-transparent to-70%'>
        {image && (
          <img
            src={image.url}
            alt={image.alt || product.name}
            width='400'
            height='400'
            loading='lazy'
            decoding='async'
            // mix-blend-multiply: the product JPGs have a white background; this lets it take on the card's colour.
            className='h-full w-full object-contain p-2 mix-blend-multiply transition duration-300 group-hover:scale-105'
          />
        )}
      </div>
      <p className='mt-3 line-clamp-2 text-center text-sm font-bold text-navy-800 lg:mt-4 lg:text-base'>{product.name}</p>
    </Link>
  )
}

function PlaceholderCard() {
  return (
    <div className={`p-3 lg:p-4 ${CARD_SURFACE_CLASSES}`}>
      <div className='aspect-square animate-pulse rounded-xl bg-cream-100' />
      <div className='mx-auto mt-3 h-4 w-3/4 animate-pulse rounded bg-cream-100 lg:mt-4 lg:h-5' />
    </div>
  )
}


function BhogCollectionSection() {
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('loading') 
  const [pageCount, setPageCount] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)
  const trackRef = useRef(null)

  useEffect(() => {
    let isCancelled = false

    productApi
      .list({ limit: 56 })
      .then((items) => {
        if (isCancelled) return
        setProducts(items)
        setStatus(items.length ? 'ready' : 'hidden')
      })
      .catch(() => {
        if (!isCancelled) setStatus('hidden')
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const syncPagesWithScroll = useCallback(() => {
    const track = trackRef.current
    // A track with no width yet (mid-layout or hidden) would divide by zero and make pageCount Infinity.
    if (!track || track.clientWidth === 0) return

    const maxScroll = track.scrollWidth - track.clientWidth
    const count = maxScroll <= 2 ? 1 : Math.ceil((maxScroll - 2) / track.clientWidth) + 1
    const page = track.scrollLeft >= maxScroll - 2 ? count - 1 : Math.round(track.scrollLeft / track.clientWidth)

    setPageCount(count)
    setCurrentPage(Math.min(page, count - 1))
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    syncPagesWithScroll()
    const resizeObserver = new ResizeObserver(syncPagesWithScroll)
    resizeObserver.observe(track)
    track.addEventListener('scroll', syncPagesWithScroll, { passive: true })

    return () => {
      resizeObserver.disconnect()
      track.removeEventListener('scroll', syncPagesWithScroll)
    }
  }, [status, syncPagesWithScroll])

  function scrollToPage(page) {
    const track = trackRef.current
    if (!track) return
    const maxScroll = track.scrollWidth - track.clientWidth
    track.scrollTo({ left: Math.min(page * track.clientWidth, maxScroll), behavior: 'smooth' })
  }

  if (status === 'hidden') return null

  return (
    <section
      aria-labelledby='bhog-collection-heading'
      className='relative overflow-hidden rounded-t-3xl bg-white py-12 md:py-16'
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-lightblue-200 via-lightblue-100/60 to-transparent md:h-56'
      />

      {/* Capped at 1280px up to lg; from xl the carousel spans the screen with side padding, so the cards grow. */}
      <div className='relative z-10 mx-auto max-w-7xl px-4 sm:px-6 xl:max-w-none xl:px-10 2xl:px-16'>
        {/* 56 Bhog plaque: its own element above the heading, sitting on the light-blue glow. */}
        {/* Full-width row, so the flutes sit at its corners while the plaque stays centred above them. */}
        <div className='relative mb-4 md:mb-6'>
          <img
            src={fluteLeft}
            alt=''
            aria-hidden='true'
            width='1774'
            height='887'
            decoding='async'
            className={`${FLUTE_CLASSES} left-0 rotate-20`}
          />
          <img
            src={bhogLabel}
            alt='Inspired by 56 Bhog, Reimagined for Today'
            width='1774'
            height='887'
            loading='eager'
            decoding='async'
            className='relative z-10 mx-auto block h-auto w-64 drop-shadow-lg select-none sm:w-80 md:w-96 lg:w-md'
          />
          <img
            src={fluteRight}
            alt=''
            aria-hidden='true'
            width='1774'
            height='887'
            decoding='async'
            className={`${FLUTE_CLASSES} right-0 -rotate-20`}
          />
        </div>

        <header className='px-10 text-center sm:px-16'>
          <h2 id='bhog-collection-heading' className='text-2xl font-semibold text-navy-800 md:text-3xl'>
            56 Bhog – A Divine Collection
          </h2>
          <p className='mt-2 text-sm text-body md:text-base'>56 traditional offerings, crafted with purity and love</p>
        </header>

        <div className='relative mt-8 px-10 md:mt-10 md:px-14'>
          <button
            type='button'
            aria-label='Previous products'
            disabled={currentPage === 0}
            onClick={() => scrollToPage(currentPage - 1)}
            className={`${ARROW_CLASSES} left-0`}
          >
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden='true' />
          </button>

          <ul
            ref={trackRef}
            className='flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 md:gap-6 scrollbar-none [&::-webkit-scrollbar]:hidden'
          >
            {status === 'loading'
              ? Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
                  <li key={index} className={CARD_WIDTH_CLASSES}>
                    <PlaceholderCard />
                  </li>
                ))
              : products.map((product) => (
                  <li key={product.id} className={CARD_WIDTH_CLASSES}>
                    <BhogCard product={product} />
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

        {/* Best sellers share this section's white background and width, as in the Home design. */}
        <BestSellersSection />
      </div>
    </section>
  )
}

export default BhogCollectionSection