import peacockLeft from '../../assets/illustrations/peacockleft.avif'
import peacockRight from '../../assets/illustrations/peacockright.avif'
import { WHY_CHOOSE_US_POINTS } from '../../content/whyChooseUsPoints.js'

// Corner peacocks: small and faint on phones so they never cover the points, full strength from sm up.
// Side padding on the content grows with them from md, so the row always sits between the two birds.
const PEACOCK_CLASSES =
  'pointer-events-none absolute bottom-0 w-24 opacity-50 select-none sm:w-28 sm:opacity-100 md:w-36 lg:w-48 xl:w-60'

/** Home "Why Choose Us?" band, as in design-reference/finaLaadliBytesUI.png. Static content. */
function WhyChooseUsSection() {
  return (
    <section
      aria-labelledby='why-choose-us-heading'
      className='relative overflow-hidden bg-radial from-surface via-lightblue-50 to-lightblue-100 py-10 md:py-14'
    >
      <img
        src={peacockLeft}
        alt=''
        aria-hidden='true'
        width='1312'
        height='1199'
        loading='lazy'
        decoding='async'
        className={`${PEACOCK_CLASSES} left-0`}
      />
      <img
        src={peacockRight}
        alt=''
        aria-hidden='true'
        width='1312'
        height='1199'
        loading='lazy'
        decoding='async'
        className={`${PEACOCK_CLASSES} right-0`}
      />

      <div className='relative z-10 px-4 sm:px-6 md:px-24 lg:px-44 xl:px-52'>
        <h2 id='why-choose-us-heading' className='text-center text-2xl font-semibold text-navy-800 md:text-3xl'>
          Why Choose Us?
        </h2>

        {/* 2 × 2 with the icon above the text below lg; one row with the icon beside the text and thin dividers
            between the points from lg, as in the design. */}
        <ul className='mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-x-4 gap-y-8 lg:flex lg:gap-0 lg:divide-x lg:divide-lightblue-300'>
          {WHY_CHOOSE_US_POINTS.map(({ icon: Icon, lines }) => (
            <li
              key={lines.join(' ')}
              className='flex flex-col items-center gap-2 text-center lg:flex-1 lg:flex-row lg:justify-center lg:gap-3 lg:px-4 lg:text-left'
            >
              <Icon size={30} strokeWidth={1.5} aria-hidden='true' className='shrink-0 text-navy-600' />
              <p className='text-sm leading-snug font-semibold text-navy-700 md:text-base'>
                {lines[0]}
                <br />
                {lines[1]}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export { WhyChooseUsSection }
export default WhyChooseUsSection