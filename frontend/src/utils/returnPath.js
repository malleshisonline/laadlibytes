import { APP_ROUTES } from '../constants/appRoutepoints.js'

/**
 * Where to go once sign-in finishes. A page that sends the shopper to sign in (e.g. the cart's checkout button)
 * puts `returnTo` in the router state; each sign-in step passes it along. Only same-site paths are accepted.
 */
export function returnPathFrom(state) {
  const path = state?.returnTo
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : APP_ROUTES.HOME
}

export default returnPathFrom