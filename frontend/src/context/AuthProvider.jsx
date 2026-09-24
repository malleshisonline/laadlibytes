import { useCallback, useEffect, useMemo, useState } from 'react'

import { authApi } from '../api/authApi.js'
import { onSessionExpired, setAccessToken } from '../api/httpClient.js'
import { clearSessionHint, hasSessionHint, setSessionHint } from '../utils/sessionHint.js'

import { AuthContext } from './authContext.js'

// Page-load restore: tries while the backend is unreachable or erroring (e.g. still connecting to MongoDB after a
// restart), waiting 1s, 2s, 3s between attempts — about 6s in all before giving up.
const RESTORE_ATTEMPTS = 4

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

/**
 * Holds the signed-in user. The access token stays in memory inside httpClient (which attaches it and
 * refreshes it on a 401); the refresh token is an httpOnly cookie. On load the session is restored from
 * that cookie, so a reload or an expired access token never signs the user out while the refresh token
 * is still valid.
 */
function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isRestoringSession, setIsRestoringSession] = useState(true)

  const setSession = useCallback(({ user: signedInUser, accessToken }) => {
    setAccessToken(accessToken)
    setSessionHint() // login / OTP verify: remember this browser has a session to restore
    setUser(signedInUser)
  }, [])

  // Also runs on logout and when a refresh is rejected with 401 (see onSessionExpired below).
  const clearSession = useCallback(() => {
    setAccessToken(null)
    clearSessionHint()
    setUser(null)
  }, [])

  /** Revokes this device's refresh token on the server, then forgets the session locally either way. */
  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Already expired or offline: there is nothing left to revoke that we can reach.
    } finally {
      clearSession()
    }
  }, [clearSession])

  // Refresh token rejected mid-session (expired or revoked): only then is the user signed out.
  useEffect(() => {
    onSessionExpired(clearSession)
    return () => onSessionExpired(() => {})
  }, [clearSession])

  // Restore the session from the refresh cookie. StrictMode runs this twice in dev; refreshAccessToken
  // shares one in-flight request, so the rotating refresh token is only presented once.
  useEffect(() => {
    let isCancelled = false

    async function restoreSession() {
      // Never signed in on this browser, or logged out: there is no cookie to trade, so don't ask the backend.
      if (!hasSessionHint()) {
        setIsRestoringSession(false)
        return
      }

      for (let attempt = 1; attempt <= RESTORE_ATTEMPTS; attempt++) {
        try {
          await authApi.refresh()
          const currentUser = await authApi.getMe()
          if (!isCancelled) setUser(currentUser)
          break
        } catch (error) {
          if (isCancelled) return
          // Cookie missing, expired or revoked: a guest now, and no refresh on the next reload.
          if (error.status === 401) {
            setAccessToken(null)
            clearSessionHint()
            break
          }
          // Rate-limited: retrying won't help, but the session may still be valid, so keep the hint.
          if (error.status === 429) break
          // Unreachable or 5xx (backend starting up): wait a little longer each time and try again.
          if (attempt < RESTORE_ATTEMPTS) await wait(attempt * 1000)
        }
      }

      if (!isCancelled) setIsRestoringSession(false)
    }

    restoreSession()
    return () => {
      isCancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({ user, isRestoringSession, setSession, clearSession, logout }),
    [user, isRestoringSession, setSession, clearSession, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider