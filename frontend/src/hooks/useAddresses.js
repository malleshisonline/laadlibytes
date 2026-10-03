import { useCallback, useEffect, useState } from 'react'

import { addressApi } from '../api/addressApi.js'

// Matches MAX_ADDRESSES in backend/src/modules/address/address.model.js.
export const MAX_ADDRESSES = 5

/** The address with `id`, else the default (the API lists it first), else null. */
export function pickAddress(addresses, id) {
  if (!addresses?.length) return null
  return addresses.find((address) => address.id === id) ?? addresses.find((address) => address.isDefault) ?? addresses[0]
}

/**
 * The signed-in user's saved delivery addresses, for the cart and the order summary. Pass `enabled = false`
 * for a guest, who has none. Returns { addresses, status, retry, createAddress }; `status` is
 * 'idle' | 'loading' | 'error' | 'ready'. `createAddress` resolves to the new address and throws the
 * ApiRequestError on failure, so AddressForm can show it.
 */
export function useAddresses(enabled = true) {
  const [addresses, setAddresses] = useState(null)
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle')
  const [reloadKey, setReloadKey] = useState(0)

  // Signing in or out on the same page starts over (adjusting state during render, not in an effect).
  const [loadedFor, setLoadedFor] = useState(enabled)
  if (loadedFor !== enabled) {
    setLoadedFor(enabled)
    setAddresses(null)
    setStatus(enabled ? 'loading' : 'idle')
  }

  useEffect(() => {
    if (!enabled) return undefined
    let isCancelled = false
    addressApi
      .list()
      .then((list) => {
        if (isCancelled) return
        setAddresses(list)
        setStatus('ready')
      })
      .catch(() => {
        if (!isCancelled) setStatus('error')
      })
    return () => {
      isCancelled = true
    }
  }, [enabled, reloadKey])

  const retry = useCallback(() => {
    setStatus('loading')
    setReloadKey((key) => key + 1)
  }, [])

  // The API answers with the whole list; the new address is the one whose id wasn't there before.
  const createAddress = useCallback(
    async (payload) => {
      const list = await addressApi.create(payload)
      const knownIds = new Set(addresses?.map((address) => address.id))
      setAddresses(list)
      setStatus('ready')
      return list.find((address) => !knownIds.has(address.id)) ?? list[list.length - 1]
    },
    [addresses],
  )

  return { addresses, status, retry, createAddress }
}

export default useAddresses