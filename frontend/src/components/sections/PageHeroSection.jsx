/**
 * Illustrated page banner (frontend/CLAUDE.md §7): a watercolour scene with a centred title and subtitle.
 * Pulled up under the rounded navbar like the Home hero, so the scene shows in its bottom corners.
 */
function PageHeroSection({ title, subtitle, backgroundImage, imageWidth = 1916, imageHeight = 821 }) {
  return (
    // Short banner strip (about 3.2:1 from md, as in the design), not the full-height Home hero.
    <section className='relative -mt-4 flex min-h-52 items-start justify-center overflow-hidden sm:min-h-60 md:aspect-16/5 md:min-h-0'>
      <img
        src={backgroundImage}
        alt=''
        aria-hidden='true'
        width={imageWidth}
        height={imageHeight}
        fetchPriority='high'
        className='absolute inset-0 h-full w-full object-cover object-center'
      />

      {/* Title sits in the open sky above the temples. */}
      <div className='relative z-10 px-4 pt-12 text-center sm:pt-14 lg:pt-16 xl:pt-20'>
        <h1 className='text-3xl font-semibold text-navy-800 text-shadow-xs text-shadow-white/60 md:text-5xl'>
          {title}
        </h1>
        {subtitle && (
          <p className='mt-3 text-base font-semibold text-navy-900 text-shadow-xs text-shadow-white/60 md:text-lg'>
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}

export { PageHeroSection }
export default PageHeroSection