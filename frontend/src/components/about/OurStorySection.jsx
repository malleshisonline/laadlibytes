import { useState } from 'react'

import ourStoryImage from '../../assets/illustrations/OurStoryImage.avif'
import fluteMascot from '../../assets/illustrations/krishnaavatar.avif'
import ourStoryBackground from '../../assets/backgrounds/loginpage_Bg.avif'
import { OUR_STORY } from '../../content/aboutUsContent.js'


function OurStorySection() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section aria-labelledby='our-story-heading' className='relative isolate overflow-hidden bg-cream-50 text-black font-bold'>
      <img
        src={ourStoryBackground}
        alt=''
        aria-hidden='true'
        loading='lazy'
        decoding='async'
        className='pointer-events-none absolute inset-0 -z-20 size-full select-none object-cover'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-cream-50/60 via-cream-50/30 to-cream-50/60 md:bg-linear-to-r md:from-cream-50/80 md:via-cream-50/40 md:to-transparent'
      />

      <div className='mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16'>
        <div className='grid items-center gap-8 md:grid-cols-2 md:gap-12'>
          <div>
            <h2 id='our-story-heading' className='text-2xl font-semibold text-navy-800 md:text-3xl'>
              {OUR_STORY.heading}
            </h2>

            <div id='our-story-text' className='mt-4 flow-root space-y-4 text-base leading-relaxed text-body md:text-lg'>
              <span className='float-right mb-2 ml-3 grid size-28 place-items-center rounded-full bg-radial from-cream-100 via-cream-50 to-transparent sm:size-32 lg:size-40'>
                <img
                  src={fluteMascot}
                  alt=''
                  aria-hidden='true'
                  width='1254'
                  height='1254'
                  loading='lazy'
                  decoding='async'
                  className='pointer-events-none w-full animate-float select-none motion-reduce:animate-none'
                />
              </span>

              {OUR_STORY.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {isExpanded &&
                OUR_STORY.moreParagraphs.map((paragraph) => (
                  <p key={paragraph} className='transition-opacity duration-700 starting:opacity-0'>
                    {paragraph}
                  </p>
                ))}
            </div>

            <button
              type='button'
              aria-expanded={isExpanded}
              aria-controls='our-story-text'
              onClick={() => setIsExpanded((expanded) => !expanded)}
              className='mt-6 inline-flex min-h-11 items-center rounded-full bg-navy-800 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600'
            >
              {isExpanded ? 'Read Less' : 'Read More'}
            </button>
          </div>

          <img
            src={ourStoryImage}
            alt='Peanut chikki pieces on a wooden plate, framed like an old photograph with a peacock feather'
            width='1254'
            height='1254'
            loading='lazy'
            decoding='async'
            className='mx-auto h-auto w-full max-w-xs sm:max-w-sm md:max-w-md'
          />
        </div>
      </div>
    </section>
  )
}

export { OurStorySection }
export default OurStorySection