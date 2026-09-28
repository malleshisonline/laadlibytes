import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ChevronDown } from 'lucide-react'

import vrindavanNightScene from '../../assets/backgrounds/56bhogbg.avif'
import jasmineCorner from '../../assets/footer/footerflower.avif'
import giftHamper from '../../assets/illustrations/product_hamper.avif'
import { categoryProductsPath } from '../../content/navigationMenuItems.js'
import { useCategories } from '../../hooks/useCategories.js'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'
import GoldenDivider from '../common/GoldenDivider.jsx'

// How long the dropdown waits before closing once the pointer leaves, so crossing the gap doesn't shut it.
const CLOSE_DELAY_MS = 150

/**
 * Category photo in a cream frame (rectangular, like the product cards), or the category's first letter in
 * Merienda when it has no image yet.
 */
function CategoryPicture({ category, width, height, className }) {
  if (category.image?.url) {
    return (
      <img
        src={cloudinaryImageUrl(category.image.url, width * 2, height * 2)}
        alt=''
        width={width}
        height={height}
        loading='lazy'
        decoding='async'
        className={`shrink-0 bg-cream-100 object-cover ${className}`}
      />
    )
  }
  return (
    <span
      aria-hidden='true'
      className={`grid shrink-0 place-items-center bg-cream-100 font-display font-semibold text-caramel-500 ${className}`}
    >
      {category.name.charAt(0)}
    </span>
  )
}

/**
 * Desktop dropdown, in the site's devotional style: a navy Vrindavan panel with the gift hamper on the left,
 * and cream category cards (photo, name, golden arrow) on the right with jasmine in the corner.
 */
function ShopMegaMenuPanel({ id, isOpen, categories, isLoading, hasError, onNavigate }) {
  return (
    <div
      id={id}
      inert={!isOpen}
      className={`absolute top-full left-1/2 z-50 w-3xl -translate-x-1/2 pt-4 transition duration-200 ease-out xl:w-4xl ${
        isOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
      }`}
    >
      <div className='flex overflow-hidden rounded-2xl border border-caramel-500/60 bg-cream-50 shadow-2xl shadow-cocoa-900/20'>
        {/* Left: navy Vrindavan scene with the gift hamper (decorative). */}
        <div className='relative flex w-60 shrink-0 flex-col items-center justify-center gap-4 overflow-hidden bg-navy-900 px-5 py-6 text-center xl:w-64'>
          <img
            src={vrindavanNightScene}
            alt=''
            aria-hidden='true'
            width='2172'
            height='724'
            loading='lazy'
            decoding='async'
            className='absolute inset-0 h-full w-full object-cover object-left opacity-80'
          />
          <div className='relative z-10'>
            <p className='font-display text-xl leading-snug font-semibold text-white'>A Taste of Vrindavan</p>
            <GoldenDivider width={140} className='mt-1 text-caramel-500' />
            <p className='mt-1 text-xs text-lightblue-100'>Traditional chikkis, made with devotion</p>
          </div>
          <img
            src={giftHamper}
            alt=''
            aria-hidden='true'
            width='1448'
            height='1086'
            loading='lazy'
            decoding='async'
            className='relative z-10 w-full drop-shadow-lg'
          />
        </div>

        {/* Right: the categories. */}
        <div className='relative flex-1 px-6 py-5'>
          <img
            src={jasmineCorner}
            alt=''
            aria-hidden='true'
            width='1295'
            height='1214'
            loading='lazy'
            decoding='async'
            className='pointer-events-none absolute -right-3 -bottom-3 w-28 opacity-40 select-none'
          />

          <div className='relative z-10 text-center'>
            <p className='font-display text-xl font-semibold text-navy-800'>Shop by Category</p>
            <GoldenDivider width={160} className='mt-1' />
          </div>

          {hasError && (
            <p className='relative z-10 mt-6 text-center text-sm text-muted'>
              Categories couldn’t be loaded right now. Please try again in a moment.
            </p>
          )}

          <ul className='relative z-10 mt-4 grid grid-cols-3 gap-3'>
            {isLoading
              ? Array.from({ length: 6 }, (_, index) => (
                  <li key={index} aria-hidden='true' className='h-36 animate-pulse rounded-xl bg-cream-100' />
                ))
              : categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      to={categoryProductsPath(category.slug)}
                      onClick={onNavigate}
                      className='group flex h-full flex-col rounded-xl border border-cream-200 bg-white p-2 transition duration-200 hover:-translate-y-0.5 hover:border-caramel-500 hover:shadow-lg hover:shadow-caramel-500/15 focus-visible:outline-2 focus-visible:outline-navy-600 motion-reduce:hover:translate-y-0'
                    >
                      <span className='block overflow-hidden rounded-lg'>
                        <CategoryPicture
                          category={category}
                          width={160}
                          height={96}
                          className='aspect-5/3 w-full text-3xl transition duration-300 group-hover:scale-105'
                        />
                      </span>
                      <span className='mt-2 flex items-center justify-between gap-2 px-1 pb-0.5'>
                        <span className='text-sm font-bold text-navy-800'>{category.name}</span>
                        <ArrowRight
                          size={16}
                          strokeWidth={2}
                          aria-hidden='true'
                          className='shrink-0 text-caramel-500 transition-transform duration-200 group-hover:translate-x-1'
                        />
                      </span>
                    </Link>
                  </li>
                ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export function DesktopShopMenuItem({ item, linkClassName }) {
  const panelId = useId()
  const { categories, isLoading, hasError } = useCategories()
  const [isOpen, setIsOpen] = useState(false)
  const closeTimerRef = useRef(null)
  const toggleRef = useRef(null)
  const pointerTypeRef = useRef('')

  useEffect(() => () => clearTimeout(closeTimerRef.current), [])

  function open() {
    clearTimeout(closeTimerRef.current)
    setIsOpen(true)
  }

  function closeSoon() {
    clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS)
  }

  function close() {
    clearTimeout(closeTimerRef.current)
    setIsOpen(false)
  }


  function handleToggleClick() {
    if (pointerTypeRef.current === 'mouse') open()
    else if (isOpen) close()
    else open()
    pointerTypeRef.current = ''
  }

  return (
    <div
      className='relative flex items-center'
      onMouseEnter={open}
      onMouseLeave={closeSoon}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          close()
          toggleRef.current?.focus()
        }
      }}
    >
      {/* Underlined like the active menu item while the dropdown is open. */}
      <button
        ref={toggleRef}
        type='button'
        aria-expanded={isOpen}
        aria-controls={panelId}
        onPointerDown={(event) => {
          pointerTypeRef.current = event.pointerType
        }}
        onClick={handleToggleClick}
        className={`inline-flex items-center gap-1 ${linkClassName({ isActive: isOpen })}`}
      >
        {item.label}
        <ChevronDown
          size={16}
          strokeWidth={2}
          aria-hidden='true'
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <ShopMegaMenuPanel
        id={panelId}
        isOpen={isOpen}
        categories={categories}
        isLoading={isLoading}
        hasError={hasError}
        onNavigate={close}
      />
    </div>
  )
}

