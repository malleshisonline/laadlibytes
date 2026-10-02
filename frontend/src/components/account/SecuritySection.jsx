import { useState } from 'react'
import { toast } from 'react-hot-toast'

import { userApi } from '../../api/userApi.js'
import { accountErrorMessage } from '../../utils/accountErrorMessage.js'
import Button from '../ui/Button.jsx'
import FormAlert from '../ui/FormAlert.jsx'
import FormField from '../ui/FormField.jsx'

import AccountCard from './AccountCard.jsx'

const EMPTY_PASSWORDS = { currentPassword: '', newPassword: '', confirmPassword: '' }

const PASSWORD_FIELDS = [
  { id: 'currentPassword', label: 'Current password', autoComplete: 'current-password' },
  {
    id: 'newPassword',
    label: 'New password',
    autoComplete: 'new-password',
    hint: 'At least 8 characters, with an uppercase letter, a lowercase letter and a number.',
  },
  { id: 'confirmPassword', label: 'Confirm new password', autoComplete: 'new-password' },
]

// Mirrors changePasswordSchema in backend/src/modules/user/user.validation.js; the backend still decides.
function validatePasswords({ currentPassword, newPassword, confirmPassword }) {
  const errors = {}

  if (!currentPassword) errors.currentPassword = 'Current password is required'

  if (newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters'
  else if (newPassword.length > 128) errors.newPassword = 'Password must be at most 128 characters'
  else if (!/[a-z]/.test(newPassword)) errors.newPassword = 'Password must contain a lowercase letter'
  else if (!/[A-Z]/.test(newPassword)) errors.newPassword = 'Password must contain an uppercase letter'
  else if (!/\d/.test(newPassword)) errors.newPassword = 'Password must contain a number'
  else if (newPassword === currentPassword) errors.newPassword = 'New password must be different from the current one'

  if (!confirmPassword) errors.confirmPassword = 'Please confirm your new password'
  else if (confirmPassword !== newPassword) errors.confirmPassword = 'Passwords do not match'

  return errors
}

function ChangePasswordForm() {
  const [values, setValues] = useState(EMPTY_PASSWORDS)
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

    const errors = validatePasswords(values)
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)
    try {
      await userApi.changePassword(values)
      setValues(EMPTY_PASSWORDS)
      setFieldErrors({})
      toast.success('Password changed. Other devices have been signed out.')
    } catch (error) {
      if (error.code === 'INVALID_CURRENT_PASSWORD') {
        setFieldErrors({ currentPassword: error.message })
      } else if (error.fieldErrors && Object.keys(error.fieldErrors).length) {
        setFieldErrors(error.fieldErrors)
      } else {
        setFormError(accountErrorMessage(error))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-md space-y-4">
      <FormAlert>{formError}</FormAlert>
      {PASSWORD_FIELDS.map(({ id, label, autoComplete, hint }) => (
        <div key={id}>
          <FormField
            id={id}
            label={label}
            type="password"
            autoComplete={autoComplete}
            maxLength={128}
            value={values[id]}
            onChange={handleChange}
            error={fieldErrors[id]}
          />
          {hint && !fieldErrors[id] && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
      ))}
      <Button type="submit" isLoading={isSubmitting} loadingText="Changing…" className="sm:max-w-56">
        Change password
      </Button>
    </form>
  )
}

/** Change password. Doing so also signs out every other device, so there is no separate "sign out everywhere". */
function SecuritySection() {
  return (
    <AccountCard
      title="Change password"
      description="You stay signed in here. Any other phone or computer signed in to your account will be signed out."
    >
      <ChangePasswordForm />
    </AccountCard>
  )
}

export default SecuritySection
