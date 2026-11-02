// The checkout's gift hamper fields, mirroring giftFields in backend/src/modules/order/order.validation.js.
export const GIFT_MESSAGE_MAX_LENGTH = 300
export const RECIPIENT_NAME_MAX_LENGTH = 80

export const EMPTY_GIFT_DETAILS = { recipientName: '', giftMessage: '', termsAccepted: false }

/** The gift fields as the place-order request wants them; empty text fields are left out. */
export const toGiftPayload = ({ recipientName, giftMessage, termsAccepted }) => ({
  termsAccepted,
  ...(recipientName.trim() ? { recipientName: recipientName.trim() } : {}),
  ...(giftMessage.trim() ? { giftMessage: giftMessage.trim() } : {}),
})

export default toGiftPayload