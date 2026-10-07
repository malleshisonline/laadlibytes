import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight } from 'lucide-react'

import { productApi } from '../../api/productApi.js'
import APP_ROUTES from '../../constants/appRoutepoints.js'
import ProductCard from '../product/ProductCard.jsx'

// Every featured product goes into the row. 100 is the API's page-size maximum.
const BEST_SELLER_LIMIT = 100

// Skeleton cards while the list loads: one full page on desktop.
const PLACEHOLDER_COUNT = 5

// Same per-view widths as the 56 Bhog carousel above: 2 / 3 / 4 / 5 cards.
const CARD_WIDTH_CLASSES =
  'w-[calc((100%-1rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-4.5rem)/4)] lg:w-[calc((100%-6rem)/5)]'

function PlaceholderCard() {
  return (
    <div className='h-full rounded-2xl border border-lightblue-200 bg-surface p-2.5 shadow-sm lg:p-3'>
      <div className='aspect-square animate-pulse rounded-xl bg-cream-100' />
      <div className='mt-2.5 h-4 w-3/4 animate-pulse rounded bg-cream-100' />
      <div className='mt-1.5 h-4 w-1/3 animate-pulse rounded bg-cream-100' />
      <div className='mt-2.5 h-9 animate-pulse rounded-full bg-lightblue-100' />
      <div className='mt-2.5 h-9 animate-pulse rounded-full bg-cream-100' />
    </div>
  )
}

/**
 * Home "Our Best Sellers": every featured product (isFeatured in the admin) in a row that scrolls
 * sideways by swipe or trackpad, with a link to the full product list below it.
 * Rendered inside the 56 Bhog section, so it has no background or outer padding of its own.
 */
function BestSellersSection() {
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'hidden'

  useEffect(() => {
    let isCancelled = false

    productApi
      .list({ featured: true, limit: BEST_SELLER_LIMIT })
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

  if (status === 'hidden') return null

  return (
    <section aria-labelledby='best-sellers-heading' className='mt-12 md:mt-16'>
      {/* Left-aligned with the first card, as in the Home design. No side inset on phones, so the cards get the full width. */}
      <h2 id='best-sellers-heading' className='text-2xl font-semibold text-navy-800 sm:px-10 md:px-14 md:text-3xl'>
        Our Best Sellers
      </h2>

      <div className='relative mt-6 md:mt-8'>
        <ul
          className='flex snap-x snap-mandatory gap-0 overflow-x-auto scroll-smooth py-0 scrollbar-none [&::-webkit-scrollbar]:hidden'
        >
          {status === 'loading'
            ? Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
              <li
                key={index}
                className='w-1/2 shrink-0 snap-start sm:w-1/3 md:w-1/4 lg:w-1/5 xl:w-[14.285714%]'
              >
                <PlaceholderCard />
              </li>
            ))
            : products.map((product) => (
              <li
                key={product.id}
                className='w-1/2 shrink-0 snap-start sm:w-1/3 md:w-1/4 lg:w-1/5 xl:w-[14.285714%]'
              >
                <ProductCard product={product} />
              </li>
            ))}
        </ul>
      </div>

      <div className='mt-8 flex justify-center md:mt-10'>
        <Link
          to={APP_ROUTES.PRODUCTS}
          className='inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-navy-800 px-8 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600'
        >
          View All Products
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden='true' />
        </Link>
      </div>
    </section>
  )
}

export { BestSellersSection }
export default BestSellersSection