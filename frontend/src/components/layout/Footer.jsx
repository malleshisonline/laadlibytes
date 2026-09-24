import { Link } from 'react-router'

import flowersBottomLeft from '../../assets/footer/footerflowerleft.avif'
import flowersBottomRight from '../../assets/footer/footerflower.avif'
import whiteLogo from '../../assets/footer/white_logo.avif'
import { APP_SETTINGS } from '../../constants/appSettings.js'
import GoldenDivider from '../common/GoldenDivider.jsx'

const QUICK_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'About Us', path: '/about' },
  { label: 'Shop', path: '/shop' },
  { label: 'Categories', path: '/categories' },
  { label: '56 Bhog', path: '/56-bhog' },
  { label: 'Contact', path: '/contact' },
]

const CUSTOMER_CARE_LINKS = [
  { label: 'Track Order', path: '/track-order' },
  { label: 'Return Policy', path: '/return-policy' },
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

// Real profile URLs are not known yet, so every link points to "#" for now.
const SOCIAL_LINKS = [
  {
    label: 'Instagram',
    href: '#',
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
    href: '#',
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
    label: 'WhatsApp',
    href: '#',
    icon: (
      <SocialIcon>
        <path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6z" />
        <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1a4 4 0 0 1-2-2l1-1-1-2z" />
      </SocialIcon>
    ),
  },
]

function FooterLinkColumn({ title, links }) {
  return (
    <div>
      <h2 className="mb-4 font-display text-white text-lg">{title}</h2>
      <ul className="space-y-2 text-sm">
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

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
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
            <p className="font-display text-sm text-lightblue-100 md:text-base">Made with Devotion, Shared with Love</p>
            <GoldenDivider className="mt-2 text-caramel-500 md:mx-0" />
          </div>

          <p className="mt-4 max-w-xs text-sm">
            Traditional chikkis and wholesome bites, made with love from Vrindavan.
          </p>
        </div>

        <FooterLinkColumn title="Quick Links" links={QUICK_LINKS} />
        <FooterLinkColumn title="Customer Care" links={CUSTOMER_CARE_LINKS} />

        {/* Social icons and newsletter */}
        <div>
          <h2 className="mb-4 font-display text-white text-lg">Connect With Us</h2>
          <ul className="flex gap-3">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  aria-label={social.label}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-white/40 transition hover:bg-white hover:text-navy-800"
                >
                  {social.icon}
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-6 mb-3 text-sm">Subscribe for new updates</p>
          <form onSubmit={handleSubscribe} className="flex max-w-sm gap-2">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              autoComplete="email"
              placeholder="Your email address"
              className="min-h-11 min-w-0 flex-1 rounded-full bg-white px-4 text-sm text-body placeholder:text-muted focus:ring-2 focus:ring-caramel-500 focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-11 shrink-0 rounded-full bg-caramel-500 px-5 text-sm font-semibold text-white transition hover:bg-white hover:text-navy-800"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 border-t border-white/20">
        <p className="mx-auto max-w-7xl px-4 py-4 text-center text-xs sm:px-6">
          © {new Date().getFullYear()} {APP_SETTINGS.SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer