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
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiRequestError('Could not reach the server. Check your connection and try again.')
  }
}

/**
 * Trades the refresh cookie for a new access token. Concurrent callers share one request: the backend
 * rotates the refresh token on every call, so a second parallel refresh would present a revoked token.
 */
export function refreshAccessToken() {
  refreshInFlight ??= request(API_ENDPOINTS.AUTH.REFRESH, { method: 'POST', body: {} })
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
 * Sends a JSON request and returns the response's `data`. Throws ApiRequestError on failure. A 401 on
 * a normal endpoint means the access token expired: refresh once and retry, and only if the refresh
 * fails is the session over.
 */
export async function request(path, { method = 'GET', body } = {}) {
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

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new ApiRequestError(payload?.message || 'Something went wrong. Please try again.', {
      status: response.status,
      code: payload?.code,
      fieldErrors: toFieldErrors(payload?.errors),
    })
  }

  return payload.data
}

export const httpClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
}

export default httpClient