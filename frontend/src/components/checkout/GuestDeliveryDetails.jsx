import { useState } from 'react'
import { Link } from 'react-router'

import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { formatAddressLine, formatIndianMobile } from '../../utils/addressValidation.js'
import AddressForm from '../address/AddressForm.jsx'

/**
 * The delivery section of the Order Summary for a guest (not signed in). The guest types their name, mobile,
 * address and an optional email; they are saved on the order when it is placed. Once filled in, the details show
 * read-only with an Edit button. `returnTo` brings a guest who chooses to sign in back to this checkout.
 */
function GuestDeliveryDetails({ details, onSave, returnTo }) {
  const [isEditing, setIsEditing] = useState(!details)

  function handleSave(payload) {
    onSave(payload)
    setIsEditing(false)
  }

  if (isEditing || !details) {
    return (
      <>
        <p className='mb-4 text-sm text-body'>
          No account needed. Tell us where to deliver, and we’ll contact you on this mobile number about your order.
          {' '}Have an account?{' '}
          <Link to={APP_ROUTES.IDENTIFY} state={{ returnTo }} className='font-semibold text-navy-700 hover:underline'>
            Sign in
          </Link>
        </p>
        <AddressForm
          withEmail
          initialValues={details ?? undefined}
          onSubmit={handleSave}
          onCancel={details ? () => setIsEditing(false) : undefined}
          submitLabel='Deliver here'
        />
      </>
    )
  }

  return (
    <div className='flex flex-wrap items-start justify-between gap-3'>
      <div className='min-w-0'>
        <p className='flex flex-wrap items-center gap-x-2 gap-y-1'>
          <span className='font-semibold text-navy-800'>{details.name}</span>
          <span className='text-sm font-semibold text-body'>{formatIndianMobile(details.phone)}</span>
        </p>
        {details.email && <p className='text-sm break-all text-body'>{details.email}</p>}
        <address className='mt-1 text-sm leading-relaxed not-italic wrap-break-word text-body'>
          {formatAddressLine(details)}
        </address>
      </div>
      <button
        type='button'
        onClick={() => setIsEditing(true)}
        className='min-h-11 rounded-lg px-2 text-sm font-semibold text-navy-700 transition hover:bg-lightblue-100'
      >
        Edit
      </button>
    </div>
  )
}

export { GuestDeliveryDetails }
export default GuestDeliveryDetails