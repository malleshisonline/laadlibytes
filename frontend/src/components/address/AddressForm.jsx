import { useState } from 'react'

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

/** Form values for an existing address, or a new one pre-filled with `defaults` (e.g. the user's name). */
function initialFormValues(initialValues, defaults) {
  const source = { ...EMPTY_ADDRESS, ...defaults, ...initialValues }
  return Object.fromEntries(
    Object.keys(EMPTY_ADDRESS).map((key) => [key, key === 'phone' ? localMobileDigits(source.phone) : (source[key] ?? '')]),
  )
}

/**
 * Add / edit a delivery address. Used in My Account and, later, at checkout. `onSubmit` receives the trimmed
 * payload and should throw the ApiRequestError on failure, so field errors from the backend land on their fields.
 */
function AddressForm({ initialValues, defaults, onSubmit, onCancel, submitLabel = 'Save address' }) {
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
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(toAddressPayload(values))
    } catch (requestError) {
      const serverFieldErrors = requestError.fieldErrors ?? {}
      setFieldErrors(serverFieldErrors)
      setFormError(Object.keys(serverFieldErrors).length ? '' : accountErrorMessage(requestError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormAlert>{formError}</FormAlert>

      {/* grid-cols-1 so the State select, as wide as its longest option, cannot widen the form on a phone. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map(({ id, wide, ...field }) => (
          <div key={id} className={`min-w-0 ${wide ? 'sm:col-span-2' : ''}`}>
            <FormField id={id} {...field} value={values[id]} onChange={handleChange} error={fieldErrors[id]} />
          </div>
        ))}

        <FormField
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
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button type="submit" isLoading={isSubmitting} loadingText="Saving…" className="sm:max-w-48">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting} className="sm:max-w-36">
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

export default AddressForm