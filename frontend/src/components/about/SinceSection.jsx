function SinceSection() {
  return (
    <section
      aria-labelledby='since-heading'
      className='relative mx-auto my-12 max-w-5xl overflow-hidden px-4 py-8 sm:px-6 md:my-16'
    >
      <div className='absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-linear-to-r from-transparent via-caramel-500/60 to-transparent sm:inset-x-6' />

      <div className='relative mx-auto flex max-w-3xl flex-col items-center gap-3 text-center'>
        <p className='text-xs font-bold tracking-[0.25em] text-caramel-700 uppercase'>Our journey</p>
        <h2 id='since-heading' className='sr-only'>
          Laadli Bytes since 2022
        </h2>
        <p
          aria-hidden='true'
          className='animate-fade-up bg-page px-6 font-display text-5xl font-semibold text-navy-800 motion-reduce:animate-none sm:text-6xl md:text-7xl'
        >
          Since <span className='text-caramel-700'>2022</span>
        </p>
        <p className='max-w-xl text-base leading-relaxed text-body md:text-lg'>
          Since 2022, we have been sharing the warmth of Vrindavan-inspired tradition through
          chikkis made to bring people together.
        </p>
      </div>
    </section>
  )
}

export { SinceSection }
export default SinceSection
