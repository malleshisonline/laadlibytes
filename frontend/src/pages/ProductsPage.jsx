import { useCallback, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { PackageSearch, RotateCw, SlidersHorizontal, X } from 'lucide-react'

import jasmineCornerLeft from '../assets/footer/footerflowerleft.avif'
import jasmineCornerRight from '../assets/footer/footerflower.avif'
import heroImage from '../assets/illustrations/Goodness_in_Everybytes.avif'
import wavingMascot from '../assets/illustrations/mascot-waving-with-flute.avif'
import GoldenDivider from '../components/common/GoldenDivider.jsx'
import FilterDrawer from '../components/product/FilterDrawer.jsx'
import ProductCard from '../components/product/ProductCard.jsx'
import ProductFilters from '../components/product/ProductFilters.jsx'
import ProductPromiseStrip from '../components/product/ProductPromiseStrip.jsx'
import PageHeroSection from '../components/sections/PageHeroSection.jsx'
import Pagination from '../components/ui/Pagination.jsx'
import { DEFAULT_SORT, PRICE_RANGES, PRODUCTS_PER_PAGE, SORT_OPTIONS } from '../content/productFilterOptions.js'
import { useCategories } from '../hooks/useCategories.js'
import { useProductList } from '../hooks/useProductList.js'

// Filters that live in the URL. Changing any of them sends the list back to page 1.
const FILTER_KEYS = ['category', 'price', 'sort', 'search']

// Cards rise in one after another; capped so the last card of a page doesn't wait too long.
const CARD_STAGGER_MS = 60
const MAX_STAGGER_MS = 480

const DECORATION_CLASSES = 'pointer-events-none absolute hidden opacity-25 select-none md:block'

const CHIP_CLASSES =
  'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-cream-200 bg-cream-50 pr-1.5 pl-3 text-sm font-semibold text-navy-800 transition hover:border-caramel-500'

/** Reads the page's filters from the URL, ignoring values the page doesn't know. */
function readFilters(searchParams) {
  const price = searchParams.get('price') ?? ''
  const sort = searchParams.get('sort') ?? ''
  const page = Number.parseInt(searchParams.get('page') ?? '1', 10)

  return {
    category: searchParams.get('category')?.trim() ?? '',
    price: PRICE_RANGES.some((range) => range.value === price) ? price : '',
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? sort : DEFAULT_SORT,
    search: searchParams.get('search')?.trim() ?? '',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

function ProductCardSkeleton() {
  return (
    <div aria-hidden='true' className='h-full rounded-2xl border border-lightblue-200 bg-surface p-2.5 shadow-sm lg:p-3'>
      <div className='aspect-square animate-pulse rounded-xl bg-cream-100' />
      <div className='mt-3 h-4 w-3/4 animate-pulse rounded bg-cream-100' />
      <div className='mt-2 h-4 w-1/3 animate-pulse rounded bg-cream-100' />
      <div className='mt-3 h-9 animate-pulse rounded-full bg-lightblue-100' />
      <div className='mt-2.5 h-9 animate-pulse rounded-full bg-cream-100' />
    </div>
  )
}

/**
 * Products page (the "Product Listing" design): filter sidebar on desktop, a filter drawer on smaller screens,
 * and a paginated grid. Every filter is in the URL, so the Shop menu's category links, the navbar search, the
 * back button and shared links all land on the right list.
 */
function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => readFilters(searchParams), [searchParams])
  const { categories } = useCategories()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const resultsRef = useRef(null)

  const priceRange = PRICE_RANGES.find((range) => range.value === filters.price)
  const { products, meta, status, retry } = useProductList({
    page: filters.page,
    limit: PRODUCTS_PER_PAGE,
    category: filters.category,
    search: filters.search,
    minPrice: priceRange?.minPrice,
    maxPrice: priceRange?.maxPrice,
    sort: filters.sort,
  })

  const selectedCategory = categories.find((category) => category.slug === filters.category)
  const activeFilterCount = [filters.category, filters.price, filters.search].filter(Boolean).length

  /** Sets (or, with '', removes) URL values. Any filter change goes back to page 1. */
  const updateParams = useCallback(
    (changes) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        Object.entries(changes).forEach(([key, value]) => {
          if (value === '' || value === undefined || value === null) next.delete(key)
          else next.set(key, String(value))
        })
        if (Object.keys(changes).some((key) => FILTER_KEYS.includes(key))) next.delete('page')
        if (next.get('sort') === DEFAULT_SORT) next.delete('sort')
        if (next.get('page') === '1') next.delete('page')
        return next
      })
    },
    [setSearchParams],
  )

  const handleFilterChange = useCallback((key, value) => updateParams({ [key]: value }), [updateParams])
  const clearAllFilters = useCallback(
    () => updateParams({ category: '', price: '', search: '', sort: '' }),
    [updateParams],
  )
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), [])

  function handlePageChange(page) {
    updateParams({ page })
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const firstShown = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1
  const lastShown = Math.min(meta.page * meta.limit, meta.total)

  const filterPanel = <ProductFilters categories={categories} filters={filters} onChange={handleFilterChange} />

  return (
    <div>
      {/* <PageHeroSection
        title='Our Products'
        subtitle='Traditional chikkis, made with love'
        backgroundImage={heroImage}
        imageWidth={1983}
        imageHeight={793}
      /> */}

      {/* <ProductPromiseStrip /> */}

      {/* Warm cream-to-blue wash with faint jasmine in the corners, so the grid doesn't sit on plain white. */}
      <div className='relative overflow-hidden bg-linear-to-b from-cream-50 via-surface to-lightblue-50'>
        <img
          src={jasmineCornerRight}
          alt=''
          aria-hidden='true'
          width='1295'
          height='1214'
          loading='lazy'
          decoding='async'
          className={`${DECORATION_CLASSES} -top-6 -right-6 w-40 -scale-y-100 lg:w-56`}
        />
        <img
          src={jasmineCornerLeft}
          alt=''
          aria-hidden='true'
          width='1295'
          height='1214'
          loading='lazy'
          decoding='async'
          className={`${DECORATION_CLASSES} -bottom-6 -left-6 w-40 lg:w-56`}
        />

        <div
          ref={resultsRef}
          // Full width like the design: a slim side gutter, widening on large screens; no max-width box.
          className='relative z-10 scroll-mt-24 px-3 py-8 sm:px-4 md:py-10 lg:flex lg:gap-6 lg:px-6 xl:gap-8 xl:px-16 2xl:px-24'
        >
          {/* Desktop sidebar: navy header, then the filters on cream. */}
          <aside aria-label='Product filters' className='hidden w-64 shrink-0 lg:block'>
            <div className='sticky top-28 overflow-hidden rounded-2xl border border-cream-200 bg-cream-50 shadow-lg shadow-navy-900/5'>
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
                  <SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden='true' className='text-caramel-500' />
                  Refine your pick
                </p>
              </div>
              <div className='p-3'>{filterPanel}</div>
            </div>
          </aside>

          <section aria-labelledby='products-heading' className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-end justify-between gap-3'>
              {/* Title on the left, the page's one mascot waving from the right end of the same row. */}
              <div className='flex min-w-0 flex-1 items-end justify-between gap-3'>
                <div>
                  <p className='text-xs font-bold tracking-[0.25em] text-caramel-700 uppercase'>Handcrafted in Vrindavan</p>
                  <h2 id='products-heading' className='mt-1 text-2xl font-semibold text-navy-800 md:text-3xl'>
                    {selectedCategory?.name ?? (filters.category ? 'Products' : 'All Products')}
                  </h2>
                  <GoldenDivider width={150} className='mt-1 mx-0!' />
                  <p className='mt-1 text-sm text-muted' aria-live='polite'>
                    {status === 'loading'
                      ? 'Loading products…'
                      : status === 'ready' && meta.total > 0
                        ? `Showing ${firstShown}–${lastShown} of ${meta.total} product${meta.total === 1 ? '' : 's'}`
                        : ''}
                  </p>
                </div>
                <img
                  src={wavingMascot}
                  alt=''
                  aria-hidden='true'
                  width='400'
                  height='400'
                  loading='lazy'
                  decoding='async'
                  className='pointer-events-none -mb-1 w-20 shrink-0 animate-float select-none motion-reduce:animate-none sm:w-24 lg:w-32'
                />
              </div>

              {/* Filters button and sort, below lg (the sidebar has both on desktop). */}
              <div className='flex w-full gap-2 sm:w-auto lg:hidden'>
                <button
                  type='button'
                  onClick={() => setIsDrawerOpen(true)}
                  aria-haspopup='dialog'
                  className='inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-navy-800 bg-surface px-4 text-sm font-semibold text-navy-800 transition hover:bg-lightblue-100 sm:flex-none'
                >
                  <SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden='true' />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className='grid size-5 place-items-center rounded-full bg-caramel-500 text-xs font-bold text-white'>
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <label className='sr-only' htmlFor='products-sort'>
                  Sort products
                </label>
                <select
                  id='products-sort'
                  value={filters.sort}
                  onChange={(event) => handleFilterChange('sort', event.target.value)}
                  className='min-h-11 flex-1 rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-navy-800 outline-none focus:border-navy-600 focus:ring-2 focus:ring-lightblue-200 sm:flex-none'
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active filters as removable chips. */}
            {activeFilterCount > 0 && (
              <div className='mt-4 flex flex-wrap items-center gap-2'>
                {filters.category && (
                  <button type='button' onClick={() => handleFilterChange('category', '')} className={CHIP_CLASSES}>
                    {selectedCategory?.name ?? filters.category}
                    <X size={14} strokeWidth={2} aria-label='Remove category filter' />
                  </button>
                )}
                {priceRange && (
                  <button type='button' onClick={() => handleFilterChange('price', '')} className={CHIP_CLASSES}>
                    {priceRange.label}
                    <X size={14} strokeWidth={2} aria-label='Remove price filter' />
                  </button>
                )}
                {filters.search && (
                  <button type='button' onClick={() => handleFilterChange('search', '')} className={CHIP_CLASSES}>
                    “{filters.search}”
                    <X size={14} strokeWidth={2} aria-label='Remove search' />
                  </button>
                )}
                <button
                  type='button'
                  onClick={clearAllFilters}
                  className='min-h-9 px-2 text-sm font-semibold text-caramel-700 underline-offset-4 hover:underline'
                >
                  Clear all
                </button>
              </div>
            )}

            <div className='mt-6'>
              {status === 'error' ? (
                <div className='rounded-2xl border border-cream-200 bg-cream-50 px-6 py-12 text-center'>
                  <p className='text-body'>We couldn’t load the products right now.</p>
                  <button
                    type='button'
                    onClick={retry}
                    className='mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-800 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'
                  >
                    <RotateCw size={16} strokeWidth={1.75} aria-hidden='true' />
                    Try again
                  </button>
                </div>
              ) : status === 'ready' && products.length === 0 ? (
                <div className='rounded-2xl border border-cream-200 bg-cream-50 px-6 py-12 text-center'>
                  <PackageSearch size={40} strokeWidth={1.5} aria-hidden='true' className='mx-auto text-caramel-500' />
                  <p className='mt-3 font-semibold text-navy-800'>No products match these filters.</p>
                  <p className='mt-1 text-sm text-muted'>Try another category or price range.</p>
                  <button
                    type='button'
                    onClick={clearAllFilters}
                    className='mt-5 inline-flex min-h-11 items-center rounded-lg bg-navy-800 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                // From md the columns are sized by the card, not the screen, so wider screens fit more cards rather
                // than bigger ones: at least 17rem each on tablets, 12.5rem from xl (about 200–250px; 4 per row on a
                // 1280px laptop). Two columns on phones.
                <ul className='grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] md:gap-5 xl:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]'>
                  {status === 'loading'
                    ? Array.from({ length: PRODUCTS_PER_PAGE }, (_, index) => (
                        <li key={index}>
                          <ProductCardSkeleton />
                        </li>
                      ))
                    : products.map((product, index) => (
                        <li
                          key={product.id}
                          className='animate-fade-up motion-reduce:animate-none'
                          // Timing only: each card starts a moment after the one before it.
                          style={{ animationDelay: `${Math.min(index * CARD_STAGGER_MS, MAX_STAGGER_MS)}ms` }}
                        >
                          <ProductCard product={product} />
                        </li>
                      ))}
                </ul>
              )}
            </div>

            {status === 'ready' && (
              <div className='mt-10'>
                <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={handlePageChange} />
              </div>
            )}
          </section>
        </div>
      </div>

      <FilterDrawer
        isOpen={isDrawerOpen}
        onClose={closeDrawer}
        onClearAll={clearAllFilters}
        resultCount={status === 'ready' ? meta.total : null}
      >
        {filterPanel}
      </FilterDrawer>
    </div>
  )
}

export default ProductsPage