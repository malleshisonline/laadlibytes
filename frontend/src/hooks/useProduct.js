import { useCallback, useEffect, useState } from 'react'

import { productApi } from '../api/productApi.js'

/**
 * One product by slug. Returns { product, status: 'loading' | 'ready' | 'not-found' | 'error', retry }.
 * Refetches when the slug changes (e.g. following a related product) and ignores stale responses.
 */
export function useProduct(slug) {
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${slug}#${attempt}`
  // The last finished request and which key it answered; anything else means the current key is loading.
  const [result, setResult] = useState({ key: null, product: null, status: 'loading' })

  useEffect(() => {
    let isCancelled = false

    productApi
      .getBySlug(slug)
      .then((product) => {
        if (!isCancelled) setResult({ key: requestKey, product, status: 'ready' })
      })
      .catch((error) => {
        if (!isCancelled) {
          setResult({ key: requestKey, product: null, status: error.status === 404 ? 'not-found' : 'error' })
        }
      })

    return () => {
      isCancelled = true
    }
  }, [slug, requestKey])

  const retry = useCallback(() => setAttempt((count) => count + 1), [])

  const isCurrent = result.key === requestKey
  return {
    product: isCurrent ? result.product : null,
    status: isCurrent ? result.status : 'loading',
    retry,
  }
}

export default useProduct