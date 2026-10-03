import { Navigate, Outlet, useLocation } from 'react-router'
import { LoaderCircle } from 'lucide-react'

import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { useAuth } from '../../hooks/useAuth.js'

/**
 * Wraps routes that need a signed-in user. A guest is sent to sign in and, through returnTo, brought
 * back to the page they asked for. Waits for the session restore first, so a reload never bounces a
 * signed-in user to the sign-in page. The query string comes back too (e.g. Buy Now's ?buyNow=…).
 */
function RequireAuth() {
  const { user, isRestoringSession } = useAuth()
  const location = useLocation()

  if (isRestoringSession) {
    return (
      <div role="status" className="flex min-h-[50vh] items-center justify-center text-navy-800">
        <LoaderCircle size={32} strokeWidth={1.75} className="animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading your account…</span>
      </div>
    )
  }

  if (!user) return <Navigate to={APP_ROUTES.IDENTIFY} state={{ returnTo: `${location.pathname}${location.search}` }} replace />

  return <Outlet />
}

export default RequireAuth