import { Link, Outlet } from 'react-router'

import logo from '../assets/brand/logo.svg'
import mascot from '../assets/illustrations/mascot-waving-with-flute.avif'
import GoldenDivider from '../components/common/GoldenDivider.jsx'
import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { APP_SETTINGS } from '../constants/appSettings.js'

// Shell for identify / login / register / verify-otp: no navbar or footer, just the logo and a card.
function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex justify-start px-4 pt-4 sm:px-8 sm:pt-6">
        <Link to={APP_ROUTES.HOME} aria-label={`${APP_SETTINGS.SITE_NAME} home`} className="inline-block">
          <img src={logo} alt={APP_SETTINGS.SITE_NAME} className="h-14 w-auto sm:h-16" />
        </Link>
      </header>

      {/* pt leaves room for the mascot that rises above the card. */}
      <main className="flex flex-1 flex-col items-center px-4 pt-10 pb-10">
        <div className="relative w-full max-w-104">
          {/* Peeks over the top edge: the card below is stacked above it, so its lower half is hidden. */}
          <img
            src={mascot}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-full left-1/2 h-32 w-auto -translate-x-1/2 translate-y-12 select-none sm:h-36"
          />

          <div className="relative z-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <Outlet />
          </div>
        </div>

        {/* Brand tagline with the golden ornament */}
        <div className="mt-4 w-full max-w-104 text-center">
          <p className="font-display text-sm text-body md:text-base">Made with Devotion, Shared with Love</p>
          <GoldenDivider className="mt-3 text-caramel-500" />
        </div>
      </main>

      <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} {APP_SETTINGS.SITE_NAME} · {APP_SETTINGS.SITE_DOMAIN} · All rights reserved.
      </footer>
    </div>
  )
}

export default AuthLayout