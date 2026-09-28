import { useRef, useState } from 'react'
import { Expand, ZoomIn } from 'lucide-react'

import { cloudinaryImageUrl } from '../../../utils/cloudinaryImage.js'

// How much the side pane magnifies the photo while zoom is on.
const HOVER_ZOOM = 2.5

// Photos are shrunk to fit (never cropped), so the whole pack always shows.
const mainImageUrl = (url) => cloudinaryImageUrl(url, 900, 900, { crop: 'limit' })
const zoomImageUrl = (url) => cloudinaryImageUrl(url, 1800, 1800, { crop: 'limit' })
const thumbnailUrl = (url) => cloudinaryImageUrl(url, 160, 160, { crop: 'limit' })

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * Desktop main photo with Amazon-style zoom, switched on by the shopper rather than by hovering: clicking the
 * photo turns on a lens that follows the pointer and a magnified pane to its right (over the details column).
 * Clicking again, or moving off the photo, turns it off. The expand button opens the full-screen viewer.
 */
function ClickZoomImage({ image, alt, onOpen }) {
  const stageRef = useRef(null)
  const [isZoomOn, setIsZoomOn] = useState(false)
  const [zoom, setZoom] = useState(null) // { lensLeft, lensTop, lensWidth, lensHeight, bgX, bgY }

  /** Lens and pane position for a pointer at (clientX, clientY). */
  function measureZoom(clientX, clientY) {
    const rect = stageRef.current.getBoundingClientRect()
    const lensWidth = rect.width / HOVER_ZOOM
    const lensHeight = rect.height / HOVER_ZOOM
    const lensLeft = clamp(clientX - rect.left - lensWidth / 2, 0, rect.width - lensWidth)
    const lensTop = clamp(clientY - rect.top - lensHeight / 2, 0, rect.height - lensHeight)

    return {
      lensLeft,
      lensTop,
      lensWidth,
      lensHeight,
      bgX: (lensLeft / (rect.width - lensWidth)) * 100,
      bgY: (lensTop / (rect.height - lensHeight)) * 100,
    }
  }

  function handleClick(event) {
    if (isZoomOn) {
      setIsZoomOn(false)
      return
    }
    setZoom(measureZoom(event.clientX, event.clientY))
    setIsZoomOn(true)
  }

  function handleMouseMove(event) {
    if (isZoomOn) setZoom(measureZoom(event.clientX, event.clientY))
  }

  const showZoom = isZoomOn && zoom

  return (
    <div className='relative'>
      <button
        ref={stageRef}
        type='button'
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsZoomOn(false)}
        aria-pressed={isZoomOn}
        aria-label={isZoomOn ? `Turn off zoom on ${alt}` : `Zoom into ${alt}`}
        className={`group relative block aspect-square w-full overflow-hidden rounded-2xl border border-cream-200 bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 ${
          isZoomOn ? 'cursor-zoom-out' : 'cursor-zoom-in'
        }`}
      >
        <img
          src={mainImageUrl(image.url)}
          alt={alt}
          width='900'
          height='900'
          fetchPriority='high'
          className='h-full w-full object-contain p-4'
        />

        {/* Lens: the part of the photo the side pane shows. Position is measured from the pointer. */}
        {showZoom && (
          <span
            aria-hidden='true'
            className='pointer-events-none absolute rounded-md border border-caramel-500 bg-caramel-500/10 shadow-inner'
            style={{ left: zoom.lensLeft, top: zoom.lensTop, width: zoom.lensWidth, height: zoom.lensHeight }}
          />
        )}

        {!isZoomOn && (
          <span className='pointer-events-none absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-navy-800 shadow-sm ring-1 ring-cream-200'>
            <ZoomIn size={14} strokeWidth={2} aria-hidden='true' />
            Click to zoom
          </span>
        )}
      </button>

      {/* Full-screen viewer, separate from the zoom click. */}
      <button
        type='button'
        onClick={onOpen}
        aria-label={`Open ${alt} in the full-screen viewer`}
        className='absolute top-3 right-3 inline-flex size-10 items-center justify-center rounded-full bg-surface/90 text-navy-800 shadow-sm ring-1 ring-cream-200 transition hover:bg-caramel-500 hover:text-white'
      >
        <Expand size={18} strokeWidth={1.75} aria-hidden='true' />
      </button>

      {/* Magnified pane beside the photo (desktop only), drawn from the large image as a background. */}
      {showZoom && (
        <div
          aria-hidden='true'
          className='pointer-events-none absolute top-0 left-full z-30 ml-4 aspect-square w-full overflow-hidden rounded-2xl border border-caramel-500/60 bg-surface bg-no-repeat shadow-2xl shadow-cocoa-900/20'
          style={{
            backgroundImage: `url("${zoomImageUrl(image.url)}")`,
            backgroundSize: `${HOVER_ZOOM * 100}%`,
            backgroundPosition: `${zoom.bgX}% ${zoom.bgY}%`,
          }}
        />
      )}
    </div>
  )
}

