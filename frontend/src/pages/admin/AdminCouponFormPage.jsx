import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'react-hot-toast'
import { ArrowLeft, LoaderCircle, Save } from 'lucide-react'

import { adminApi } from '../../api/adminApi.js'
import AdminLoadState from '../../components/admin/AdminLoadState.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import {
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_CARD,
  ADMIN_FIELD_ERROR,
  ADMIN_INPUT,
  ADMIN_LABEL,
} from '../../components/admin/adminStyles.js'
import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { couponShareLink, describeCouponOffer, normaliseCouponCode } from '../../utils/couponLink.js'

const EMPTY_FORM = {
  code: '',
  description: '',
  type: 'percent',
  value: '',
  maxDiscount: '',
  minOrderValue: '',
  startsAt: '',
  endsAt: '',
  maxUses: '',
  maxUsesPerCustomer: '',
  isActive: true,
  isFeatured: false,
}

/** An ISO date as the `datetime-local` input wants it, in the admin's own time zone. */
function toLocalInput(isoDate) {
  if (!isoDate) return ''
  const date = new Date(isoDate)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

const numberText = (value) => (value === null || value === undefined ? '' : String(value))

function toForm(coupon) {
  return {
    code: coupon.code,
    description: coupon.description ?? '',
    type: coupon.type,
    value: numberText(coupon.value),
    maxDiscount: numberText(coupon.maxDiscount),
    minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : '',
    startsAt: toLocalInput(coupon.startsAt),
    endsAt: toLocalInput(coupon.endsAt),
    maxUses: numberText(coupon.maxUses),
    maxUsesPerCustomer: numberText(coupon.maxUsesPerCustomer),
    isActive: coupon.isActive,
    isFeatured: coupon.isFeatured,
  }
}

const isWholeNumber = (text, min) => /^\d+$/.test(text) && Number(text) >= min

/** The checks the backend makes, so most mistakes show next to their field before saving. */
function validate(form) {
  const errors = {}
  if (!normaliseCouponCode(form.code)) errors.code = 'Use 3–30 letters, numbers, - or _'
  if (!isWholeNumber(form.value, 1)) errors.value = 'Enter a whole number, 1 or more'
  else if (form.type === 'percent' && Number(form.value) > 100) errors.value = 'A percentage can be at most 100'
  if (form.type === 'percent' && form.maxDiscount && !isWholeNumber(form.maxDiscount, 1)) {
    errors.maxDiscount = 'Enter whole rupees, 1 or more'
  }
  if (form.minOrderValue && !isWholeNumber(form.minOrderValue, 0)) errors.minOrderValue = 'Enter whole rupees'
  if (form.maxUses && !isWholeNumber(form.maxUses, 1)) errors.maxUses = 'Enter a whole number, 1 or more'
  if (form.maxUsesPerCustomer && !isWholeNumber(form.maxUsesPerCustomer, 1)) {
    errors.maxUsesPerCustomer = 'Enter a whole number, 1 or more'
  }
  if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
    errors.endsAt = 'End must be after the start'
  }
  return errors
}

const optionalNumber = (text) => (text ? Number(text) : null)
const optionalDate = (text) => (text ? new Date(text).toISOString() : null)

function toPayload(form) {
  return {
    code: normaliseCouponCode(form.code),
    description: form.description.trim(),
    type: form.type,
    value: Number(form.value),
    maxDiscount: form.type === 'percent' ? optionalNumber(form.maxDiscount) : null,
    minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
    startsAt: optionalDate(form.startsAt),
    endsAt: optionalDate(form.endsAt),
    maxUses: optionalNumber(form.maxUses),
    maxUsesPerCustomer: optionalNumber(form.maxUsesPerCustomer),
    isActive: form.isActive,
    isFeatured: form.isFeatured,
  }
}

