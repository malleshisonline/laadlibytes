import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react'

import vrindavanRiverScene from '../../assets/backgrounds/morethanchikki.avif'
import { TESTIMONIALS } from '../../content/testimonials.js'
import GoldenDivider from '../common/GoldenDivider.jsx'

const MAX_RATING = 5

// The featured quote advances on its own every AUTO_ADVANCE_MS (paused on hover/focus, off for reduced motion).
const AUTO_ADVANCE_MS = 6000

const CONTROL_BUTTON_CLASSES =
  'inline-flex size-10 items-center justify-center rounded-full border border-cream-200 bg-surface text-navy-800 shadow-sm transition hover:bg-lightblue-50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function initialsOf(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

function Stars({ rating, size = 18 }) {
  return (
    <span className='flex gap-0.5' role='img' aria-label={`Rated ${rating} out of ${MAX_RATING}`}>
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <Star
          key={index}
          size={size}
          strokeWidth={1.75}
          aria-hidden='true'
          className={index < rating ? 'fill-caramel-500 text-caramel-500' : 'text-cream-200'}
        />
      ))}
    </span>
  )
}

/** Small card in the scrolling ribbon under the featured quote. Decorative duplicate of the same reviews. */
function RibbonCard({ testimonial }) {
  return (
    <li className='w-64 shrink-0 rounded-2xl border border-cream-200 bg-surface/80 p-4 text-left shadow-sm backdrop-blur-sm md:w-80'>
      <Stars rating={testimonial.rating} size={14} />
      <p className='mt-2 line-clamp-3 text-sm leading-relaxed text-body'>&ldquo;{testimonial.quote}&rdquo;</p>
      <p className='mt-3 text-xs font-bold tracking-wide text-caramel-700'>
        {testimonial.name} <span className='font-normal text-muted'>· {testimonial.place}</span>
      </p>
    </li>
  )
}

/**
 * Home testimonials: one featured review at a time in a frosted card (crossfades on its own, with arrows and
 * dots), over a light-blue band with the Vrindavan scene softly behind, and a slow ribbon of all reviews below.
 * Reviews come from content/testimonials.js.
 */
function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const isPausedRef = useRef(false)
  const count = TESTIMONIALS.length

  const goTo = useCallback((index) => setActiveIndex((index + count) % count), [count])

  useEffect(() => {
    if (count <= 1 || prefersReducedMotion()) return undefined
    const interval = setInterval(() => {
      if (!isPausedRef.current) setActiveIndex((current) => (current + 1) % count)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(interval)
  }, [count])

  const pause = useCallback(() => {
    isPausedRef.current = true
  }, [])
  const resume = useCallback(() => {
    isPausedRef.current = false
  }, [])

  if (!count) return null

  return (
    // Light inset rounded band (light blue, not navy), so it contrasts with the navy footer below.
    <section
      aria-labelledby='testimonials-heading'
      className='relative mx-3 my-10 overflow-hidden rounded-3xl border border-lightblue-300 bg-lightblue-200 py-14 sm:mx-6 md:my-14 md:py-20 lg:mx-10'
    >
      {/* Vrindavan river scene, soft, plus a soft white highlight at the top. */}
      <img
        src={vrindavanRiverScene}
        alt=''
        aria-hidden='true'
        width='1916'
        height='821'
        loading='lazy'
        decoding='async'
        // Multiply tints the scene into the light-blue band instead of washing it out to white.
        className='absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-multiply'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-0 -top-1/3 h-2/3 bg-radial from-surface/60 to-transparent to-70%'
      />
      <Quote
        aria-hidden='true'
        strokeWidth={1}
        className='pointer-events-none absolute top-6 left-1/2 size-40 -translate-x-1/2 text-caramel-500/15 md:size-56'
      />

      <div className='relative z-10 mx-auto max-w-7xl px-4 sm:px-6'>
        <header className='text-center'>
          <p className='text-xs font-bold tracking-[0.3em] text-caramel-700 uppercase'>Testimonials</p>
          <h2 id='testimonials-heading' className='mt-2 text-3xl font-semibold text-navy-800 md:text-4xl'>
            What Our Family Says
          </h2>
          <GoldenDivider className='mt-3' />
        </header>

        {/* Featured review. All reviews share one grid cell, so the card keeps the tallest height and only the
            active one is visible (inactive ones are inert, so they can't be reached by keyboard or screen reader). */}
        <div
          className='mx-auto mt-10 max-w-3xl'
          onMouseEnter={pause}
          onMouseLeave={resume}
          onFocus={pause}
          onBlur={resume}
        >
          <div className='grid rounded-3xl border border-cream-200 bg-surface/80 p-6 shadow-2xl shadow-navy-900/10 backdrop-blur-md sm:p-8 md:p-10'>
            {TESTIMONIALS.map((testimonial, index) => {
              const isActive = index === activeIndex
              return (
                <figure
                  key={index}
                  inert={!isActive}
                  aria-hidden={!isActive}
                  className={`col-start-1 row-start-1 flex flex-col items-center text-center transition duration-700 ease-out ${
                    isActive ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-6 opacity-0'
                  }`}
                >
                  <Stars rating={testimonial.rating} />
                  <blockquote className='mt-5 text-lg leading-relaxed text-body md:text-xl'>
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <figcaption className='mt-6 flex items-center gap-3'>
                    <span
                      aria-hidden='true'
                      className='grid size-11 place-items-center rounded-full bg-caramel-500 text-sm font-bold text-white ring-4 ring-caramel-500/20'
                    >
                      {initialsOf(testimonial.name)}
                    </span>
                    <span className='text-left'>
                      <span className='block font-bold text-navy-800'>{testimonial.name}</span>
                      <span className='block text-sm text-muted'>{testimonial.place}</span>
                    </span>
                  </figcaption>
                </figure>
              )
            })}
          </div>

          {count > 1 && (
            <div className='mt-6 flex items-center justify-center gap-4'>
              <button type='button' aria-label='Previous review' onClick={() => goTo(activeIndex - 1)} className={CONTROL_BUTTON_CLASSES}>
                <ChevronLeft size={20} strokeWidth={1.75} aria-hidden='true' />
              </button>
              <div className='flex items-center gap-1'>
                {TESTIMONIALS.map((_, index) => (
                  <button
                    key={index}
                    type='button'
                    aria-label={`Show review ${index + 1}`}
                    aria-current={index === activeIndex ? 'true' : undefined}
                    onClick={() => goTo(index)}
                    className='p-1'
                  >
                    <span
                      className={`block h-2 rounded-full transition-all duration-300 ${
                        index === activeIndex ? 'w-6 bg-caramel-500' : 'w-2 bg-navy-800/20 hover:bg-navy-800/40'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <button type='button' aria-label='Next review' onClick={() => goTo(activeIndex + 1)} className={CONTROL_BUTTON_CLASSES}>
                <ChevronRight size={20} strokeWidth={1.75} aria-hidden='true' />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ribbon of all reviews drifting sideways (listed twice for a seamless loop; pauses on hover). Decorative
          duplicate of the reviews above, so hidden from screen readers. With reduced motion it stops and can be
          swiped instead. Edges fade out with a mask. */}
      <div
        aria-hidden='true'
        className='relative z-10 mt-12 overflow-hidden mask-x-from-85% mask-x-to-100% motion-reduce:overflow-x-auto md:mt-16'
      >
        <ul className='flex w-max gap-4 px-4 animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none md:gap-6'>
          {[...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, index) => (
            <RibbonCard key={index} testimonial={testimonial} />
          ))}
        </ul>
      </div>
    </section>
  )
}

export { TestimonialsSection }
export default TestimonialsSection