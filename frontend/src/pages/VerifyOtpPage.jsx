import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { authApi } from '../api/authApi.js'
import AuthHeading from '../components/auth/AuthHeading.jsx'
import Button from '../components/ui/Button.jsx'
import FormAlert from '../components/ui/FormAlert.jsx'
import FormField from '../components/ui/FormField.jsx'
import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { useAuth } from '../hooks/useAuth.js'

const OTP_LENGTH = 6

const secondsUntil = (timestamp) => Math.max(0, Math.ceil((timestamp - Date.now()) / 1000))

// Last step of both sign-up and OTP login; the backend decides which from the challenge it issued.
function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setSession } = useAuth()
  const identifier = location.state?.identifier
  const initialChallenge = location.state?.challenge

  const [challenge, setChallenge] = useState(initialChallenge)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendAvailableAt, setResendAvailableAt] = useState(
    () => Date.now() + (initialChallenge?.resendAfterSeconds ?? 0) * 1000
  )
  const [resendCountdown, setResendCountdown] = useState(() => secondsUntil(resendAvailableAt))

  useEffect(() => {
    const timer = setInterval(() => setResendCountdown(secondsUntil(resendAvailableAt)), 1000)
    return () => clearInterval(timer)
  }, [resendAvailableAt])

  // Only reachable after a code was sent, which supplies the challenge.
  if (!challenge?.verificationId) return <Navigate to={APP_ROUTES.IDENTIFY} replace />

  const isSignUp = challenge.purpose === 'register'

  async function handleVerify(event) {
    event.preventDefault()
    setFormError('')
    setNotice('')
    if (otp.length !== OTP_LENGTH) {
      setOtpError(`Enter the ${OTP_LENGTH}-digit code`)
      return
    }

    setIsVerifying(true)
    try {
      const session = await authApi.verifyOtp({ verificationId: challenge.verificationId, otp })
      setSession(session)
      navigate(APP_ROUTES.HOME, { replace: true })
    } catch (requestError) {
      setOtpError(requestError.fieldErrors?.otp ?? '')
      setFormError(requestError.fieldErrors?.otp ? '' : requestError.message)
      setIsVerifying(false)
    }
  }

  async function handleResend() {
    setFormError('')
    setNotice('')
    setOtpError('')
    setIsResending(true)
    try {
      const nextChallenge = await authApi.resendOtp(challenge.verificationId)
      setChallenge(nextChallenge)
      setOtp('')
      const nextResendAt = Date.now() + nextChallenge.resendAfterSeconds * 1000
      setResendAvailableAt(nextResendAt)
      setResendCountdown(secondsUntil(nextResendAt))
      setNotice(`A new code has been sent to ${nextChallenge.destination}.`)
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <>
      <AuthHeading title="Verify OTP">
        Enter the {OTP_LENGTH}-digit code sent to{' '}
        <span className="font-semibold text-brand-navy-dark">{challenge.destination}</span>
      </AuthHeading>

      <FormAlert>{formError}</FormAlert>
      {notice && (
        <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          {notice}
        </p>
      )}

      <form onSubmit={handleVerify} noValidate className="space-y-6">
        <FormField
          id="otp"
          label="Verification code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_LENGTH}
          placeholder="••••••"
          autoFocus
          value={otp}
          onChange={(event) => {
            setOtp(event.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))
            setOtpError('')
          }}
          error={otpError}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-brand-navy-dark focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/25"
        />

        <Button type="submit" isLoading={isVerifying} loadingText="Verifying…" disabled={isResending}>
          {isSignUp ? 'Verify & Create Account' : 'Verify & Login'}
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link
          to={APP_ROUTES.IDENTIFY}
          state={{ identifier }}
          className="font-semibold text-brand-navy underline-offset-2 hover:underline"
        >
          Use a different account
        </Link>

        {resendCountdown > 0 ? (
          <span className="text-gray-500">Resend code in {resendCountdown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || isVerifying}
            className="font-semibold text-brand-gold underline-offset-2 hover:underline disabled:opacity-60"
          >
            {isResending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </div>
    </>
  )
}

export default VerifyOtpPage