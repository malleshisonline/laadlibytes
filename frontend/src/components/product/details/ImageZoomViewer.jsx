import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react'

import { cloudinaryImageUrl } from '../../../utils/cloudinaryImage.js'

const ZOOM_LEVELS = [1, 2, 3]
// A pointer that moves less than this between press and release counts as a tap, not a drag or swipe.
const TAP_TOLERANCE_PX = 6
const SWIPE_THRESHOLD_PX = 50

const viewerImageUrl = (url) => cloudinaryImageUrl(url, 2000, 2000, { crop: 'limit' })
const thumbnailUrl = (url) => cloudinaryImageUrl(url, 120, 120, { crop: 'limit' })

const CONTROL_CLASSES =
  'inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30'

/**
 * Full-screen photo viewer. Tap or click a photo to zoom in at that point (tap again to zoom out), drag to pan
 * while zoomed, swipe or use ← → to change photo, + / − to zoom, Escape to close.
 */
function ImageZoomViewer({ images, productName, startIndex, onClose }) {
  const [index, setIndex] = useState(startIndex)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const stageRef = useRef(null)
  const closeButtonRef = useRef(null)
  const pointerRef = useRef(null) // { startX, startY, startOffset, moved }

  const image = images[index]
  const isZoomed = zoomLevel > 1

  const showPhoto = useCallback(
    (nextIndex) => {
      setIndex((nextIndex + images.length) % images.length)
      setZoomLevel(1)
      setOffset({ x: 0, y: 0 })
    },
    [images.length],
  )

  // One step up or down ZOOM_LEVELS, keeping the same spot of the photo in view.
  const changeZoom = useCallback(
    (direction) => {
      const position = ZOOM_LEVELS.indexOf(zoomLevel)
      const next = ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, Math.max(0, position + direction))]
      if (next === zoomLevel) return
      setZoomLevel(next)
      setOffset(next === 1 ? { x: 0, y: 0 } : { x: (offset.x / zoomLevel) * next, y: (offset.y / zoomLevel) * next })
    },
    [zoomLevel, offset],
  )

  // On open: focus the close button and stop the page behind from scrolling.
  useEffect(() => {
    closeButtonRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  // Keyboard controls.
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowRight') showPhoto(index + 1)
      else if (event.key === 'ArrowLeft') showPhoto(index - 1)
      else if (event.key === '+' || event.key === '=') changeZoom(1)
      else if (event.key === '-') changeZoom(-1)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [index, onClose, showPhoto, changeZoom])

  function handlePointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointerRef.current = { startX: event.clientX, startY: event.clientY, startOffset: offset, moved: false }
    setIsDragging(true)
  }

  function handlePointerMove(event) {
    const pointer = pointerRef.current
    if (!pointer) return
    const dx = event.clientX - pointer.startX
    const dy = event.clientY - pointer.startY
    if (Math.abs(dx) > TAP_TOLERANCE_PX || Math.abs(dy) > TAP_TOLERANCE_PX) pointer.moved = true
    if (isZoomed) setOffset({ x: pointer.startOffset.x + dx, y: pointer.startOffset.y + dy })
  }

  function handlePointerUp(event) {
    const pointer = pointerRef.current
    pointerRef.current = null
    setIsDragging(false)
    if (!pointer) return

    const dx = event.clientX - pointer.startX

    // Swipe to change photo (only when not zoomed; zoomed drags pan instead).
    if (!isZoomed && Math.abs(dx) > SWIPE_THRESHOLD_PX) {
      showPhoto(index + (dx < 0 ? 1 : -1))
      return
    }
    if (pointer.moved) return

    // Tap: zoom in so the tapped point stays under the finger, or zoom back out.
    if (isZoomed) {
      setZoomLevel(1)
      setOffset({ x: 0, y: 0 })
      return
    }
    const rect = stageRef.current.getBoundingClientRect()
    const nextZoom = ZOOM_LEVELS[1]
    const fromCentreX = event.clientX - (rect.left + rect.width / 2)
    const fromCentreY = event.clientY - (rect.top + rect.height / 2)
    setZoomLevel(nextZoom)
    setOffset({ x: -fromCentreX * (nextZoom - 1), y: -fromCentreY * (nextZoom - 1) })
  }

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label={`${productName} photos`}
      className='fixed inset-0 z-60 flex flex-col bg-navy-950/95 text-white backdrop-blur-sm'
    >
      {/* Top bar: counter, zoom and close. */}
      <div className='flex items-center justify-between gap-3 px-3 py-3 sm:px-6'>
        <p className='text-sm font-semibold text-lightblue-100' aria-live='polite'>
          {index + 1} / {images.length}
        </p>
        <div className='flex items-center gap-2'>
          <button type='button' onClick={() => changeZoom(-1)} disabled={!isZoomed} aria-label='Zoom out' className={CONTROL_CLASSES}>
            <ZoomOut size={20} strokeWidth={1.75} aria-hidden='true' />
          </button>
          <button
            type='button'
            onClick={() => changeZoom(1)}
            disabled={zoomLevel >= ZOOM_LEVELS.at(-1)}
            aria-label='Zoom in'
            className={CONTROL_CLASSES}
          >
            <ZoomIn size={20} strokeWidth={1.75} aria-hidden='true' />
          </button>
          <button ref={closeButtonRef} type='button' onClick={onClose} aria-label='Close viewer' className={CONTROL_CLASSES}>
            <X size={22} strokeWidth={1.75} aria-hidden='true' />
          </button>
        </div>
      </div>

      {/* Stage. */}
      <div className='relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16'>
        <div
          ref={stageRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            pointerRef.current = null
            setIsDragging(false)
          }}
          className={`relative flex h-full w-full touch-none items-center justify-center overflow-hidden select-none ${
            isZoomed ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
          }`}
        >
          <img
            key={image.url}
            src={viewerImageUrl(image.url)}
            alt={image.alt || `${productName}, photo ${index + 1}`}
            draggable='false'
            className={`max-h-full max-w-full rounded-lg bg-white object-contain ${
              isDragging ? '' : 'transition-transform duration-300 ease-out'
            } motion-reduce:transition-none`}
            // Zoom and pan are measured from the pointer, so they can only be set inline.
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoomLevel})` }}
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              type='button'
              onClick={() => showPhoto(index - 1)}
              aria-label='Previous photo'
              className={`${CONTROL_CLASSES} absolute top-1/2 left-2 hidden -translate-y-1/2 sm:inline-flex`}
            >
              <ChevronLeft size={24} strokeWidth={1.75} aria-hidden='true' />
            </button>
            <button
              type='button'
              onClick={() => showPhoto(index + 1)}
              aria-label='Next photo'
              className={`${CONTROL_CLASSES} absolute top-1/2 right-2 hidden -translate-y-1/2 sm:inline-flex`}
            >
              <ChevronRight size={24} strokeWidth={1.75} aria-hidden='true' />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails. */}
      <ul className='flex justify-center gap-2 overflow-x-auto px-3 py-3 scrollbar-none sm:py-4 [&::-webkit-scrollbar]:hidden'>
        {images.map((thumb, thumbIndex) => (
          <li key={thumb.publicId ?? thumb.url} className='shrink-0'>
            <button
              type='button'
              onClick={() => showPhoto(thumbIndex)}
              aria-label={`Show photo ${thumbIndex + 1}`}
              aria-current={thumbIndex === index ? 'true' : undefined}
              className={`block size-14 overflow-hidden rounded-lg border-2 bg-white p-0.5 transition sm:size-16 ${
                thumbIndex === index ? 'border-caramel-500' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={thumbnailUrl(thumb.url)} alt='' width='64' height='64' className='h-full w-full object-contain' />
            </button>
          </li>
        ))}
      </ul>
      <p className='pb-3 text-center text-xs text-lightblue-100/70'>
        Tap the photo to zoom · drag to move around · swipe or use ← → for the next photo
      </p>
    </div>
  )
}

export { ImageZoomViewer }
export default ImageZoomViewer