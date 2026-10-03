import { ChevronLeft, ChevronRight } from 'lucide-react'

import { ADMIN_BUTTON_SECONDARY } from './adminStyles.js'

/** "Page 2 of 5 · 93 results" with previous / next, from the API's pagination meta. */
function AdminPagination({ meta, onPageChange }) {
  if (!meta || meta.totalPages <= 1) {
    return meta ? <p className="mt-4 text-sm text-muted">{meta.total} {meta.total === 1 ? 'result' : 'results'}</p> : null
  }

  return (
    <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        Page {meta.page} of {meta.totalPages} · {meta.total} results
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={!meta.hasPrevPage}
          className={ADMIN_BUTTON_SECONDARY}
        >
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={!meta.hasNextPage}
          className={ADMIN_BUTTON_SECONDARY}
        >
          Next
          <ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}

export default AdminPagination