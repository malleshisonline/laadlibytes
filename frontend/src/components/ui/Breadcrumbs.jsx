import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'

/**
 * Breadcrumb trail. `items` is [{ label, to? }]; the last item is the current page (no link). Long labels are
 * truncated so the trail stays on one line on phones.
 */
function Breadcrumbs({ items, className = '' }) {
  return (
    <nav aria-label='Breadcrumb' className={className}>
      <ol className='flex min-w-0 items-center gap-1 text-xs text-muted sm:text-sm'>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className={`flex items-center gap-1 ${isLast ? 'min-w-0' : 'shrink-0'}`}>
              {item.to && !isLast ? (
                <Link to={item.to} className='rounded transition hover:text-caramel-700 hover:underline'>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} className='truncate font-semibold text-navy-800'>
                  {item.label}
                </span>
              )}
              {!isLast && <ChevronRight size={14} strokeWidth={1.75} aria-hidden='true' className='shrink-0' />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export { Breadcrumbs }
export default Breadcrumbs