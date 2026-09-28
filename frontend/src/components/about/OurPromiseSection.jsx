import promiseBackground from '../../assets/illustrations/pages_bottom.avif'
import chikkiMascot from '../../assets/illustrations/mascot-waving-with-flute.avif'
import { OUR_PROMISE } from '../../content/aboutUsContent.js'

/** About "Our Promise": pale Vrindavan watercolour band, centred text, waving mascot bottom-right. */
function OurPromiseSection() {
  return (
    <section
      aria-labelledby='our-promise-heading'
      className='relative mx-1 overflow-hidden rounded-3xl border border-lightblue-300 bg-lightblue-50 mt-[-5vh]'
    >
      <img
        src={promiseBackground}
        alt=''
        aria-hidden='true'
        width='2172'
        height='724'
        loading='lazy'
        decoding='async'
        className='absolute inset-0 h-full w-full object-cover object-left'
      />

      {/* Extra bottom padding below md leaves room for the mascot under the text. */}
      <div className='relative z-10 mx-auto max-w-2xl px-6 pt-12 pb-32 text-center sm:pb-36 md:px-10 md:py-20 lg:py-24'>
        <h2 id='our-promise-heading' className='text-2xl font-semibold text-navy-800 md:text-3xl'>
          {OUR_PROMISE.heading}
        </h2>
        <p className='mt-4 text-base leading-relaxed font-semibold text-body md:text-lg'>{OUR_PROMISE.text}</p>
      </div>

      <img
        src={chikkiMascot}
        alt=''
        aria-hidden='true'
        width='400'
        height='400'
        loading='lazy'
        decoding='async'
        className='pointer-events-none absolute right-3 bottom-0 w-24 select-none sm:w-32 md:right-6 md:w-40 lg:right-12 lg:w-48'
      />
    </section>
  )
}

export { OurPromiseSection }
export default OurPromiseSection