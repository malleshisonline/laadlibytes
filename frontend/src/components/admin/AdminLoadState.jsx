import { LoaderCircle, RotateCw } from 'lucide-react'

import { ADMIN_BUTTON_SECONDARY } from './adminStyles.js'

/**
 * What a list or detail shows while it loads, when it failed, or when there is nothing to show. Renders
 * nothing once `status` is 'ready' and there are rows, so the caller simply renders its content after it.
 */
function AdminLoadState({ status, isEmpty = false, emptyText = 'Nothing here yet.', onRetry }) {
  if (status === 'loading') {
    return (
      <div role="status" className="flex items-center justify-center gap-2 py-12 text-navy-800">
        <LoaderCircle size={22} strokeWidth={1.75} className="animate-spin" aria-hidden="true" />
        <span className="text-sm">Loading…</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="py-12 text-center">
        <p className="text-body">Couldn’t load this. Check the connection and try again.</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className={`${ADMIN_BUTTON_SECONDARY} mt-3`}>
            <RotateCw size={16} strokeWidth={1.75} aria-hidden="true" />
            Try again
          </button>
        )}
      </div>
    )
  }

  if (status === 'not-found') return <p className="py-12 text-center text-body">Not found. It may have been removed.</p>

  if (isEmpty) return <p className="py-12 text-center text-muted">{emptyText}</p>

  return null
}

export default AdminLoadState