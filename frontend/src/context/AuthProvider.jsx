import { useCallback, useMemo, useState } from 'react'

import { AuthContext } from './authContext.js'

const EMPTY_SESSION = { user: null, accessToken: null }

/**
 * Holds the signed-in user and access token in memory only, as the backend intends: the refresh
 * token lives in an httpOnly cookie. Restoring the session after a reload (POST /auth/refresh)
 * is not built yet.
 */
function AuthProvider({ children }) {
  const [session, setSessionState] = useState(EMPTY_SESSION)

  const setSession = useCallback(({ user, accessToken }) => setSessionState({ user, accessToken }), [])
  const clearSession = useCallback(() => setSessionState(EMPTY_SESSION), [])

  const value = useMemo(() => ({ ...session, setSession, clearSession }), [session, setSession, clearSession])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider