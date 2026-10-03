import { Navigate, Outlet, useLocation } from 'react-router'
import { LoaderCircle } from 'lucide-react'

import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { useAuth } from '../../hooks/useAuth.js'

/**
 * Wraps the admin panel. Like RequireAuth it waits for the session restore and sends a guest to sign in (and
 * back); a signed-in customer is sent to the home page. This only hides the screens: every /admin API call is
 * checked for the admin role by the backend as well.
 */
function RequireAdmin() {
  const { user, isRestoringSession } = useAuth()
  const location = useLocation()

  if (isRestoringSession) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center text-navy-800">
        <LoaderCircle size={32} strokeWidth={1.75} className="animate-spin" aria-hidden="true" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  if (!user) return <Navigate to={APP_ROUTES.IDENTIFY} state={{ returnTo: `${location.pathname}${location.search}` }} replace />
  if (user.role !== 'admin') return <Navigate to={APP_ROUTES.HOME} replace />

  return <Outlet />
}

export default RequireAdmin