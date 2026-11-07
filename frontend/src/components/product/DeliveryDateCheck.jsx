import { useId, useState } from 'react'
import { MapPin } from 'lucide-react'

import { estimateDelivery, formatDeliveryDate, isValidPincode } from '../../utils/deliveryEstimate.js'

// Remembered per browser, so the next product page answers straight away.
const PINCODE_STORAGE_KEY = 'laadli.deliveryPincode'

function readSavedPincode() {
  try {
    return localStorage.getItem(PINCODE_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function savePincode(pincode) {
  try {
    localStorage.setItem(PINCODE_STORAGE_KEY, pincode)
  } catch {
    // Storage blocked (private window): the check still works, it just isn't remembered.
  }
}

/**
 * "Check delivery date" on a product or gift hamper page. The answer counts from today, as for an order paid
 * now; `leadTimeDays` is a made-to-order hamper's time before it ships. The rule is in utils/deliveryEstimate.js.
 */
function DeliveryDateCheck({ leadTimeDays = 0, className = '' }) {
  const inputId = useId()
  const [draft, setDraft] = useState(readSavedPincode)
  const [checked, setChecked] = useState(() => (isValidPincode(draft) ? draft : ''))
  const [error, setError] = useState('')
  const estimate = checked ? estimateDelivery(checked, leadTimeDays) : null

  function handleSubmit(event) {
    event.preventDefault()
    const pincode = draft.trim()
    if (!isValidPincode(pincode)) {
      setError('Enter a valid 6-digit pincode')
      setChecked('')
      return
    }
    setError('')
    setChecked(pincode)
    savePincode(pincode)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={className}>
      <label htmlFor={inputId} className='mb-1 flex items-center gap-1.5 text-sm font-semibold text-navy-800'>
        <MapPin size={16} strokeWidth={1.75} aria-hidden='true' className='text-caramel-700' />
        Check delivery date
      </label>
      <div className='flex gap-2'>
        <input
          id={inputId}
          type='text'
          inputMode='numeric'
          autoComplete='postal-code'
          maxLength={6}
          placeholder='Enter pincode'
          value={draft}
          onChange={(event) => setDraft(event.target.value.replace(/\D/g, ''))}
          aria-invalid={Boolean(error)}
          aria-describedby={`${inputId}-result`}
          className={`min-h-11 w-full min-w-0 rounded-lg border bg-surface px-3 text-sm text-body placeholder:text-muted focus:ring-2 focus:ring-lightblue-200 focus:outline-none ${
            error ? 'border-error' : 'border-line'
          }`}
        />
        <button
          type='submit'
          className='min-h-11 shrink-0 rounded-lg border border-navy-800 bg-surface px-4 text-sm font-semibold text-navy-800 transition hover:bg-lightblue-100'
        >
          Check
        </button>
      </div>
      <p id={`${inputId}-result`} aria-live='polite' className='mt-1.5 text-sm'>
        {error && <span className='text-error'>{error}</span>}
        {estimate && (
          <span className='text-body'>
            Order today, get it by{' '}
            <span className='font-bold text-navy-800'>{formatDeliveryDate(estimate.date)}</span>
            <span className='text-muted'>
              {' '}
              ({estimate.days} days{leadTimeDays > 0 ? `, including ${leadTimeDays} days to make` : ''})
            </span>
          </span>
        )}
      </p>
    </form>
  )
}

export { DeliveryDateCheck }
export default DeliveryDateCheck