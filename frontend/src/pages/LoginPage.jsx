import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'

import { authApi } from '../api/authApi.js'
import AuthHeading from '../components/auth/AuthHeading.jsx'
import IdentifierSummary from '../components/auth/IdentifierSummary.jsx'
import Button from '../components/ui/Button.jsx'
import FormAlert from '../components/ui/FormAlert.jsx'
import FormField from '../components/ui/FormField.jsx'
import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { useAuth } from '../hooks/useAuth.js'

// An existing account signs in with its password, or asks for a one-time code instead.
function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useAuth()
  const identifier = location.state?.identifier

  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [pendingAction, setPendingAction] = useState(null) // 'password' | 'otp' | null

  // Only reachable from the identify step, which supplies the identifier.
  if (!identifier) return <Navigate to={APP_ROUTES.IDENTIFY} replace />

  async function handlePasswordLogin(event) {
    event.preventDefault()
    setFormError('')
    if (!password) {
      setPasswordError('Enter your password')
      return
    }

    setPendingAction('password')
    try {
      const session = await authApi.login({ identifier, password })
      setSession(session)
      navigate(APP_ROUTES.HOME, { replace: true })
    } catch (requestError) {
      setPasswordError(requestError.fieldErrors?.password ?? '')
      setFormError(requestError.fieldErrors?.password ? '' : requestError.message)
      setPendingAction(null)
    }
  }

  async function handleOtpLogin() {
    setFormError('')
    setPasswordError('')
    setPendingAction('otp')
    try {
      const challenge = await authApi.requestLoginOtp(identifier)
      navigate(APP_ROUTES.VERIFY_OTP, { state: { identifier, challenge } })
    } catch (requestError) {
      setFormError(requestError.message)
      setPendingAction(null)
    }
  }

  return (
    <>
      <AuthHeading title="Welcome Back">
        <IdentifierSummary label="Logging in as" identifier={identifier} />
      </AuthHeading>

      <FormAlert>{formError}</FormAlert>

      <form onSubmit={handlePasswordLogin} noValidate className="space-y-6">
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          autoFocus
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setPasswordError('')
          }}
          error={passwordError}
        />

        <Button
          type="submit"
          isLoading={pendingAction === 'password'}
          loadingText="Logging in…"
          disabled={pendingAction !== null}
        >
          Login
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <Button
        variant="outline"
        onClick={handleOtpLogin}
        isLoading={pendingAction === 'otp'}
        loadingText="Sending code…"
        disabled={pendingAction !== null}
      >
        Login with OTP
      </Button>
    </>
  )
}

export default LoginPage