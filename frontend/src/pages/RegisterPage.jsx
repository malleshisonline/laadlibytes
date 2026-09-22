import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'

import { authApi } from '../api/authApi.js'
import AuthHeading from '../components/auth/AuthHeading.jsx'
import IdentifierSummary from '../components/auth/IdentifierSummary.jsx'
import Button from '../components/ui/Button.jsx'
import FormAlert from '../components/ui/FormAlert.jsx'
import FormField from '../components/ui/FormField.jsx'
import { APP_ROUTES } from '../constants/appRoutepoints.js'

const EMPTY_FORM = { name: '', password: '', confirmPassword: '' }

// Mirrors registerSchema in backend/src/modules/auth/auth.validation.js; the backend still decides.
function validateRegisterForm({ name, password, confirmPassword }) {
  const errors = {}
  const trimmedName = name.trim()

  if (trimmedName.length < 2) errors.name = 'Name must be at least 2 characters'
  else if (trimmedName.length > 60) errors.name = 'Name must be at most 60 characters'

  if (password.length < 8) errors.password = 'Password must be at least 8 characters'
  else if (password.length > 128) errors.password = 'Password must be at most 128 characters'
  else if (!/[a-z]/.test(password)) errors.password = 'Password must contain a lowercase letter'
  else if (!/[A-Z]/.test(password)) errors.password = 'Password must contain an uppercase letter'
  else if (!/\d/.test(password)) errors.password = 'Password must contain a number'

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your password'
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match'

  return errors
}

const FIELDS = [
  { id: 'name', label: 'Full name', type: 'text', autoComplete: 'name', placeholder: '' },
  {
    id: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'new-password',
    placeholder: '',
  },
  {
    id: 'confirmPassword',
    label: 'Confirm password',
    type: 'password',
    autoComplete: 'new-password',
    placeholder: '',
  },
]

function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const identifier = location.state?.identifier

  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Only reachable from the identify step, which supplies the identifier.
  if (!identifier) return <Navigate to={APP_ROUTES.IDENTIFY} replace />

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const errors = validateRegisterForm(form)
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      const challenge = await authApi.register({ identifier, ...form, name: form.name.trim() })
      navigate(APP_ROUTES.VERIFY_OTP, { state: { identifier, challenge } })
    } catch (requestError) {
      const { identifier: identifierError, ...otherFieldErrors } = requestError.fieldErrors ?? {}
      setFieldErrors(otherFieldErrors)
      setFormError(identifierError || (Object.keys(otherFieldErrors).length ? '' : requestError.message))
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <AuthHeading title="Create Account">
        <IdentifierSummary label="Signing up with" identifier={identifier} />
      </AuthHeading>

      <FormAlert>{formError}</FormAlert>

      <form onSubmit={handleSubmit} noValidate className="space-y-2">
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

        <Button type="submit" isLoading={isSubmitting} loadingText="Sending code…" className="mt-2">
          Send OTP
        </Button>
      </form>
    </>
  )
}

export default RegisterPage