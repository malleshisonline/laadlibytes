import { useState } from 'react'
import { LoaderCircle, MapPinCheck } from 'lucide-react'

import { INDIAN_STATES } from '../../constants/indianStates.js'
import { accountErrorMessage } from '../../utils/accountErrorMessage.js'
import { EMPTY_ADDRESS, localMobileDigits, toAddressPayload, validateAddress } from '../../utils/addressValidation.js'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import FormField from '../ui/FormField.jsx'

const REQUIRED_MARK = <span className="text-error">*</span>

// `wide` fields span both columns from sm.
const FIELDS = [
  { id: 'name', label: <>Full name {REQUIRED_MARK}</>, type: 'text', autoComplete: 'name', maxLength: 60 },
  {
    id: 'phone',
    label: <>Mobile number {REQUIRED_MARK}</>,
    type: 'tel',
    inputMode: 'numeric',
    autoComplete: 'tel-national',
    placeholder: '10-digit mobile number',
    maxLength: 16,
  },
  {
    id: 'line1',
    label: <>Flat, house no., building, street {REQUIRED_MARK}</>,
    type: 'text',
    autoComplete: 'address-line1',
    maxLength: 120,
    wide: true,
  },
  { id: 'line2', label: 'Area, locality (optional)', type: 'text', autoComplete: 'address-line2', maxLength: 120, wide: true },
  { id: 'landmark', label: 'Landmark (optional)', type: 'text', placeholder: 'E.g. near Apollo Hospital', maxLength: 80 },
  {
    id: 'pincode',
    label: <>PIN code {REQUIRED_MARK}</>,
    type: 'text',
    inputMode: 'numeric',
    autoComplete: 'postal-code',
    placeholder: '6 digits',
    maxLength: 6,
  },
  { id: 'city', label: <>City / town {REQUIRED_MARK}</>, type: 'text', autoComplete: 'address-level2', maxLength: 60 },
]

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Form values for an existing address, or a new one pre-filled with `defaults` (e.g. the user's name). */
function initialFormValues(initialValues, defaults) {
  const source = { ...EMPTY_ADDRESS, ...defaults, ...initialValues }
  return {
    ...Object.fromEntries(
      Object.keys(EMPTY_ADDRESS).map((key) => [key, key === 'phone' ? localMobileDigits(source.phone) : (source[key] ?? '')]),
    ),
    email: source.email ?? '',
  }
}

/**
 * Add / edit a delivery address. Used in My Account and at checkout. `onSubmit` receives the trimmed
 * payload and should throw the ApiRequestError on failure, so field errors from the backend land on their fields.
 * `withEmail` adds an optional email field (guest checkout, where there is no account email); the payload then
 * carries `email` too, or '' when left empty.
 */
function AddressForm({ initialValues, defaults, onSubmit, onCancel, submitLabel = 'Save address', withEmail = false }) {
  const [values, setValues] = useState(() => initialFormValues(initialValues, defaults))
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const errors = validateAddress(values)
    const email = values.email.trim()
    if (withEmail && email && !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address'
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = toAddressPayload(values)
      await onSubmit(withEmail ? { ...payload, email: email.toLowerCase() } : payload)
    } catch (requestError) {
      const serverFieldErrors = requestError.fieldErrors ?? {}
      setFieldErrors(serverFieldErrors)
      setFormError(Object.keys(serverFieldErrors).length ? '' : accountErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    // A raised card: a solid cream ledge under it plus a soft navy shadow give the 3D look.
    <form
      onSubmit={handleSubmit}
      noValidate
      className="max-w-2xl rounded-2xl border border-cream-200 border-t-4 border-t-caramel-500 bg-linear-to-b from-surface to-cream-50 p-4 shadow-[0_5px_0_var(--color-cream-200),0_16px_28px_-16px_rgb(0_38_74/0.45)] transition-shadow focus-within:shadow-[0_5px_0_var(--color-cream-200),0_18px_34px_-14px_rgb(0_38_74/0.55)] sm:p-5"
    >
      <FormAlert>{formError}</FormAlert>

      {/* grid-cols-1 so the State select, as wide as its longest option, cannot widen the form on a phone. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-4">
        {FIELDS.map(({ id, wide, ...field }) => (
          <div key={id} className={`min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
            <FormField compact id={id} {...field} value={values[id]} onChange={handleChange} error={fieldErrors[id]} />
          </div>
        ))}

        <FormField
          compact
          id="state"
          as="select"
          label={<>State {REQUIRED_MARK}</>}
          autoComplete="address-level1"
          value={values.state}
          onChange={handleChange}
          error={fieldErrors.state}
        >
          <option value="" disabled>
            Choose a state
          </option>
          {INDIAN_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </FormField>

        {withEmail && (
          <div className="min-w-0 sm:col-span-2">
            <FormField
              compact
              id="email"
              label="Email (optional, for your order updates)"
              type="email"
              autoComplete="email"
              maxLength={254}
              value={values.email}
              onChange={handleChange}
              error={fieldErrors.email}
            />
          </div>
        )}
      </div>

      {/* Full-width, stacked buttons on a phone; side by side and sized to their label from sm. */}
      <div className="mt-5 flex flex-col gap-2.5 border-t border-cream-200 pt-4 sm:flex-row sm:items-center sm:gap-3">
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center gap-2 text-sm whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 active:translate-y-px sm:w-auto sm:min-w-44 sm:px-6"
        >
          {isSubmitting ? (
            <LoaderCircle size={16} strokeWidth={2} aria-hidden="true" className="animate-spin" />
          ) : (
            <MapPinCheck size={16} strokeWidth={2} aria-hidden="true" />
          )}
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-h-11 text-sm whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 active:translate-y-px sm:w-auto sm:min-w-28 sm:px-6"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

export default AddressForm