import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * Mobile / tablet filter panel that slides in from the left over a dimmed page. Filters apply as they are
 * picked; "Show N products" just closes it. Escape or the backdrop also close it, and the page behind does not
 * scroll while it is open.
 */
function FilterDrawer({ isOpen, onClose, onClearAll, resultCount, children }) {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    closeButtonRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <div
      inert={!isOpen}
      className={`fixed inset-0 z-50 lg:hidden ${isOpen ? 'visible' : 'invisible'}`}
    >
      <div
        aria-hidden='true'
        onClick={onClose}
        className={`absolute inset-0 bg-navy-950/40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />

      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='filter-drawer-title'
        className={`absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-cream-50 shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='flex items-center justify-between border-b border-cream-200 px-4 py-3'>
          <h2 id='filter-drawer-title' className='text-lg font-semibold text-navy-800'>
            Filters
          </h2>
          <button
            ref={closeButtonRef}
            type='button'
            onClick={onClose}
            aria-label='Close filters'
            className='inline-flex size-11 items-center justify-center rounded-full text-navy-800 transition hover:bg-cream-100'
          >
            <X size={20} strokeWidth={1.75} aria-hidden='true' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto overscroll-contain px-3 py-4'>{children}</div>

        <div className='flex gap-3 border-t border-cream-200 bg-surface px-4 py-3'>
          <button
            type='button'
            onClick={onClearAll}
            className='min-h-11 flex-1 rounded-lg border border-navy-800 bg-surface text-sm font-semibold text-navy-800 transition hover:bg-lightblue-100'
          >
            Clear all
          </button>
          <button
            type='button'
            onClick={onClose}
            className='min-h-11 flex-1 rounded-lg bg-navy-800 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'
          >
            {resultCount === null ? 'Show products' : `Show ${resultCount} product${resultCount === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export { FilterDrawer }
export default FilterDrawer