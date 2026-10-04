import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, Inbox, Package, PackageX, ShoppingBag, Truck, Users, Wallet } from 'lucide-react'

import { adminApi } from '../../api/adminApi.js'
import AdminLoadState from '../../components/admin/AdminLoadState.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import { ADMIN_CARD } from '../../components/admin/adminStyles.js'
import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { ORDER_STEPS, adminOrderStatusLabel } from '../../utils/orderStatus.js'

function StatCard({ label, value, hint, Icon, to, tone = 'navy' }) {
  const toneClasses = {
    navy: 'bg-lightblue-100 text-navy-800',
    warning: 'bg-cream-100 text-warning',
    error: 'bg-cream-100 text-error',
  }
  return (
    <Link to={to} className={`${ADMIN_CARD} flex items-center gap-4 transition hover:border-lightblue-300 hover:shadow-card`}>
      <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${toneClasses[tone]}`}>
        <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-2xl font-extrabold text-navy-800">{value}</span>
        <span className="block text-sm font-semibold text-body">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </Link>
  )
}

const ordersWith = (params) => `${APP_ROUTES.ADMIN_ORDERS}?${new URLSearchParams(params)}`
const productsWith = (params) => `${APP_ROUTES.ADMIN_PRODUCTS}?${new URLSearchParams(params)}`

/** /admin: the counts that say what needs doing today. Every card opens the list behind it. */
function AdminDashboardPage() {
  useDocumentTitle('Admin dashboard')
  const [summary, setSummary] = useState(null)
  const [status, setStatus] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isCancelled = false
    adminApi
      .summary()
      .then((data) => {
        if (isCancelled) return
        setSummary(data)
        setStatus('ready')
      })
      .catch(() => {
        if (!isCancelled) setStatus('error')
      })
    return () => {
      isCancelled = true
    }
  }, [reloadKey])

  const retry = useCallback(() => {
    setStatus('loading')
    setReloadKey((key) => key + 1)
  }, [])

  if (status !== 'ready') {
    return (
      <>
        <AdminPageHeader title="Dashboard" />
        <AdminLoadState status={status} onRetry={retry} />
      </>
    )
  }

  const { orders, products, users, enquiries } = summary
  const toShip = orders.byStatus.confirmed + orders.byStatus.packed

  return (
    <>
      <AdminPageHeader title="Dashboard" description="What needs your attention today." />

      <h2 className="mb-3 text-lg font-semibold text-navy-800">Orders</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="New orders"
          hint="Placed, waiting to be confirmed"
          value={orders.byStatus.placed}
          Icon={ShoppingBag}
          to={ordersWith({ status: 'placed' })}
        />
        <StatCard
          label="Payment pending"
          hint="Not marked paid yet"
          value={orders.unpaid}
          Icon={Wallet}
          tone={orders.unpaid ? 'warning' : 'navy'}
          to={ordersWith({ paymentStatus: 'pending' })}
        />
        <StatCard
          label="To pack and ship"
          hint="Confirmed or packed"
          value={toShip}
          Icon={Truck}
          to={ordersWith({ status: 'confirmed' })}
        />
        <StatCard label="All orders" value={orders.total} Icon={Package} to={APP_ROUTES.ADMIN_ORDERS} />
      </div>

      <div className={`${ADMIN_CARD} mb-6`}>
        <h3 className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">Orders by status</h3>
        <ul className="flex flex-wrap gap-2">
          {[...ORDER_STEPS, 'voided'].map((step) => (
            <li key={step}>
              <Link
                to={ordersWith({ status: step })}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-3 text-sm text-navy-800 hover:bg-lightblue-100"
              >
                {adminOrderStatusLabel(step)}
                <span className="rounded-full bg-lightblue-100 px-2 text-xs font-bold">{orders.byStatus[step]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <h2 className="mb-3 text-lg font-semibold text-navy-800">Catalogue and customers</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Out of stock"
          hint="Published products with 0 stock"
          value={products.outOfStock}
          Icon={PackageX}
          tone={products.outOfStock ? 'error' : 'navy'}
          to={productsWith({ stock: 'out' })}
        />
        <StatCard
          label="Low stock"
          hint={`${products.lowStockThreshold} or fewer left`}
          value={products.lowStock}
          Icon={AlertTriangle}
          tone={products.lowStock ? 'warning' : 'navy'}
          to={productsWith({ stock: 'low' })}
        />
        <StatCard
          label="Customers"
          hint={`${users.admins} ${users.admins === 1 ? 'admin' : 'admins'} besides`}
          value={users.customers}
          Icon={Users}
          to={APP_ROUTES.ADMIN_USERS}
        />
        <StatCard
          label="New enquiries"
          hint={`${enquiries.total} in all`}
          value={enquiries.new}
          Icon={Inbox}
          tone={enquiries.new ? 'warning' : 'navy'}
          to={`${APP_ROUTES.ADMIN_ENQUIRIES}?status=new`}
        />
      </div>
      <p className="mt-3 text-sm text-muted">
        {products.active} of {products.total} products are published.
      </p>
    </>
  )
}

export default AdminDashboardPage