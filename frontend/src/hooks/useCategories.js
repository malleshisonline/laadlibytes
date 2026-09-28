import { useEffect, useState } from 'react'

import { categoryApi } from '../api/categoryApi.js'

// One request per page session, shared by every caller (desktop dropdown and mobile menu). A failed request is
// forgotten so the next mount can try again.
let categoriesRequest = null

function loadCategories() {
  categoriesRequest ??= categoryApi.list().catch((error) => {
    categoriesRequest = null
    throw error
  })
  return categoriesRequest
}

/** The storefront categories: { categories, isLoading, hasError }. */
export function useCategories() {
  const [state, setState] = useState({ categories: [], isLoading: true, hasError: false })

  useEffect(() => {
    let isCancelled = false
    loadCategories()
      .then((categories) => {
        if (!isCancelled) setState({ categories: categories ?? [], isLoading: false, hasError: false })
      })
      .catch(() => {
        if (!isCancelled) setState({ categories: [], isLoading: false, hasError: true })
      })
    return () => {
      isCancelled = true
    }
  }, [])

  return state
}

export default useCategories