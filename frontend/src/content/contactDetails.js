import { Clock, Mail, MapPin, Phone } from 'lucide-react'

// Contact Us page copy, laid out as in design-reference/finaLaadliBytesUI.png.
// TODO: CONTACT_EMAIL is still the design's placeholder; replace it with the real public address.
const CONTACT_EMAIL = 'hello@laadlibytes.com'
const CONTACT_PHONE = '+91 80081 42786'

export const CONTACT_INTRO = {
  title: 'Contact Us',
  subtitle: 'We’d love to hear from you',
}

// `href` (optional) makes the value a link.
export const CONTACT_DETAILS = [
  {
    icon: MapPin,
    label: 'Our Address',
    lines: [
      'Plot No: 04, H-No: 34-118/1, Mathrupuri Colony,',
      'Sainikpuri (Post), Neredmet, Malkajgiri Circle No. 28,',
      'Hyderabad, Telangana - 500094',
    ],
  },
  {
    icon: Phone,
    label: 'Phone',
    lines: [CONTACT_PHONE],
    href: `tel:${CONTACT_PHONE.replace(/\s/g, '')}`,
  },
  { icon: Mail, label: 'Email', lines: [CONTACT_EMAIL], href: `mailto:${CONTACT_EMAIL}` },
  { icon: Clock, label: 'Working Hours', lines: ['Open 24 hours, all days'] },
]

export const CONTACT_FORM = {
  heading: 'Send us a message',
  successHeading: 'Thank you!',
  successText: 'Your message has been sent. We’ll reply within 1 working day — please check your email.',
}

export default { CONTACT_INTRO, CONTACT_DETAILS, CONTACT_FORM }