import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { authApi } from '../api/authApi.js'
import AuthHeading from '../components/auth/AuthHeading.jsx'
import Button from '../components/ui/Button.jsx'
import FormField from '../components/ui/FormField.jsx'
import { APP_ROUTES } from '../constants/appRoutepoints.js'

// First step of sign-in / sign-up: the backend says whether the account exists, and we route on that.
function IdentifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState(location.state?.identifier ?? '')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmedIdentifier = identifier.trim()
    if (!trimmedIdentifier) {
      setError('Enter your email address or mobile number')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      const result = await authApi.identify(trimmedIdentifier)
      const nextRoute = result.exists ? APP_ROUTES.LOGIN : APP_ROUTES.REGISTER
      // Pass what the user typed, not the normalized value, so "Change" shows it back unaltered.
      navigate(nextRoute, { state: { identifier: trimmedIdentifier } })
    } catch (requestError) {
      setError(requestError.fieldErrors?.identifier || requestError.message)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <AuthHeading title="Sign in or Create Account">Enter your email address or mobile number to continue.</AuthHeading>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <FormField
          id="identifier"
          label="Email or mobile number"
          type="text"
          autoComplete="username"
          placeholder="you@example.com or 98765 43210"
          autoFocus
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          error={error}
        />

        <Button type="submit" isLoading={isSubmitting} loadingText="Checking…">
          Continue
        </Button>
      </form>
    </>
  )
}

export default IdentifyPage