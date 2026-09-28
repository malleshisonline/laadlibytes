
const SESSION_HINT_KEY = 'laadli.hasSession'

export function hasSessionHint() {
  try {
    return localStorage.getItem(SESSION_HINT_KEY) === '1'
  } catch {
    return true 
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