import { Link } from 'react-router'
import { MapPin } from 'lucide-react'

import flowersBottomLeft from '../../assets/footer/footerflowerleft.avif'
import flowersBottomRight from '../../assets/footer/footerflower.avif'
import whiteLogo from '../../assets/footer/white_logo.avif'
import { APP_SETTINGS } from '../../constants/appSettings.js'
import { CONTACT_DETAILS } from '../../content/contactDetails.js'
import GoldenDivider from '../common/GoldenDivider.jsx'

// The same office address as the Contact page, so the two never drift apart.
const OFFICE_ADDRESS_LINES = CONTACT_DETAILS.find((detail) => detail.icon === MapPin)?.lines ?? []

const QUICK_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'About Us', path: '/about' },
  { label: 'Shop', path: '/products' },
  { label: 'Contact', path: '/contact' },
]

const CUSTOMER_CARE_LINKS = [
  { label: 'Privacy Policy', path: '/privacy-policy' },
  { label: 'Terms & Conditions', path: '/terms' },
  { label: 'FAQs', path: '/faq' },
]

// Brand icons are not in lucide-react, so they are drawn here as simple outline SVGs.
function SocialIcon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// YouTube has no channel yet, so it points to "#" for now.
const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/laadlibytes',
    icon: (
      <SocialIcon>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </SocialIcon>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61595361946524&sk=about',
    icon: (
      <SocialIcon>
        <path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z" />
      </SocialIcon>
    ),
  },
  {
    label: 'YouTube',
    href: '#',
    icon: (
      <SocialIcon>
        <rect x="2" y="5" width="20" height="14" rx="4" />
        <path d="m10 9 5 3-5 3z" />
      </SocialIcon>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/laadlibytes/',
    icon: (
      <SocialIcon>
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M8 10v7" />
        <circle cx="8" cy="7" r="0.5" fill="currentColor" />
        <path d="M12 17v-7" />
        <path d="M12 13a3 3 0 0 1 6 0v4" />
      </SocialIcon>
    ),
  },
  {
    label: 'Twitter',
    href: 'https://x.com/Laadlibytes',
    icon: (
      <SocialIcon>
        <path d="M4 4h4.5L20 20h-4.5z" />
        <path d="M20 4l-6.6 7.4M4 20l6.6-7.4" />
      </SocialIcon>
    ),
  },
]

function FooterLinkColumn({ title, links }) {
  return (
    <div>
      <h2 className="mb-4 font-display text-white text-lg lg:text-xl">{title}</h2>
      <ul className="space-y-2 text-sm lg:space-y-2.5 lg:text-base">
        {links.map((link) => (
          <li key={link.path}>
            <Link to={link.path} className="text-lightblue-100 transition hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Footer() {
  // No newsletter API yet: stop the page reload and do nothing else.
  function handleSubscribe(event) {
    event.preventDefault()
  }

  return (
    // site-footer sets the navy-800 background and light text; the top corners are rounded.
    <footer className="site-footer relative overflow-hidden rounded-t-3xl lg:rounded-t-4xl">
      {/* Flower decorations in the bottom corners, kept small on mobile so they never cover text */}
      <img
        src={flowersBottomLeft}
        alt=""
        aria-hidden="true"
        width="887"
        height="1774"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute bottom-0 left-0 w-12 select-none md:w-20 lg:w-28"
      />
      <img
        src={flowersBottomRight}
        alt=""
        aria-hidden="true"
        width="1295"
        height="1214"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute right-0 bottom-0 w-20 select-none md:w-32 lg:w-44"
      />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.4fr] lg:gap-8">
        {/* White logo, straight on the navy */}
        <div>
          <Link to="/" aria-label={`${APP_SETTINGS.SITE_NAME} home`} className="inline-block">
            <img
              src={whiteLogo}
              alt={APP_SETTINGS.SITE_NAME}
              width="1484"
              height="1060"
              loading="lazy"
              decoding="async"
              className="h-20 w-auto"
            />
          </Link>

          {/* Brand tagline with the golden ornament: centred on mobile, left-aligned from md */}
          <div className="mx-auto mt-3 max-w-60 text-center md:mx-0 md:text-left">
            <p className="font-display text-sm text-lightblue-100 md:text-base lg:text-lg">Made with Devotion, Shared with Love</p>
            <GoldenDivider className="mt-2 text-caramel-500 md:mx-0" />
          </div>

          <p className="mt-4 max-w-xs text-sm lg:text-base">
            Traditional chikkis and wholesome bites, made with love.
          </p>

          {OFFICE_ADDRESS_LINES.length > 0 && (
            <address className="mt-4 flex max-w-xs gap-2 text-sm leading-relaxed not-italic text-lightblue-100 lg:text-base">
              <MapPin size={18} strokeWidth={1.75} aria-hidden="true" className="mt-1 shrink-0 text-caramel-500" />
              <span>
                <span className="sr-only">Office address: </span>
                {OFFICE_ADDRESS_LINES.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </address>
          )}
        </div>

        <FooterLinkColumn title="Quick Links" links={QUICK_LINKS} />
        <FooterLinkColumn title="Customer Care" links={CUSTOMER_CARE_LINKS} />

        {/* Social icons and newsletter */}
        <div>
          <h2 className="mb-4 font-display text-white text-lg lg:text-xl">Connect With Us</h2>
          <ul className="flex flex-wrap gap-3">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  // Real profiles open in a new tab, so the shopper doesn't leave the store.
                  {...(social.href !== '#' && { target: '_blank', rel: 'noopener noreferrer' })}
                  aria-label={social.label}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-white/40 transition hover:bg-white hover:text-navy-800"
                >
                  {social.icon}
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-6 mb-3 text-sm lg:text-base">Subscribe for new updates</p>
          <form onSubmit={handleSubscribe} className="flex max-w-sm gap-2">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              autoComplete="email"
              placeholder="Your email address"
              className="min-h-11 min-w-0 flex-1 rounded-full bg-white px-4 text-sm text-body lg:text-base placeholder:text-muted focus:ring-2 focus:ring-caramel-500 focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-11 shrink-0 rounded-full bg-caramel-500 px-5 text-sm font-semibold lg:text-base text-white transition hover:bg-white hover:text-navy-800"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-white/20">
        <p className="mx-auto max-w-7xl px-4 py-4 text-center text-xs sm:px-6 lg:text-sm">
          © {new Date().getFullYear()} {APP_SETTINGS.SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer