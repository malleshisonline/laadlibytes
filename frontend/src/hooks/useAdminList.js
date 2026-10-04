import { useCallback, useEffect, useState } from 'react'

/**
 * One page of an admin list. `load(params)` resolves to { data, meta } (e.g. adminApi.orders.list); it is
 * called again whenever `params` (filters, search, page) changes, and responses for older params are ignored.
 * Returns { items, meta, status: 'loading' | 'error' | 'ready', reload, replaceItem }. `replaceItem` swaps in an
 * updated row (matched by id) after an inline edit, so the page doesn't have to reload.
 */
export function useAdminList(load, params) {
  const paramsKey = JSON.stringify(params)
  const [reloadCount, setReloadCount] = useState(0)
  const requestKey = `${paramsKey}#${reloadCount}`
  const [result, setResult] = useState({ key: null, items: [], meta: null, status: 'loading' })

  useEffect(() => {
    let isCancelled = false
    load(JSON.parse(paramsKey))
      .then(({ data, meta }) => {
        if (!isCancelled) setResult({ key: requestKey, items: data, meta, status: 'ready' })
      })
      .catch(() => {
        if (!isCancelled) setResult({ key: requestKey, items: [], meta: null, status: 'error' })
      })
    return () => {
      isCancelled = true
    }
  }, [load, paramsKey, requestKey])

  const reload = useCallback(() => setReloadCount((count) => count + 1), [])

  const replaceItem = useCallback((updated) => {
    const updatedId = updated.id ?? updated._id
    setResult((current) => ({
      ...current,
      items: current.items.map((item) => ((item.id ?? item._id) === updatedId ? { ...item, ...updated } : item)),
    }))
  }, [])

  // While a new request is in flight the previous rows stay on screen, so paging doesn't flash empty.
  const isCurrent = result.key === requestKey
  return {
    items: result.items,
    meta: result.meta,
    status: isCurrent ? result.status : result.key === null ? 'loading' : result.status,
    isRefreshing: !isCurrent && result.key !== null,
    reload,
    replaceItem,
  }
}

export default useAdminList