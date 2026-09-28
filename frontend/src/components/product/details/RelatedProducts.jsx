import { useMemo } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

import { categoryProductsPath } from '../../../content/navigationMenuItems.js'
import { useAddToCartFeedback } from '../../../hooks/useAddToCartFeedback.js'
import { useProductList } from '../../../hooks/useProductList.js'
import { useScrollPager } from '../../../hooks/useScrollPager.js'
import ProductCard from '../ProductCard.jsx'

const RELATED_LIMIT = 8

// Card widths per view: 2 / 3 / 4 / 5 cards, scrolling sideways beyond that.
const CARD_WIDTH_CLASSES =
  'w-[calc((100%-0.75rem)/2)] shrink-0 snap-start sm:w-[calc((100%-2rem)/3)] md:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)]'

const ARROW_CLASSES =
  'inline-flex size-10 items-center justify-center rounded-full border border-cream-200 bg-surface text-navy-800 shadow-sm transition hover:border-caramel-500 hover:bg-cream-50 disabled:opacity-40'

/**
 * "You may also like": other products from the same category, in a row that scrolls sideways. The scrollbar is
 * hidden; phones swipe, and from md ← → buttons page through it one visible width at a time.
 */
function RelatedProducts({ product }) {
  const categorySlug = product.category?.slug
  // One extra, since the current product may come back in the list.
  const query = useMemo(() => ({ category: categorySlug, limit: RELATED_LIMIT + 1, sort: 'newest' }), [categorySlug])
  const { products, status } = useProductList(query)
  const { handleAddToCart, isAdded } = useAddToCartFeedback()

  const related = products.filter((item) => item.id !== product.id).slice(0, RELATED_LIMIT)
  // Re-measured once the cards arrive (the row isn't rendered before that).
  const { trackRef, pageCount, currentPage, scrollToPage } = useScrollPager(related.length)

  if (!categorySlug || status !== 'ready' || related.length === 0) return null

  return (
    <section aria-labelledby='related-products-heading'>
      <div className='flex items-end justify-between gap-3'>
        <div>
          <p className='text-xs font-bold tracking-[0.25em] text-caramel-700 uppercase'>More from {product.category.name}</p>
          <h2 id='related-products-heading' className='mt-1 text-xl font-semibold text-navy-800 md:text-2xl'>
            You may also like
          </h2>
        </div>
        <div className='flex shrink-0 items-center gap-3'>
          <Link
            to={categoryProductsPath(categorySlug)}
            className='group inline-flex items-center gap-1 text-sm font-semibold text-caramel-700 hover:underline'
          >
            See all
            <ArrowRight size={16} strokeWidth={2} aria-hidden='true' className='transition-transform group-hover:translate-x-1' />
          </Link>
          {pageCount > 1 && (
            <div className='hidden gap-2 md:flex'>
              <button
                type='button'
                onClick={() => scrollToPage(currentPage - 1)}
                disabled={currentPage === 0}
                aria-label='Previous related products'
                className={ARROW_CLASSES}
              >
                <ChevronLeft size={20} strokeWidth={1.75} aria-hidden='true' />
              </button>
              <button
                type='button'
                onClick={() => scrollToPage(currentPage + 1)}
                disabled={currentPage >= pageCount - 1}
                aria-label='Next related products'
                className={ARROW_CLASSES}
              >
                <ChevronRight size={20} strokeWidth={1.75} aria-hidden='true' />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* scrollbar-none hides the bar in Firefox and Chrome; the webkit rule covers Safari. Scrolling still works. */}
      <ul
        ref={trackRef}
        className='mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth py-2 scrollbar-none sm:gap-4 [&::-webkit-scrollbar]:hidden'
      >
        {related.map((item) => (
          <li key={item.id} className={CARD_WIDTH_CLASSES}>
            <ProductCard product={item} onAddToCart={handleAddToCart} isAdded={isAdded(item.id)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export { RelatedProducts }
export default RelatedProducts