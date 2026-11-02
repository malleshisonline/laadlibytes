import { CircleCheck } from 'lucide-react'
import { useState } from 'react'

import { enquiryApi } from '../../api/enquiryApi.js'
import { useAuth } from '../../hooks/useAuth.js'
import { localMobileDigits } from '../../utils/addressValidation.js'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import FormField from '../ui/FormField.jsx'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_PATTERN = /^[6-9]\d{9}$/

// Mirrors createEnquirySchema (type 'bulk') in backend/src/modules/enquiry/enquiry.validation.js; the backend decides.
function validateBulkEnquiry({ name, email, phone, company, quantity, message }) {
  const errors = {}
  const trimmedName = name.trim()

  if (trimmedName.length < 2) errors.name = 'Name must be at least 2 characters'
  else if (trimmedName.length > 60) errors.name = 'Name must be at most 60 characters'

  if (!email.trim()) errors.email = 'Email is required'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address'

  if (!phone.trim()) errors.phone = 'Mobile number is required'
  else if (!MOBILE_PATTERN.test(localMobileDigits(phone))) errors.phone = 'Enter a valid 10-digit mobile number'

  if (company.trim().length > 120) errors.company = 'Company must be at most 120 characters'

  if (quantity.trim() && !(Number.isInteger(Number(quantity)) && Number(quantity) >= 1)) {
    errors.quantity = 'Enter the number of boxes, e.g. 100'
  }

  if (message.trim().length < 10) errors.message = 'Tell us a little more (at least 10 characters)'
  else if (message.trim().length > 2000) errors.message = 'Message must be at most 2000 characters'

  return errors
}

const REQUIRED_MARK = <span className='text-error'>*</span>

const EMPTY_FORM = { name: '', email: '', phone: '', company: '', quantity: '', message: '' }

/**
 * Bulk and corporate gift orders, and custom hampers: a quote request, not a cart order. Sent to POST /enquiries
 * with `type: 'bulk'`; the shop is emailed and the sender gets an auto-reply. `hampers` fill the "Which hamper"
 * choice; `defaultHamperId` preselects one (from a hamper's page).
 */
function BulkEnquiryForm({ hampers = [], defaultHamperId = '' }) {
  const { user } = useAuth()

  // Only what the visitor typed; a signed-in user's name, email and phone fill the gaps until they edit them.
  const [edits, setEdits] = useState({})
  const [website, setWebsite] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const form = {
    ...EMPTY_FORM,
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    hamper: defaultHamperId,
    ...edits,
  }

  function handleChange(event) {
    const { name, value } = event.target
    setEdits((previous) => ({ ...previous, [name]: value }))
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const errors = validateBulkEnquiry(form)
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      await enquiryApi.send({
        type: 'bulk',
        name: form.name.trim(),
        email: form.email.trim(),
        phone: localMobileDigits(form.phone),
        message: form.message.trim(),
        ...(form.company.trim() ? { company: form.company.trim() } : {}),
        ...(form.hamper ? { hamper: form.hamper } : {}),
        ...(form.quantity.trim() ? { quantity: Number(form.quantity) } : {}),
        ...(website ? { website } : {}),
      })
      setEdits({})
      setFieldErrors({})
      setIsSent(true)
    } catch (requestError) {
      const serverFieldErrors = requestError.fieldErrors ?? {}
      setFieldErrors(serverFieldErrors)
      setFormError(Object.keys(serverFieldErrors).length ? '' : requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSent) {
    return (
      <div role='status' className='flex flex-col items-center py-8 text-center'>
        <CircleCheck size={48} strokeWidth={1.75} className='text-success' aria-hidden='true' />
        <h3 className='mt-4 text-xl font-semibold text-navy-800'>Thank you, we’ve got your request</h3>
        <p className='mt-2 max-w-sm text-body'>
          Our team will call or email you with a quote. A copy of your request is on its way to your inbox.
        </p>
        <Button variant='outline' className='mt-6 max-w-xs' onClick={() => setIsSent(false)}>
          Send another request
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className='relative space-y-4'>
      <FormAlert>{formError}</FormAlert>

      <div className='grid gap-4 sm:grid-cols-2'>
        <FormField
          id='name'
          label={<>Name {REQUIRED_MARK}</>}
          autoComplete='name'
          maxLength={60}
          value={form.name}
          onChange={handleChange}
          error={fieldErrors.name}
        />
        <FormField
          id='company'
          label='Company'
          autoComplete='organization'
          maxLength={120}
          value={form.company}
          onChange={handleChange}
          error={fieldErrors.company}
        />
        <FormField
          id='email'
          label={<>Email {REQUIRED_MARK}</>}
          type='email'
          autoComplete='email'
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
        />
        <FormField
          id='phone'
          label={<>Mobile number {REQUIRED_MARK}</>}
          type='tel'
          inputMode='tel'
          autoComplete='tel'
          value={form.phone}
          onChange={handleChange}
          error={fieldErrors.phone}
        />
        <div>
          <label htmlFor='hamper' className='mb-1.5 block text-sm font-semibold text-navy-800'>
            Which hamper
          </label>
          <select
            id='hamper'
            name='hamper'
            value={form.hamper}
            onChange={handleChange}
            className='w-full rounded-xl border border-slate-300 bg-white px-2 py-2 text-body transition focus:border-navy-800 focus:ring-2 focus:ring-navy-800/25 focus:outline-none'
          >
            <option value=''>A mix, or a custom hamper</option>
            {hampers.map((hamper) => (
              <option key={hamper.id} value={hamper.id}>
                {hamper.name}
              </option>
            ))}
          </select>
        </div>
        <FormField
          id='quantity'
          label='Number of boxes'
          type='number'
          inputMode='numeric'
          min={1}
          placeholder='e.g. 100'
          value={form.quantity}
          onChange={handleChange}
          error={fieldErrors.quantity}
        />
      </div>

      <FormField
        id='message'
        label={<>Tell us about your order {REQUIRED_MARK}</>}
        as='textarea'
        rows={4}
        maxLength={2000}
        placeholder='The occasion, the date you need them by, the delivery city, a logo or message card…'
        value={form.message}
        onChange={handleChange}
        error={fieldErrors.message}
      />

      {/* Honeypot: off-screen and skipped by keyboard and screen readers, so only bots fill it in. */}
      <div aria-hidden='true' className='absolute -left-2500 h-px w-px overflow-hidden'>
        <label htmlFor='bulk-website'>Website</label>
        <input
          id='bulk-website'
          name='website'
          type='text'
          tabIndex={-1}
          autoComplete='off'
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <Button type='submit' isLoading={isSubmitting} loadingText='Sending…' className='sm:max-w-xs'>
        Request a quote
      </Button>
    </form>
  )
}

export { BulkEnquiryForm }
export default BulkEnquiryForm