function Field({ id, label, hint, error, children }) {
  return (
    <div>
      <label htmlFor={id} className={ADMIN_LABEL}>
        {label}
      </label>
      {children}
      {error ? <p className={ADMIN_FIELD_ERROR}>{error}</p> : hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

/** /admin/coupons/new and /admin/coupons/:id/edit. */
function AdminCouponFormPage() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const [coupon, setCoupon] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState(isNew ? 'ready' : 'loading')
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  useDocumentTitle(isNew ? 'Add coupon' : `Edit ${coupon?.code ?? 'coupon'}`)

  useEffect(() => {
    if (isNew) return undefined
    let isCancelled = false
    adminApi.coupons
      .get(id)
      .then((loaded) => {
        if (isCancelled) return
        setCoupon(loaded)
        setForm(toForm(loaded))
        setStatus('ready')
      })
      .catch((error) => {
        if (!isCancelled) setStatus(error.status === 404 || error.status === 400 ? 'not-found' : 'error')
      })
    return () => {
      isCancelled = true
    }
  }, [id, isNew])

  function setValue(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current))
  }

  const fieldProps = (name) => ({
    id: `coupon-${name}`,
    value: form[name],
    onChange: (event) => setValue(name, event.target.value),
    'aria-invalid': Boolean(errors[name]),
    className: ADMIN_INPUT,
  })

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return

    setIsSaving(true)
    try {
      const payload = toPayload(form)
      if (isNew) {
        await adminApi.coupons.create(payload)
        toast.success(`${payload.code} added`)
      } else {
        await adminApi.coupons.update(id, payload)
        toast.success('Coupon saved')
      }
      navigate(APP_ROUTES.ADMIN_COUPONS, { replace: true })
    } catch (error) {
      setErrors(error.fieldErrors ?? {})
      toast.error(
        error.status === 409 && error.code !== 'COUPON_IN_USE' ? 'That code is already used by another coupon' : error.message,
      )
    } finally {
      setIsSaving(false)
    }
  }

  const backLink = (
    <Link to={APP_ROUTES.ADMIN_COUPONS} className={ADMIN_BUTTON_SECONDARY}>
      <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
      All coupons
    </Link>
  )

  if (status !== 'ready') {
    return (
      <>
        <AdminPageHeader title="Edit coupon" actions={backLink} />
        <AdminLoadState status={status} onRetry={() => window.location.reload()} />
      </>
    )
  }

  const hasBeenUsed = Boolean(coupon?.usedCount || coupon?.paidOrders)
  const previewCode = normaliseCouponCode(form.code)
  const previewValue = Number(form.value)

  return (
    <>
      <AdminPageHeader
        title={isNew ? 'Add coupon' : coupon.code}
        description={
          isNew
            ? undefined
            : `Used ${coupon.usedCount} time${coupon.usedCount === 1 ? '' : 's'} · ${coupon.paidOrders} paid order${coupon.paidOrders === 1 ? '' : 's'}`
        }
        actions={backLink}
      />

      <form onSubmit={handleSubmit} noValidate className={`${ADMIN_CARD} max-w-content space-y-5`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="coupon-code"
            label={
              <>
                Code <span className="text-error">*</span>
              </>
            }
            hint={hasBeenUsed ? 'This coupon has been used, so its code can no longer change.' : 'Letters, numbers, - and _. Not case-sensitive.'}
            error={errors.code}
          >
            <input
              {...fieldProps('code')}
              onChange={(event) => setValue('code', event.target.value.toUpperCase())}
              maxLength={30}
              autoCapitalize="characters"
              spellCheck="false"
              readOnly={hasBeenUsed}
              className={`${ADMIN_INPUT} font-semibold tracking-wide uppercase read-only:bg-lightblue-50`}
            />
          </Field>
          <Field
            id="coupon-description"
            label="Description"
            hint="Shown in the banner and at checkout, e.g. “10% off your first order”."
            error={errors.description}
          >
            <input {...fieldProps('description')} maxLength={200} />
          </Field>
        </div>

        <fieldset>
          <legend className={ADMIN_LABEL}>Discount</legend>
          <div className="flex flex-wrap gap-4">
            {[
              ['percent', 'Percentage (%)'],
              ['flat', 'Flat amount (₹)'],
            ].map(([value, label]) => (
              <label key={value} className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm text-navy-800">
                <input
                  type="radio"
                  name="coupon-type"
                  value={value}
                  checked={form.type === value}
                  onChange={() => setValue('type', value)}
                  className="size-4 accent-navy-800"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="coupon-value"
            label={
              <>
                {form.type === 'percent' ? 'Percentage off' : 'Rupees off'} <span className="text-error">*</span>
              </>
            }
            error={errors.value}
          >
            <input {...fieldProps('value')} type="number" min="1" max={form.type === 'percent' ? 100 : undefined} step="1" inputMode="numeric" />
          </Field>
          {form.type === 'percent' && (
            <Field
              id="coupon-maxDiscount"
              label="Maximum discount (₹)"
              hint="Optional, e.g. 100 for “10% off, up to ₹100”."
              error={errors.maxDiscount}
            >
              <input {...fieldProps('maxDiscount')} type="number" min="1" step="1" inputMode="numeric" />
            </Field>
          )}
          <Field id="coupon-minOrderValue" label="Minimum order value (₹)" hint="Optional. Leave empty for any order." error={errors.minOrderValue}>
            <input {...fieldProps('minOrderValue')} type="number" min="0" step="1" inputMode="numeric" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="coupon-startsAt" label="Starts" hint="Optional. Empty means it works straight away." error={errors.startsAt}>
            <input {...fieldProps('startsAt')} type="datetime-local" />
          </Field>
          <Field id="coupon-endsAt" label="Ends" hint="Optional. Empty means it never expires." error={errors.endsAt}>
            <input {...fieldProps('endsAt')} type="datetime-local" />
          </Field>
          <Field id="coupon-maxUses" label="Total uses" hint="Optional. Empty means no limit." error={errors.maxUses}>
            <input {...fieldProps('maxUses')} type="number" min="1" step="1" inputMode="numeric" />
          </Field>
          <Field
            id="coupon-maxUsesPerCustomer"
            label="Uses per customer"
            hint="Optional. Counted by account and by delivery phone number."
            error={errors.maxUsesPerCustomer}
          >
            <input {...fieldProps('maxUsesPerCustomer')} type="number" min="1" step="1" inputMode="numeric" />
          </Field>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-navy-800">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setValue('isActive', event.target.checked)}
              className="size-4 accent-navy-800"
            />
            On (customers can use it)
          </label>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-navy-800">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => setValue('isFeatured', event.target.checked)}
              className="size-4 accent-navy-800"
            />
            Show in the banner at the top of the store (replaces any other)
          </label>
        </div>

        {previewCode && previewValue > 0 && (
          <div className="rounded-xl bg-lightblue-50 px-4 py-3 text-sm text-body">
            <p>
              <span className="font-semibold text-navy-800">{previewCode}</span>:{' '}
              {describeCouponOffer({
                type: form.type,
                value: previewValue,
                maxDiscount: Number(form.maxDiscount) || null,
                minOrderValue: Number(form.minOrderValue) || 0,
              })}
            </p>
            <p className="mt-1 text-xs break-all text-muted">Share link: {couponShareLink(previewCode)}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Link to={APP_ROUTES.ADMIN_COUPONS} className={ADMIN_BUTTON_SECONDARY}>
            Cancel
          </Link>
          <button type="submit" disabled={isSaving} className={ADMIN_BUTTON_PRIMARY}>
            {isSaving ? (
              <LoaderCircle size={16} strokeWidth={1.75} aria-hidden="true" className="animate-spin" />
            ) : (
              <Save size={16} strokeWidth={1.75} aria-hidden="true" />
            )}
            {isSaving ? 'Saving…' : isNew ? 'Add coupon' : 'Save changes'}
          </button>
        </div>
      </form>
    </>
  )
}

export default AdminCouponFormPage