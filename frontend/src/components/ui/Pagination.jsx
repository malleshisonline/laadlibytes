import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_BUTTON_CLASSES =
  'inline-flex size-10 items-center justify-center rounded-lg border text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 disabled:cursor-not-allowed disabled:opacity-40'

/**
 * Page numbers to show: always the first and last, the current one and its neighbours, with `null` where a
 * gap is collapsed into "…". E.g. page 6 of 12 → [1, null, 5, 6, 7, null, 12].
 */
function visiblePages(current, total) {
  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)

  return sorted.flatMap((page, index) => (index > 0 && page - sorted[index - 1] > 1 ? [null, page] : [page]))
}

/** Numbered pagination with Previous / Next. Renders nothing for a single page. */
function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label='Pagination' className='flex items-center justify-center gap-1.5'>
      <button
        type='button'
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label='Previous page'
        className={`${PAGE_BUTTON_CLASSES} border-line bg-surface text-navy-800 hover:bg-lightblue-100`}
      >
        <ChevronLeft size={18} strokeWidth={1.75} aria-hidden='true' />
      </button>

      {visiblePages(page, totalPages).map((pageNumber, index) =>
        pageNumber === null ? (
          <span key={`gap-${index}`} aria-hidden='true' className='px-1 text-muted'>
            …
          </span>
        ) : (
          <button
            key={pageNumber}
            type='button'
            onClick={() => onPageChange(pageNumber)}
            aria-label={`Page ${pageNumber}`}
            aria-current={pageNumber === page ? 'page' : undefined}
            className={`${PAGE_BUTTON_CLASSES} ${
              pageNumber === page
                ? 'border-navy-800 bg-navy-800 text-white shadow-md'
                : 'border-line bg-surface text-navy-800 hover:border-caramel-500 hover:bg-cream-50'
            }`}
          >
            {pageNumber}
          </button>
        ),
      )}

      <button
        type='button'
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label='Next page'
        className={`${PAGE_BUTTON_CLASSES} border-line bg-surface text-navy-800 hover:bg-lightblue-100`}
      >
        <ChevronRight size={18} strokeWidth={1.75} aria-hidden='true' />
      </button>
    </nav>
  )
}

export { Pagination }
export default Pagination