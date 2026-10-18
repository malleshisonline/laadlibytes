import promiseBackground from '../../assets/illustrations/pages_bottom.avif'
import { OUR_PROMISE } from '../../content/aboutUsContent.js'

/** About "Our Promise": pale Vrindavan watercolour band with centred text. */
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

      <div className='relative z-10 mx-auto max-w-2xl px-6 py-12 text-center md:px-10 md:py-20 lg:py-24'>
        <h2 id='our-promise-heading' className='text-2xl font-semibold text-navy-800 md:text-3xl'>
          {OUR_PROMISE.heading}
        </h2>
        <p className='mt-4 text-base leading-relaxed font-semibold text-body md:text-lg'>{OUR_PROMISE.text}</p>
      </div>

    </section>
  )
}

export { OurPromiseSection }
export default OurPromiseSection