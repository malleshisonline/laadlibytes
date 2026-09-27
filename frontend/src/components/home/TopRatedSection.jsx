import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Star } from 'lucide-react'

import { productApi } from '../../api/productApi.js'
import { TOP_RATED_PRODUCT_SLUGS } from '../../content/topRatedProducts.js'
import GoldenDivider from '../common/GoldenDivider.jsx'

// The whole catalogue is 56 products; 100 is the API's page-size maximum.
const PRODUCT_LIMIT = 100

// Cards on screen at once (2 × 2 on phones and tablets, one row of 4 from lg).
const SLOT_COUNT = 4

// Every SWAP_INTERVAL_MS one slot swaps to the next product; the old card takes LEAVE_MS to fade out first.
const SWAP_INTERVAL_MS = 4000
const LEAVE_MS = 400

// Prices are whole rupees, so no paise: ₹1,240.
const priceFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// One half of the front-of-pack image. `isolate` + an opaque cream fill keep the multiply blend (which hides the
// JPG's white background) from letting the back image show through the front at rest.
function FrontHalf({ image, alt, side }) {
  const clipClasses = side === 'left' ? '[clip-path:inset(0_50%_0_0)]' : '[clip-path:inset(0_0_0_50%)]'
  const motionClasses =
    side === 'left'
      ? 'motion-safe:group-hover:-translate-x-1/2 motion-safe:group-hover:-rotate-6'
      : 'motion-safe:group-hover:translate-x-1/2 motion-safe:group-hover:rotate-6'

  return (
    <div
      aria-hidden={side === 'right' ? 'true' : undefined}
      className={`absolute inset-0 isolate bg-cream-50 transition duration-700 ease-out group-hover:opacity-0 ${clipClasses} ${motionClasses}`}
    >
      <img
        src={image.url}
        alt={side === 'left' ? alt : ''}
        width='400'
        height='400'
        loading='lazy'
        decoding='async'
        className='h-full w-full object-contain p-4 mix-blend-multiply'
      />
    </div>
  )
}

/**
 * On hover the front of the pack splits down the middle, each half sliding apart, revealing the back of the pack
 * (images[1]) underneath. Products without a back image zoom instead.
 */
function TopRatedCard({ product }) {
  const [front, back] = product.images ?? []

  return (
    <Link
      to={`/products/${product.slug}`}
      className='group flex h-full flex-col rounded-2xl border border-cream-200 bg-surface p-3 shadow-sm transition duration-500 hover:border-caramel-500/60 hover:shadow-xl hover:shadow-caramel-500/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 motion-safe:hover:-translate-y-1 lg:p-4'
    >
      <div className='relative aspect-square overflow-hidden rounded-xl bg-cream-50'>
        {back && (
          <div className='absolute inset-0 isolate bg-cream-50'>
            <img
              src={back.url}
              alt={`${product.name}, back of pack`}
              width='400'
              height='400'
              loading='lazy'
              decoding='async'
              className='h-full w-full scale-95 object-contain p-4 mix-blend-multiply transition duration-700 ease-out group-hover:scale-100'
            />
          </div>
        )}

        {front &&
          (back ? (
            <>
              <FrontHalf image={front} alt={front.alt || product.name} side='left' />
              <FrontHalf image={front} alt={front.alt || product.name} side='right' />
            </>
          ) : (
            <img
              src={front.url}
              alt={front.alt || product.name}
              width='400'
              height='400'
              loading='lazy'
              decoding='async'
              className='h-full w-full object-contain p-4 mix-blend-multiply transition duration-700 ease-out motion-safe:group-hover:scale-110'
            />
          ))}

        <span className='absolute top-2 left-2 z-10 inline-flex items-center gap-1 rounded-full bg-caramel-700 px-2 py-0.5 text-[0.625rem] font-bold tracking-wide text-white uppercase shadow-sm'>
          <Star size={10} strokeWidth={2} aria-hidden='true' className='fill-white' />
          Top Rated
        </span>
      </div>

      <div className='mt-3 flex flex-1 flex-col px-0.5'>
        {product.category?.name && (
          <p className='truncate text-[0.625rem] font-bold tracking-widest text-caramel-700 uppercase'>
            {product.category.name}
          </p>
        )}
        <h3 title={product.name} className='mt-0.5 line-clamp-1 font-sans text-sm font-bold text-navy-800 lg:text-base'>
          {product.name}
        </h3>
        <p className='mt-auto pt-1.5 text-base font-extrabold text-navy-800'>{priceFormatter.format(product.price)}</p>
      </div>
    </Link>
  )
}

