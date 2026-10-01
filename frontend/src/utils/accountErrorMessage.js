const GENERIC_ACCOUNT_ERROR = 'Something went wrong. Please try again.'

// Backend codes whose own message is already written for the shopper.
const SHOPPER_MESSAGE_CODES = ['ADDRESS_LIMIT', 'INVALID_CURRENT_PASSWORD']

const ACCOUNT_ERROR_MESSAGES = {
  ADDRESS_NOT_FOUND: 'This address no longer exists. Refresh the page and try again.',
}

/** Turns an ApiRequestError from the account pages into something a shopper can act on. */
export function accountErrorMessage(error) {
  if (SHOPPER_MESSAGE_CODES.includes(error.code)) return error.message
  if (ACCOUNT_ERROR_MESSAGES[error.code]) return ACCOUNT_ERROR_MESSAGES[error.code]
  if (error.status === 0) return 'We couldn’t reach the store. Check your internet connection and try again.'
  if (error.status === 429) return 'Too many tries in a short time. Please wait a moment and try again.'
  // 4xx messages from the backend are written for people; 5xx ones are not.
  if (error.status >= 400 && error.status < 500 && error.message) return error.message
  return GENERIC_ACCOUNT_ERROR
}

export default accountErrorMessage