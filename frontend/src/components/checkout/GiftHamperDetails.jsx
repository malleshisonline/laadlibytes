import { Gift } from 'lucide-react'

import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { GIFT_MESSAGE_MAX_LENGTH, RECIPIENT_NAME_MAX_LENGTH } from '../../utils/giftDetails.js'
import FormField from '../ui/FormField.jsx'

/**
 * Shown on the Order Summary when the order has a gift hamper: who it is for, the message for the greeting
 * card, and the made-to-order / no-returns terms the shopper must accept before paying (the backend refuses
 * the order without them, TERMS_NOT_ACCEPTED). `leadTimeDays` is the longest lead time among the hampers.
 */
function GiftHamperDetails({ details, onChange, leadTimeDays, greetingCardLabel }) {
  function handleChange(event) {
    const { name, value, type, checked } = event.target
    onChange({ ...details, [name]: type === 'checkbox' ? checked : value })
  }

  return (
    <div className='space-y-4'>
      {leadTimeDays > 0 && (
        <p className='flex items-start gap-2 rounded-xl bg-cream-100 px-3 py-2.5 text-sm text-body'>
          <Gift size={18} strokeWidth={1.75} aria-hidden='true' className='mt-0.5 shrink-0 text-caramel-700' />
          <span>
            Gift hampers are made to order. Yours will be dispatched in about{' '}
            <span className='font-bold text-navy-800'>{leadTimeDays} days</span> after payment.
          </span>
        </p>
      )}

      <FormField
        id='recipientName'
        label='Gift for (optional)'
        compact
        autoComplete='off'
        maxLength={RECIPIENT_NAME_MAX_LENGTH}
        placeholder='Who is this gift for?'
        value={details.recipientName}
        onChange={handleChange}
      />

      <div>
        <FormField
          id='giftMessage'
          label={greetingCardLabel ? `Message for the ${greetingCardLabel} (optional)` : 'Gift message (optional)'}
          compact
          as='textarea'
          rows={3}
          maxLength={GIFT_MESSAGE_MAX_LENGTH}
          placeholder='Wishing you a joyful Diwali…'
          value={details.giftMessage}
          onChange={handleChange}
        />
        <p className='mt-1 text-right text-xs text-muted'>
          {details.giftMessage.length}/{GIFT_MESSAGE_MAX_LENGTH}
        </p>
      </div>

      <label className='flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 text-sm text-body'>
        <input
          type='checkbox'
          name='termsAccepted'
          checked={details.termsAccepted}
          onChange={handleChange}
          className='mt-0.5 size-5 shrink-0 accent-navy-800'
        />
        <span>
          I understand that gift hampers are made to order and are sold on a “No Return / Non-refundable” basis.{' '}
          <a
            href={APP_ROUTES.REFUND_POLICY}
            target='_blank'
            rel='noreferrer'
            className='font-semibold text-navy-700 underline'
          >
            Read the policy
          </a>
          <span className='text-error'> *</span>
        </span>
      </label>
    </div>
  )
}

export { GiftHamperDetails }
export default GiftHamperDetails