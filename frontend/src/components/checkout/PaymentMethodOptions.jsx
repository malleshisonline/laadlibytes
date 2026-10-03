import { QrCode, Smartphone } from 'lucide-react'

// Razorpay with UPI and QR only: no cards, netbanking or wallets (client decision).
const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', description: 'Pay from Google Pay, PhonePe, Paytm or any UPI app', Icon: Smartphone },
  { id: 'qr', label: 'Scan QR code', description: 'Scan the code with any UPI app and pay', Icon: QrCode },
]

/** Payment method radio cards; `value` is the chosen method id. */
function PaymentMethodOptions({ value, onChange }) {
  return (
    <fieldset>
      <legend className='sr-only'>Choose a payment method</legend>
      <ul className='space-y-3'>
        {PAYMENT_METHODS.map(({ id, label, description, Icon }) => {
          const isSelected = id === value
          return (
            <li key={id}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition sm:p-4 ${
                  isSelected ? 'border-navy-800 bg-lightblue-50' : 'border-line hover:border-lightblue-300'
                }`}
              >
                <input
                  type='radio'
                  name='payment-method'
                  value={id}
                  checked={isSelected}
                  onChange={() => onChange(id)}
                  className='size-4 shrink-0 accent-navy-800'
                />
                <Icon size={22} strokeWidth={1.75} aria-hidden='true' className='shrink-0 text-navy-800' />
                <span className='min-w-0'>
                  <span className='block font-semibold text-navy-800'>{label}</span>
                  <span className='block text-sm text-muted'>{description}</span>
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

export { PaymentMethodOptions }
export default PaymentMethodOptions