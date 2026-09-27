import vrindavanRiverScene from '../../assets/backgrounds/morethanchikki.avif'
import chikkiMascot from '../../assets/illustrations/mascot-waving-with-flute.avif'

/**
 * Home closing band above the footer, as in design-reference/finaLaadliBytesUI.png: the Vrindavan river scene
 * with "More than just Chikkis… It's a taste of Vrindavan" in the open sky and the mascot by the boat.
 */
function TasteOfVrindavanSection() {
  return (
    // From md the band keeps the scene's proportions, so the mascot's percentage position lands on the boat.
    // On phones it is content-height and the scene crops from the centre.
    <section
      aria-labelledby='taste-of-vrindavan-heading'
      className='relative mt-10 flex min-h-80 justify-center overflow-hidden pt-10 sm:min-h-96 md:mt-14 md:aspect-1916/821 md:min-h-0 md:pt-[5%]'
    >
      <img
        src={vrindavanRiverScene}
        alt=''
        aria-hidden='true'
        width='1916'
        height='821'
        loading='lazy'
        decoding='async'
        className='absolute inset-0 h-full w-full object-cover object-center'
      />

      <h2
        id='taste-of-vrindavan-heading'
        className='relative z-10 px-4 text-center leading-snug text-navy-800 text-shadow-sm text-shadow-white/80'
      >
        <span className='block text-xl font-medium sm:text-2xl md:text-3xl lg:text-4xl'>More than just Chikkis…</span>
        <span className='mt-1 block text-3xl font-semibold sm:text-4xl md:text-5xl lg:text-6xl'>
          It&rsquo;s a taste of Vrindavan
        </span>
      </h2>

      {/* Mascot standing by the boat on the river (the boat sits at about 75% across, 73% down the scene). */}
      <img
        src={chikkiMascot}
        alt=''
        aria-hidden='true'
        width='400'
        height='400'
        loading='lazy'
        decoding='async'
        className='pointer-events-none absolute right-4 bottom-4 z-10 w-20 select-none sm:w-24 md:right-auto md:bottom-[22%] md:left-[70%] md:w-[10%]'
      />
    </section>
  )
}

export { TasteOfVrindavanSection }
export default TasteOfVrindavanSection