import { Link } from 'react-router'

import policyBackground from '../../assets/illustrations/pages_bottom.avif'
import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'

const INLINE_LINK_CLASSES =
  'font-bold text-navy-800 underline decoration-caramel-500 decoration-2 underline-offset-4 hover:text-caramel-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-800'

/**
 * A policy page laid out like the Terms page: a title, an intro, numbered sections of short points, and a
 * contact line. `sections` is [{ id, title, paragraphs }].
 */
function PolicyPage({ title, intro, sections }) {
  useDocumentTitle(title)

  return (
    <main className='relative isolate overflow-hidden bg-cream-50'>
      <div aria-hidden='true' className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
        <img src={policyBackground} alt='' className='size-full object-cover opacity-20' />
      </div>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-cream-50/55 via-white/35 to-lightblue-50/65'
      />

      <div className='relative mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16'>
        <h1 className='mb-6 text-center font-display text-3xl font-semibold text-navy-800 md:text-4xl'>{title}</h1>

        <div className='overflow-hidden rounded-3xl border border-white/90 bg-white/90 shadow-xl shadow-navy-900/10 ring-1 ring-navy-900/5 backdrop-blur-md'>
          <div className='px-5 py-5 text-sm leading-7 text-body sm:px-8 sm:py-6 sm:text-base'>
            {intro} Please read it together with our{' '}
            <Link to={APP_ROUTES.TERMS} className={INLINE_LINK_CLASSES}>
              Terms &amp; Conditions
            </Link>
            .
          </div>

          <div className='divide-y divide-line/70 border-t border-line/70 px-5 sm:px-8'>
            {sections.map(({ id, title: sectionTitle, paragraphs }, index) => (
              <section key={id} aria-labelledby={`${id}-heading`} className='py-6 sm:py-7'>
                <div className='flex items-baseline gap-3'>
                  <span className='text-xs font-bold tabular-nums tracking-wider text-caramel-700'>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2 id={`${id}-heading`} className='font-display text-lg font-semibold text-navy-900 sm:text-xl'>
                    {sectionTitle}
                  </h2>
                </div>
                <ul className='mt-3 space-y-2.5 pl-7'>
                  {paragraphs.map((paragraph) => (
                    <li key={paragraph} className='flex gap-3 text-sm leading-7 text-body sm:text-base'>
                      <span aria-hidden='true' className='mt-[0.8rem] size-1.5 shrink-0 rounded-full bg-caramel-500/80' />
                      <span>{paragraph}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className='border-t border-line/70 bg-cream-50/70 px-5 py-5 sm:px-8'>
            <p className='text-sm leading-7 text-body sm:text-base'>
              If something is unclear, or you need help with an order,{' '}
              <Link to={APP_ROUTES.CONTACT} className={INLINE_LINK_CLASSES}>
                contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default PolicyPage