/**
 * Mobile "Shop" menu row: tapping it opens the categories nested underneath (it never navigates itself).
 * `onNavigate` closes the whole mobile menu once a category is picked.
 */
export function MobileShopMenuItem({ item, linkClassName, onNavigate }) {
  const listId = useId()
  const { categories, isLoading, hasError } = useCategories()
  const [isOpen, setIsOpen] = useState(false)

  const nestedLinkClasses =
    'group flex min-h-11 items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-navy-800 transition hover:bg-cream-100'

  return (
    <>
      <button
        type='button'
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((wasOpen) => !wasOpen)}
        className={`w-full justify-between ${linkClassName({ isActive: isOpen })}`}
      >
        {item.label}
        <ChevronDown
          size={20}
          strokeWidth={1.75}
          aria-hidden='true'
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        // Cream card with a caramel edge, like the category cards, nested under "Shop".
        <ul
          id={listId}
          className='mt-1 mb-2 ml-3 space-y-0.5 rounded-xl border border-cream-200 border-l-caramel-500 border-l-2 bg-cream-50 p-1.5 transition-opacity duration-300 starting:opacity-0'
        >
          {isLoading && <li className='px-2 py-2 text-sm text-muted'>Loading categories…</li>}
          {hasError && <li className='px-2 py-2 text-sm text-muted'>Categories couldn’t be loaded right now.</li>}

          {categories.map((category) => (
            <li key={category.id}>
              <Link to={categoryProductsPath(category.slug)} onClick={onNavigate} className={nestedLinkClasses}>
                <CategoryPicture
                  category={category}
                  width={48}
                  height={36}
                  className='h-9 w-12 rounded-md border border-cream-200 text-base'
                />
                <span className='flex-1'>{category.name}</span>
                <ArrowRight
                  size={16}
                  strokeWidth={2}
                  aria-hidden='true'
                  className='shrink-0 text-caramel-500 transition-transform group-hover:translate-x-1'
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default DesktopShopMenuItem