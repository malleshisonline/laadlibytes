import { useCallback, useState } from 'react'

const STORAGE_KEY = 'laadlibytes.guestDeliveryDetails'

function readStoredDetails() {
  try {
    const stored = JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) ?? 'null')
    return stored && typeof stored === 'object' && stored.name && stored.phone ? stored : null
  } catch {
    return null
  }
}

/**
 * A guest's delivery details for checkout ({ name, phone, pincode, line1, line2, landmark, city, state, email }).
 * They are remembered in this browser only, so a returning guest doesn't type them again; the order keeps its own
 * copy on the server. Storage can be blocked (private mode), so it is a convenience, never required.
 * Returns { details, saveDetails }.
 */
export function useGuestDeliveryDetails() {
  const [details, setDetails] = useState(readStoredDetails)

  const saveDetails = useCallback((nextDetails) => {
    setDetails(nextDetails)
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(nextDetails))
    } catch {
      // Not remembered this time; checkout still works.
    }
  }, [])

  return { details, saveDetails }
}

export default useGuestDeliveryDetails