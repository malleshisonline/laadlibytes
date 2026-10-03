import { forwardRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router'
import { Lock, MapPin, Plus, RotateCw } from 'lucide-react'

import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { MAX_ADDRESSES } from '../../hooks/useAddresses.js'
import { formatAddressLine, formatIndianMobile } from '../../utils/addressValidation.js'
import AddressForm from '../address/AddressForm.jsx'

const BOX_CLASSES = 'rounded-2xl border bg-surface p-4 shadow-card sm:p-5'

/**
 * The cart's "Deliver to" box, like Flipkart's. A guest is asked to sign in (addresses belong to an account).
 * A signed-in user picks one saved address with a radio button (the default starts selected) or adds a new
 * one, which is then selected; with no saved address the form is open straight away. `error` is shown when
 * Continue was pressed without an address. The ref lets the cart scroll here. `bare` drops the box's frame and
 * heading, for a page that puts it in its own section (the Buy Now order summary).
 */
const DeliveryAddressBox = forwardRef(function DeliveryAddressBox(
  { user, addresses, status, onRetry, onCreateAddress, selectedId, onSelect, error, bare = false },
  ref,
) {
  const [isAdding, setIsAdding] = useState(false)

  const hasAddresses = status === 'ready' && addresses.length > 0
  const showForm = status === 'ready' && (isAdding || !hasAddresses)
  const isFull = (addresses?.length ?? 0) >= MAX_ADDRESSES

  // Errors are thrown back to AddressForm, which shows them on the form.
  async function handleCreate(payload) {
    const created = await onCreateAddress(payload)
    onSelect(created.id)
    setIsAdding(false)
    toast.success('Address saved')
  }

  let content
  if (!user) {
    content = (
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-sm text-body'>Sign in to choose or add a delivery address.</p>
        <Link
          to={APP_ROUTES.IDENTIFY}
          state={{ returnTo: APP_ROUTES.CART }}
          className='inline-flex min-h-11 items-center gap-2 rounded-full border border-navy-800 px-5 text-sm font-semibold text-navy-800 transition hover:bg-lightblue-100'
        >
          <Lock size={16} strokeWidth={1.75} aria-hidden='true' />
          Sign in
        </Link>
      </div>
    )
  } else if (status === 'loading' || status === 'idle') {
    content = (
      <div aria-hidden='true' className='space-y-3'>
        {[0, 1].map((index) => (
          <div key={index} className='h-20 animate-pulse rounded-xl bg-cream-100' />
        ))}
      </div>
    )
  } else if (status === 'error') {
    content = (
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-sm text-body'>We couldn’t load your saved addresses.</p>
        <button
          type='button'
          onClick={onRetry}
          className='inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-navy-700 transition hover:bg-lightblue-100'
        >
          <RotateCw size={16} strokeWidth={1.75} aria-hidden='true' />
          Try again
        </button>
      </div>
    )
  } else {
    content = (
      <>
        {hasAddresses && (
          <fieldset>
            <legend className='sr-only'>Choose a delivery address</legend>
            <ul className='space-y-3'>
              {addresses.map((address) => {
                const isSelected = address.id === selectedId
                return (
                  <li key={address.id}>
                    <label
                      className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition sm:p-4 ${
                        isSelected ? 'border-navy-800 bg-lightblue-50' : 'border-line hover:border-lightblue-300'
                      }`}
                    >
                      <input
                        type='radio'
                        name='delivery-address'
                        value={address.id}
                        checked={isSelected}
                        onChange={() => onSelect(address.id)}
                        className='mt-1 size-4 shrink-0 accent-navy-800'
                      />
                      <span className='min-w-0 flex-1'>
                        <span className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                          <span className='font-semibold wrap-break-word text-navy-800'>{address.name}</span>
                          {address.isDefault && (
                            <span className='rounded-full bg-navy-800 px-2 py-0.5 text-xs font-semibold text-white'>
                              Default
                            </span>
                          )}
                          <span className='text-sm font-semibold text-body'>{formatIndianMobile(address.phone)}</span>
                        </span>
                        <span className='mt-1 block text-sm leading-relaxed wrap-break-word text-body'>
                          {formatAddressLine(address)}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </fieldset>
        )}

        {showForm ? (
          <div className={hasAddresses ? 'mt-4 border-t border-line pt-4' : ''}>
            <h3 className='mb-3 text-base font-semibold text-navy-800'>Add a new address</h3>
            <AddressForm
              defaults={hasAddresses ? undefined : { name: user.name, phone: user.phone }}
              onSubmit={handleCreate}
              onCancel={hasAddresses ? () => setIsAdding(false) : undefined}
              submitLabel='Save and deliver here'
            />
          </div>
        ) : isFull ? (
          <p className='mt-3 text-sm text-muted'>
            You have saved {MAX_ADDRESSES} addresses, the most allowed. Manage them in{' '}
            <Link to={APP_ROUTES.ACCOUNT_ADDRESSES} className='font-semibold text-navy-700 hover:underline'>
              My Account
            </Link>
            .
          </p>
        ) : (
          <button
            type='button'
            onClick={() => setIsAdding(true)}
            className='mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-navy-700 transition hover:bg-lightblue-100'
          >
            <Plus size={16} strokeWidth={2} aria-hidden='true' />
            Add a new address
          </button>
        )}
      </>
    )
  }

  const errorAlert = error && (
    <p role='alert' className='mb-3 rounded-lg bg-cream-100 px-3 py-2 text-sm font-semibold text-error'>
      {error}
    </p>
  )

  if (bare) {
    return (
      <div ref={ref}>
        {errorAlert}
        {content}
      </div>
    )
  }

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-labelledby='delivery-address-heading'
      className={`${BOX_CLASSES} scroll-mt-28 focus:outline-none ${error ? 'border-error' : 'border-line'}`}
    >
      <h2 id='delivery-address-heading' className='mb-3 flex items-center gap-2 text-lg font-semibold text-navy-800'>
        <MapPin size={20} strokeWidth={1.75} aria-hidden='true' className='text-caramel-700' />
        Deliver to
      </h2>
      {errorAlert}
      {content}
    </section>
  )
})

export { DeliveryAddressBox }
export default DeliveryAddressBox