/**
 * Product photos. Desktop (lg): thumbnails down the left (click to switch), the main photo with click-to-zoom
 * and an expand button. Smaller screens: a swipeable carousel with dots. Every photo can open the full-screen
 * viewer (`onOpenViewer(index)`).
 */
function ProductImageGallery({ images, productName, onOpenViewer }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const carouselRef = useRef(null)

  const altFor = (image, index) => image.alt || `${productName}, photo ${index + 1}`

  if (!images.length) {
    return (
      <div className='grid aspect-square place-items-center rounded-2xl border border-cream-200 bg-cream-50 font-display text-6xl text-caramel-500'>
        {productName.charAt(0)}
      </div>
    )
  }

  function handleCarouselScroll() {
    const carousel = carouselRef.current
    if (!carousel) return
    setActiveIndex(Math.round(carousel.scrollLeft / carousel.clientWidth))
  }

  function scrollCarouselTo(index) {
    const carousel = carouselRef.current
    carousel?.scrollTo({ left: index * carousel.clientWidth, behavior: 'smooth' })
  }

  const activeImage = images[Math.min(activeIndex, images.length - 1)]

  return (
    <div>
      {/* Desktop: thumbnails + hover-zoom photo. */}
      <div className='hidden gap-3 lg:flex'>
        <ul className='flex w-16 shrink-0 flex-col gap-2 xl:w-20'>
          {images.map((image, index) => (
            <li key={image.publicId ?? image.url}>
              <button
                type='button'
                onClick={() => setActiveIndex(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                className={`block aspect-square w-full overflow-hidden rounded-lg border-2 bg-surface p-1 transition ${
                  index === activeIndex
                    ? 'border-caramel-500 shadow-md'
                    : 'border-cream-200 hover:border-caramel-500/60'
                }`}
              >
                <img
                  src={thumbnailUrl(image.url)}
                  alt=''
                  width='80'
                  height='80'
                  loading='lazy'
                  decoding='async'
                  className='h-full w-full object-contain'
                />
              </button>
            </li>
          ))}
        </ul>

        <div className='min-w-0 flex-1'>
          <ClickZoomImage
            key={activeImage.url}
            image={activeImage}
            alt={altFor(activeImage, activeIndex)}
            onOpen={() => onOpenViewer(activeIndex)}
          />
        </div>
      </div>

      {/* Phones and tablets: swipeable photos, tap to open the viewer. */}
      <div className='lg:hidden'>
        <div className='relative'>
          <ul
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className='flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-2xl border border-cream-200 bg-surface scrollbar-none [&::-webkit-scrollbar]:hidden'
          >
            {images.map((image, index) => (
              <li key={image.publicId ?? image.url} className='w-full shrink-0 snap-center'>
                <button
                  type='button'
                  onClick={() => onOpenViewer(index)}
                  aria-label={`Open photo ${index + 1} in the full-screen viewer`}
                  className='block aspect-square w-full'
                >
                  <img
                    src={mainImageUrl(image.url)}
                    alt={altFor(image, index)}
                    width='900'
                    height='900'
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : undefined}
                    decoding='async'
                    className='h-full w-full object-contain p-3'
                  />
                </button>
              </li>
            ))}
          </ul>
          <span className='pointer-events-none absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-semibold text-navy-800 shadow-sm ring-1 ring-cream-200'>
            <Expand size={12} strokeWidth={2} aria-hidden='true' />
            {activeIndex + 1} / {images.length}
          </span>
        </div>

        <div className='mt-3 flex justify-center gap-2'>
          {images.map((image, index) => (
            <button
              key={image.publicId ?? image.url}
              type='button'
              onClick={() => scrollCarouselTo(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className='p-1'
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'w-6 bg-caramel-500' : 'w-2 bg-navy-800/20'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export { ProductImageGallery }
export default ProductImageGallery