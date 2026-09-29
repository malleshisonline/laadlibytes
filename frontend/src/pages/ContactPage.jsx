import jasmineCornerLeft from '../assets/footer/footerflowerleft.avif'
import jasmineCornerRight from '../assets/footer/footerflower.avif'
import vrindavanScene from '../assets/illustrations/pages_bottom.avif'
import ContactDetails from '../components/contact/ContactDetails.jsx'
import ContactForm from '../components/contact/ContactForm.jsx'

const DECORATION_CLASSES = 'pointer-events-none absolute select-none'

function ContactPage() {
  return (
    // Pale blue wash with a faint Vrindavan scene and jasmine in the corners, as in the design.
    <section className="relative overflow-hidden bg-linear-to-b from-surface to-lightblue-50">
      <img
        src={vrindavanScene}
        alt=""
        aria-hidden="true"
        width="2172"
        height="724"
        loading="lazy"
        decoding="async"
        className={`${DECORATION_CLASSES} inset-x-0 bottom-0 w-full opacity-20`}
      />
      <img
        src={jasmineCornerRight}
        alt=""
        aria-hidden="true"
        width="1295"
        height="1214"
        loading="lazy"
        decoding="async"
        className={`${DECORATION_CLASSES} -top-6 -right-6 hidden w-40 -scale-y-100 opacity-60 md:block lg:w-56`}
      />
      <img
        src={jasmineCornerLeft}
        alt=""
        aria-hidden="true"
        width="1295"
        height="1214"
        loading="lazy"
        decoding="async"
        className={`${DECORATION_CLASSES} -bottom-6 -left-6 w-28 opacity-60 md:w-40 lg:w-56`}
      />

      <div className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 py-10 md:py-16 lg:grid-cols-[2fr_3fr] lg:gap-12">
        <ContactDetails />
        <ContactForm />
      </div>
    </section>
  )
}

export default ContactPage