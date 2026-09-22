import { API_BASE_URL } from '../config/environmentConfig.js'

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

/** Sends a JSON request and returns the response's `data`. Throws ApiRequestError on failure. */
export async function request(path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiRequestError('Could not reach the server. Check your connection and try again.')
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