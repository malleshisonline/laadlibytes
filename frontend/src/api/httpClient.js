import { API_BASE_URL } from '../config/environmentConfig.js'
import { API_ENDPOINTS } from '../constants/apiEndpoints.js'

/**
 * Thrown for any failed request. `fieldErrors` maps a form field to its message, e.g.
 * the backend's { field: 'body.name', message } becomes { name: message }.
 */
export class ApiRequestError extends Error {
  constructor(message, { status = 0, code, fieldErrors = {} } = {}) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

function toFieldErrors(errors) {
  if (!Array.isArray(errors)) return {}
  return errors.reduce((fieldErrors, { field, message }) => {
    const name = String(field ?? '').replace(/^(body|params|query)\./, '')
    if (name && !fieldErrors[name]) fieldErrors[name] = message
    return fieldErrors
  }, {})
}

// The access token lives here, in memory only (AuthProvider keeps it in sync); the refresh token is an
// httpOnly cookie the browser sends by itself.
let accessToken = null
let refreshInFlight = null
let handleSessionExpired = () => {}

// Auth endpoints answer 401 for wrong credentials or a dead refresh token, so never refresh-and-retry them.
const { AUTH } = API_ENDPOINTS
const NO_REFRESH_PATHS = [AUTH.IDENTIFY, AUTH.REGISTER, AUTH.LOGIN, AUTH.LOGIN_OTP, AUTH.OTP_VERIFY, AUTH.OTP_RESEND, AUTH.REFRESH]

export function setAccessToken(token) {
  accessToken = token ?? null
}

/** AuthProvider registers what to do when the refresh token itself is no longer accepted. */
export function onSessionExpired(callback) {
  handleSessionExpired = callback
}

async function send(path, { method, body }) {
  // FormData (the admin image uploads) goes as it is: the browser sets the multipart boundary itself.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData
  const headers = {}
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  let requestBody
  if (isFormData) requestBody = body
  else if (body !== undefined) requestBody = JSON.stringify(body)

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers,
      body: requestBody,
    })
  } catch {
    throw new ApiRequestError('Could not reach the server. Check your connection and try again.')
  }
}

// Name of the cross-tab lock that serialises refreshes (Web Locks API).
const REFRESH_LOCK_NAME = 'laadli-auth-refresh'

/**
 * Runs `task` while holding a lock shared by every tab of this site. Opening the browser can restore several
 * tabs at once; without the lock they would all present the same refresh cookie, the first would rotate it, and
 * the rest would get 401 and sign the user out. With it, each tab waits and then presents the rotated cookie.
 */
function withRefreshLock(task) {
  if (typeof navigator === 'undefined' || !navigator.locks) return task()
  return navigator.locks.request(REFRESH_LOCK_NAME, task)
}

/**
 * Trades the refresh cookie for a new access token. Concurrent callers share one request: the backend
 * rotates the refresh token on every call, so a second parallel refresh would present a revoked token.
 * Across tabs the same guarantee comes from withRefreshLock.
 */
export function refreshAccessToken() {
  refreshInFlight ??= withRefreshLock(() => request(API_ENDPOINTS.AUTH.REFRESH, { method: 'POST', body: {} }))
    .then((data) => {
      setAccessToken(data.accessToken)
      return data.accessToken
    })
    .finally(() => {
      refreshInFlight = null
    })
  return refreshInFlight
}

/**
 * Sends a JSON request and returns the response's `data` (or `{ data, meta }` with `withMeta`, for paginated
 * lists). Throws ApiRequestError on failure. A 401 on a normal endpoint means the access token expired: refresh
 * once and retry, and only if the refresh fails is the session over.
 */
export async function request(path, { method = 'GET', body, withMeta = false } = {}) {
  let response = await send(path, { method, body })

  if (response.status === 401 && !NO_REFRESH_PATHS.includes(path)) {
    try {
      await refreshAccessToken()
    } catch (refreshError) {
      // Only a 401 means the refresh token itself is dead. A 429, a 5xx or an unreachable backend (e.g. still
      // starting) fails just this request; the session stays so the next request can refresh normally.
      if (refreshError.status === 401) {
        setAccessToken(null)
        handleSessionExpired()
      }
      throw refreshError
    }
    response = await send(path, { method, body })
  }

  // 204 No Content (e.g. an admin delete) has no body to read.
  if (response.status === 204) return withMeta ? { data: null, meta: undefined } : null

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new ApiRequestError(payload?.message || 'Something went wrong. Please try again.', {
      status: response.status,
      code: payload?.code,
      fieldErrors: toFieldErrors(payload?.errors),
    })
  }

  return withMeta ? { data: payload.data, meta: payload.meta } : payload.data
}

export const httpClient = {
  get: (path) => request(path),
  getWithMeta: (path) => request(path, { withMeta: true }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

export default httpClient