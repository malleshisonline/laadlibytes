import { useEffect, useRef, useState } from 'react'
import { RotateCcw, X } from 'lucide-react'

import {
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_FIELD_ERROR,
  ADMIN_INPUT,
  ADMIN_LABEL,
} from './adminStyles.js'

const DEFAULT_DAYS = 7

/** A date as the `datetime-local` input wants it, in the admin's own time zone. */
function toLocalInput(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function validate({ startsAt, endsAt }) {
  const errors = {}
  if (!startsAt) errors.startsAt = 'Choose when it starts'
  if (!endsAt) errors.endsAt = 'Choose when it ends'
  else if (new Date(endsAt).getTime() <= Date.now()) errors.endsAt = 'End must be in the future'
  else if (startsAt && new Date(endsAt) <= new Date(startsAt)) errors.endsAt = 'End must be after the start'
  return errors
}

/**
 * Brings an expired coupon back: a new start and end, and switched on. `onSubmit({ startsAt, endsAt })` gets ISO
 * strings and should resolve once saved; it throws to keep the dialog open.
 */
function ReactivateCouponModal({ coupon, onClose, onSubmit }) {
  const [form, setForm] = useState(() => {
    const now = new Date()
    return {
      startsAt: toLocalInput(now),
      endsAt: toLocalInput(new Date(now.getTime() + DEFAULT_DAYS * 24 * 60 * 60_000)),
    }
  })
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const firstFieldRef = useRef(null)

  useEffect(() => {
    firstFieldRef.current?.focus()
    function handleKey(event) {
      if (event.key === 'Escape' && !isSaving) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, isSaving])

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return
    setIsSaving(true)
    try {
      await onSubmit({
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
      })
    } catch {
      // The caller shows the error; keep the dialog open so the dates can be fixed.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-navy-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reactivate-coupon-title"
        className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="reactivate-coupon-title" className="text-lg font-semibold text-navy-800">
              Reactivate {coupon.code}
            </h2>
            <p className="mt-1 text-sm text-muted">Pick a new period. The coupon is switched on and works again within it.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-lightblue-100 hover:text-navy-800"
          >
            <X size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="grid gap-4">
          <div>
            <label htmlFor="reactivate-startsAt" className={ADMIN_LABEL}>
              Starts
            </label>
            <input
              ref={firstFieldRef}
              id="reactivate-startsAt"
              type="datetime-local"
              value={form.startsAt}
              onChange={(event) => update('startsAt', event.target.value)}
              aria-invalid={Boolean(errors.startsAt)}
              className={ADMIN_INPUT}
            />
            {errors.startsAt && <p className={ADMIN_FIELD_ERROR}>{errors.startsAt}</p>}
          </div>
          <div>
            <label htmlFor="reactivate-endsAt" className={ADMIN_LABEL}>
              Ends
            </label>
            <input
              id="reactivate-endsAt"
              type="datetime-local"
              value={form.endsAt}
              onChange={(event) => update('endsAt', event.target.value)}
              aria-invalid={Boolean(errors.endsAt)}
              className={ADMIN_INPUT}
            />
            {errors.endsAt && <p className={ADMIN_FIELD_ERROR}>{errors.endsAt}</p>}
          </div>

          <div className="mt-1 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isSaving} className={ADMIN_BUTTON_SECONDARY}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className={ADMIN_BUTTON_PRIMARY}>
              <RotateCcw size={16} strokeWidth={1.75} aria-hidden="true" />
              {isSaving ? 'Saving…' : 'Reactivate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export { ReactivateCouponModal }
export default ReactivateCouponModal