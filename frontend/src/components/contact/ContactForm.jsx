import { CircleCheck } from 'lucide-react'
import { useState } from 'react'

import { enquiryApi } from '../../api/enquiryApi.js'
import { CONTACT_FORM } from '../../content/contactDetails.js'
import { useAuth } from '../../hooks/useAuth.js'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import FormField from '../ui/FormField.jsx'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Mirrors createEnquirySchema in backend/src/modules/enquiry/enquiry.validation.js; the backend still decides.
function validateContactForm({ name, email, message, subject }) {
  const errors = {}
  const trimmedName = name.trim()

  if (trimmedName.length < 2) errors.name = 'Name must be at least 2 characters'
  else if (trimmedName.length > 60) errors.name = 'Name must be at most 60 characters'

  if (!email.trim()) errors.email = 'Email is required'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address'

  if (message.trim().length < 10) errors.message = 'Message must be at least 10 characters'
  else if (message.trim().length > 2000) errors.message = 'Message must be at most 2000 characters'

  if (subject.trim().length > 150) errors.subject = 'Subject must be at most 150 characters'

  return errors
}

const REQUIRED_MARK = <span className="text-error">*</span>

const FIELDS = [
  { id: 'name', label: <>Name {REQUIRED_MARK}</>, type: 'text', autoComplete: 'name', maxLength: 60 },
  { id: 'email', label: <>Email {REQUIRED_MARK}</>, type: 'email', autoComplete: 'email' },
  { id: 'message', label: <>Message {REQUIRED_MARK}</>, as: 'textarea', rows: 4, maxLength: 2000 },
  { id: 'subject', label: 'Subject', type: 'text', maxLength: 150 },
]

/** Contact page form card. Sends to POST /enquiries; the shop is emailed and the sender gets an auto-reply. */
function ContactForm() {
  const { user } = useAuth()

  // Only what the visitor typed; a signed-in user's name and email fill the gaps until they edit them.
  const [edits, setEdits] = useState({})
  const [website, setWebsite] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const form = { name: user?.name ?? '', email: user?.email ?? '', message: '', subject: '', ...edits }

  function handleChange(event) {
    const { name, value } = event.target
    setEdits((previous) => ({ ...previous, [name]: value }))
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const errors = validateContactForm(form)
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      await enquiryApi.send({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
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

  return (
    <div className="relative rounded-2xl border border-line bg-surface p-6 shadow-lg shadow-navy-900/10 md:p-8">
      {isSent ? (
        <div role="status" className="flex flex-col items-center py-8 text-center">
          <CircleCheck size={48} strokeWidth={1.75} className="text-success" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-navy-800 md:text-2xl">{CONTACT_FORM.successHeading}</h2>
          <p className="mt-2 max-w-sm text-body">{CONTACT_FORM.successText}</p>
          <Button variant="outline" className="mt-6 max-w-xs" onClick={() => setIsSent(false)}>
            Send another message
          </Button>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-navy-800 md:text-2xl">{CONTACT_FORM.heading}</h2>

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <FormAlert>{formError}</FormAlert>

            {FIELDS.map(({ id, ...field }) => (
              <FormField
                key={id}
                id={id}
                {...field}
                value={form[id]}
                onChange={handleChange}
                error={fieldErrors[id]}
              />
            ))}

            {/* Honeypot: off-screen and skipped by keyboard and screen readers, so only bots fill it in. */}
            <div aria-hidden="true" className="absolute -left-2500 h-px w-px overflow-hidden">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </div>

            <Button type="submit" isLoading={isSubmitting} loadingText="Sending…" className="mt-2">
              Send Message
            </Button>
          </form>
        </>
      )}
    </div>
  )
}

export default ContactForm