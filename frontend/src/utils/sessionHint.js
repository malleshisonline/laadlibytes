// A note in localStorage meaning "someone signed in on this browser". Not a token and no personal data: the real
// proof is the httpOnly refresh cookie, which JavaScript cannot read. It only lets AuthProvider skip the
// POST /auth/refresh on page load for visitors who have never signed in (or have logged out), which would
// otherwise fail with 401 on every reload and count against the backend's auth rate limit.
const SESSION_HINT_KEY = 'laadli.hasSession'

export function hasSessionHint() {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1'
  } catch {
    return true // storage blocked: behave as before and try the refresh
  }
}

export function setSessionHint() {
  try {
    localStorage.setItem(SESSION_HINT_KEY, '1')
  } catch {
    // storage blocked: nothing to remember
  }
}

export function clearSessionHint() {
  try {
    localStorage.removeItem(SESSION_HINT_KEY)
  } catch {
    // storage blocked: nothing to forget
  }
}

export default hasSessionHint