function PlaceholderCard() {
  return (
    <div className='rounded-2xl border border-cream-200 bg-surface p-3 shadow-sm lg:p-4'>
      <div className='aspect-square animate-pulse rounded-xl bg-cream-100' />
      <div className='mt-3 h-3 w-1/3 animate-pulse rounded bg-cream-100' />
      <div className='mt-2 h-4 w-3/4 animate-pulse rounded bg-cream-100' />
      <div className='mt-2 h-5 w-1/4 animate-pulse rounded bg-cream-100' />
    </div>
  )
}

/**
 * Home "Top Rated": the hand-picked products from content/topRatedProducts.js in four slots. One slot at a time
 * swaps to the next product (fade out, then the new card rises in), pausing while hovered or focused and never
 * running for visitors who prefer reduced motion.
 */
function TopRatedSection() {
  const [pool, setPool] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'hidden'
  const [slots, setSlots] = useState([]) // pool index shown in each slot
  const [leavingSlot, setLeavingSlot] = useState(null)
  const nextPoolIndexRef = useRef(0)
  const nextSlotRef = useRef(0)
  const isPausedRef = useRef(false)

  useEffect(() => {
    let isCancelled = false

    productApi
      .list({ limit: PRODUCT_LIMIT })
      .then((items) => {
        if (isCancelled) return
        const bySlug = new Map(items.map((product) => [product.slug, product]))
        const picked = TOP_RATED_PRODUCT_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean)

        const initialSlots = picked.slice(0, SLOT_COUNT).map((_, index) => index)
        nextPoolIndexRef.current = initialSlots.length % Math.max(picked.length, 1)
        setPool(picked)
        setSlots(initialSlots)
        setStatus(picked.length ? 'ready' : 'hidden')
      })
      .catch(() => {
        if (!isCancelled) setStatus('hidden')
      })

    return () => {
      isCancelled = true
    }
  }, [])

  // Rotation. Needs more products than slots, or there is nothing new to swap in.
  useEffect(() => {
    if (pool.length <= SLOT_COUNT || prefersReducedMotion()) return undefined

    let leaveTimer
    const interval = setInterval(() => {
      if (isPausedRef.current) return

      const slot = nextSlotRef.current
      setLeavingSlot(slot)

      leaveTimer = setTimeout(() => {
        const incoming = nextPoolIndexRef.current
        setSlots((current) => current.map((poolIndex, index) => (index === slot ? incoming : poolIndex)))
        nextPoolIndexRef.current = (incoming + 1) % pool.length
        nextSlotRef.current = (slot + 1) % SLOT_COUNT
        setLeavingSlot(null)
      }, LEAVE_MS)
    }, SWAP_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      clearTimeout(leaveTimer)
    }
  }, [pool.length])

  const pause = useCallback(() => {
    isPausedRef.current = true
  }, [])
  const resume = useCallback(() => {
    isPausedRef.current = false
  }, [])

  if (status === 'hidden') return null

  return (
    <section
      aria-labelledby='top-rated-heading'
      className='bg-linear-to-b from-surface via-cream-50 to-surface py-12 md:py-16'
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <div className='mx-auto max-w-7xl px-4 sm:px-6 xl:max-w-none xl:px-10 2xl:px-16'>
        <header className='text-center'>
          <p className='flex justify-center gap-1 text-caramel-500' aria-hidden='true'>
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} size={16} strokeWidth={1.75} className='fill-caramel-500' />
            ))}
          </p>
          <h2 id='top-rated-heading' className='mt-2 text-2xl font-semibold text-navy-800 md:text-3xl'>
            Top Rated
          </h2>
          <p className='mt-2 text-sm text-body md:text-base'>Our most-loved chikkis, handpicked for you</p>
          <GoldenDivider className='mt-3' />
        </header>

        {/* aria-live stays off: announcing every automatic swap would be noisy for screen-reader users. */}
        <ul className='mt-8 grid grid-cols-2 gap-4 md:mt-10 md:gap-6 lg:grid-cols-4'>
          {status === 'loading'
            ? Array.from({ length: SLOT_COUNT }, (_, index) => (
                <li key={index}>
                  <PlaceholderCard />
                </li>
              ))
            : slots.map((poolIndex, slot) => {
                const product = pool[poolIndex]
                return (
                  // A new key per product remounts the card, so `starting:` plays its rise-in on every swap.
                  <li
                    key={`${slot}-${product.id}`}
                    className={`transition duration-500 ease-out starting:translate-y-4 starting:scale-95 starting:opacity-0 ${
                      leavingSlot === slot ? '-translate-y-2 scale-95 opacity-0' : ''
                    }`}
                  >
                    <TopRatedCard product={product} />
                  </li>
                )
              })}
        </ul>
      </div>
    </section>
  )
}

export { TopRatedSection }
export default TopRatedSection