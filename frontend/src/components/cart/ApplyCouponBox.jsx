import { useState } from 'react'
import { BadgePercent, LoaderCircle, X } from 'lucide-react'

import { formatPrice } from '../../utils/productFormatters.js'

/**
 * Enter a coupon code, or see the one applied with what it saves. `coupon` is what useCheckoutCoupon returns; the
 * discount shown is the backend's, never worked out here.
 */
function ApplyCouponBox({ coupon }) {
  const { code, preview, error, isApplying, apply, remove } = coupon
  const [typedCode, setTypedCode] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    apply(typedCode)
  }

  return (
    <section
      aria-labelledby='apply-coupon-heading'
      className='rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5'
    >
      <h2 id='apply-coupon-heading' className='flex items-center gap-2 text-base font-semibold text-navy-800'>
        <BadgePercent size={20} strokeWidth={1.75} aria-hidden='true' className='text-caramel-700' />
        Apply Coupon
      </h2>

      {code ? (
        <div className='mt-3 flex items-start justify-between gap-3 rounded-lg border border-dashed border-success/40 bg-cream-50 px-3 py-2.5'>
          <div aria-live='polite' className='min-w-0'>
            <p className='font-bold tracking-wide text-navy-800'>{code}</p>
            {isApplying || !preview ? (
              <p className='mt-0.5 flex items-center gap-1.5 text-sm text-muted'>
                <LoaderCircle size={14} strokeWidth={2} aria-hidden='true' className='animate-spin' />
                Checking your coupon…
              </p>
            ) : (
              <>
                <p className='mt-0.5 text-sm font-semibold text-success'>
                  You save {formatPrice(preview.discount)} with this coupon
                </p>
                {preview.description && <p className='mt-0.5 text-xs text-muted'>{preview.description}</p>}
              </>
            )}
          </div>
          <button
            type='button'
            onClick={() => {
              remove()
              setTypedCode('')
            }}
            className='inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-navy-700 hover:underline focus-visible:outline-2 focus-visible:outline-navy-600'
          >
            <X size={16} strokeWidth={1.75} aria-hidden='true' />
            Remove
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className='mt-3' noValidate>
          <label htmlFor='coupon-code' className='sr-only'>
            Coupon code
          </label>
          <div className='flex gap-2'>
            <input
              id='coupon-code'
              value={typedCode}
              onChange={(event) => setTypedCode(event.target.value.toUpperCase())}
              placeholder='Enter coupon code'
              autoComplete='off'
              autoCapitalize='characters'
              spellCheck='false'
              maxLength={30}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'coupon-code-error' : undefined}
              className={`min-h-11 w-full min-w-0 rounded-lg border bg-surface px-3 text-sm font-semibold tracking-wide text-body uppercase placeholder:font-normal placeholder:tracking-normal placeholder:text-muted placeholder:normal-case focus:ring-2 focus:ring-lightblue-200 focus:outline-none ${
                error ? 'border-error' : 'border-line focus:border-navy-600'
              }`}
            />
            <button
              type='submit'
              disabled={!typedCode.trim()}
              className='inline-flex min-h-11 shrink-0 items-center rounded-lg bg-navy-800 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 disabled:cursor-not-allowed disabled:bg-lightblue-100 disabled:text-muted disabled:shadow-none'
            >
              Apply
            </button>
          </div>
          {error && (
            <p id='coupon-code-error' role='alert' className='mt-2 text-sm font-semibold text-error'>
              {error}
            </p>
          )}
        </form>
      )}
    </section>
  )
}

export { ApplyCouponBox }
export default ApplyCouponBox