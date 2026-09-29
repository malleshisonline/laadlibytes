import { CONTACT_DETAILS, CONTACT_INTRO } from '../../content/contactDetails.js'

/** Contact page left column: title, then address / phone / email / hours rows with round navy icons. */
function ContactDetails() {
  return (
    <div>
      <h1 className="text-3xl font-semibold text-navy-800 md:text-4xl">{CONTACT_INTRO.title}</h1>
      <p className="mt-2 text-body">{CONTACT_INTRO.subtitle}</p>

      <ul className="mt-8 space-y-6">
        {CONTACT_DETAILS.map(({ icon: Icon, label, lines, href }) => (
          <li key={label} className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy-800 text-white">
              <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-sans text-base font-bold text-navy-800">{label}</h2>
              {href ? (
                <a
                  href={href}
                  className="mt-0.5 block text-body transition hover:text-navy-700 hover:underline"
                >
                  {lines.join(' ')}
                </a>
              ) : (
                <p className="mt-0.5 text-body">
                  {lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ContactDetails