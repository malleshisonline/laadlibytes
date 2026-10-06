import chikkiHamper from '../../assets/illustrations/product_hamper.avif'

function ManufacturingSection() {
  return (
    <section
      aria-labelledby='manufacturing-heading'
      className='mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16'
    >
      <div className='grid items-center gap-8 md:grid-cols-2 md:gap-12'>
        <div className='order-2 md:order-1'>
          <p className='text-sm font-bold tracking-[0.2em] text-caramel-700 uppercase'>
            Made with care
          </p>
          <h2 id='manufacturing-heading' className='mt-2 text-2xl font-semibold text-navy-800 md:text-3xl'>
            Tradition in every batch
          </h2>
          <p className='mt-4 text-base leading-relaxed text-body md:text-lg'>
            Our chikkis are slow-cooked in small batches with jaggery, roasted nuts and seeds.
            We give each batch the time and attention it needs, following the traditional
            flavours that inspired Laadli Bytes.
          </p>
          <p className='mt-4 text-base leading-relaxed text-body md:text-lg'>
            It is a simple, thoughtful way of making something special to share—from an
            everyday bite to a festive moment with family.
          </p>
          <ul className='mt-6 flex flex-wrap gap-2 text-sm font-semibold text-navy-800'>
            <li className='rounded-full border border-cream-200 bg-cream-50 px-4 py-2'>Small batches</li>
            <li className='rounded-full border border-cream-200 bg-cream-50 px-4 py-2'>Jaggery &amp; nuts</li>
            <li className='rounded-full border border-cream-200 bg-cream-50 px-4 py-2'>Traditional flavour</li>
          </ul>
        </div>

        <div className='order-1 mx-auto w-full max-w-md md:order-2'>
          <img
            src={chikkiHamper}
            alt='A collection of Laadli Bytes chikki products'
            width='800'
            height='800'
            loading='lazy'
            decoding='async'
            className='h-auto w-full animate-fade-up select-none motion-reduce:animate-none'
          />
        </div>
      </div>
    </section>
  )
}

export { ManufacturingSection }
export default ManufacturingSection
