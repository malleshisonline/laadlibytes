import { Link } from 'react-router'
import { Package, ShoppingBag } from 'lucide-react'

import { APP_ROUTES } from '../../constants/appRoutepoints.js'

import AccountCard from './AccountCard.jsx'

/** Order history. Orders don't exist yet (checkout is the next phase), so this is the empty state for now. */
function OrdersSection() {
  return (
    <AccountCard title="My Orders">
      <div className="py-8 text-center">
        <Package size={40} strokeWidth={1.5} className="mx-auto text-muted" aria-hidden="true" />
        <h3 className="mt-3 text-lg font-semibold text-navy-800">No orders yet</h3>
        <p className="mt-1 text-body">When you place an order, you can follow it here.</p>
        <Link
          to={APP_ROUTES.PRODUCTS}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-800 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700"
        >
          <ShoppingBag size={16} strokeWidth={1.75} aria-hidden="true" />
          Start shopping
        </Link>
      </div>
    </AccountCard>
  )
}

export default OrdersSection