import { useCallback, useEffect, useState } from 'react'

import { productApi } from '../api/productApi.js'

const EMPTY_META = { page: 1, limit: 0, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false }

/**
 * One page of the product list for `query` (the productApi.listPage query). Refetches whenever the query
 * changes, and ignores responses for a query the user has already moved on from.
 * Returns { products, meta, status: 'loading' | 'ready' | 'error', error, retry }.
 */
export function useProductList(query) {
  const [attempt, setAttempt] = useState(0)
  // A stable key, so a new object with the same values doesn't refetch; `attempt` makes "Try again" refetch.
  const requestKey = JSON.stringify({ query, attempt })
  // The last finished request and which key it answered. Anything else means the current key is still loading.
  const [result, setResult] = useState({ key: null, products: [], meta: EMPTY_META, error: null })

  useEffect(() => {
    let isCancelled = false

    productApi
      .listPage(JSON.parse(requestKey).query)
      .then(({ products, meta }) => {
        if (!isCancelled) setResult({ key: requestKey, products, meta: meta ?? EMPTY_META, error: null })
      })
      .catch((error) => {
        if (isCancelled) return
        // An unknown category slug in the URL is "nothing matches", not a failure.
        const isNotFound = error.status === 404
        setResult({ key: requestKey, products: [], meta: EMPTY_META, error: isNotFound ? null : error })
      })

    return () => {
      isCancelled = true
    }
  }, [requestKey])

  const retry = useCallback(() => setAttempt((count) => count + 1), [])

  const isCurrent = result.key === requestKey
  const status = !isCurrent ? 'loading' : result.error ? 'error' : 'ready'

  return {
    products: isCurrent ? result.products : [],
    meta: isCurrent ? result.meta : EMPTY_META,
    status,
    error: isCurrent ? result.error : null,
    retry,
  }
}

export default useProductList