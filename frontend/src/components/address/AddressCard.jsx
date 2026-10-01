import { formatIndianMobile } from '../../utils/addressValidation.js'

/** One saved address, formatted the way a courier label reads. `children` holds the card's actions. */
function AddressCard({ address, children }) {
  const { name, phone, line1, line2, landmark, city, state, pincode, isDefault } = address

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border p-4 transition ${
        isDefault ? 'border-navy-800 bg-lightblue-50' : 'border-line bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold wrap-break-word text-navy-800">{name}</p>
        {isDefault && (
          <span className="shrink-0 rounded-full bg-navy-800 px-2 py-0.5 text-xs font-semibold text-white">Default</span>
        )}
      </div>
      <address className="mt-2 flex-1 text-sm leading-relaxed not-italic wrap-break-word text-body">
        {line1}
        {line2 && <>, {line2}</>}
        {landmark && (
          <>
            <br />
            Near {landmark.replace(/^near\s+/i, '')}
          </>
        )}
        <br />
        {city}, {state} {pincode}
        <br />
        Phone: {formatIndianMobile(phone)}
      </address>
      {children && <div className="mt-3 flex flex-wrap gap-1 border-t border-line pt-2">{children}</div>}
    </div>
  )
}

export default AddressCard