import { ABOUT_VALUES } from '../../content/aboutUsContent.js'

/** Wraps the `highlight` part of a label in the caramel accent. */
function HighlightedLabel({ label, highlight }) {
  if (!highlight || !label.includes(highlight)) return label
  const [before, after] = label.split(highlight)
  return (
    <>
      {before}
      <span className='font-bold text-caramel-700'>{highlight}</span>
      {after}
    </>
  )
}

/**
 * About values: three points with thin dividers between. Icon beside the text from md; stacked on phones,
 * where three side-by-side columns are too narrow for an icon plus a sentence.
 */
function ValuesRow() {
  return (
    <section aria-label='Our values' className='mx-auto max-w-5xl px-4 pb-12 sm:px-6 md:pb-16'>
      <ul className='grid grid-cols-3 divide-x divide-lightblue-300 border-y border-lightblue-300 py-6 md:py-8'>
        {ABOUT_VALUES.map(({ icon: Icon, label, highlight }) => (
          <li
            key={label}
            className='flex flex-col items-center gap-3 px-2 text-center md:flex-row md:justify-center md:px-5 md:text-left'
          >
            <span className='grid size-14 shrink-0 place-items-center rounded-full bg-lightblue-50 ring-1 ring-lightblue-300 md:size-16'>
              <Icon size={28} strokeWidth={1.5} aria-hidden='true' className='text-navy-600' />
            </span>
            <p className='text-sm leading-snug font-semibold text-navy-700 md:text-base'>
              <HighlightedLabel label={label} highlight={highlight} />
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export { ValuesRow }
export default ValuesRow