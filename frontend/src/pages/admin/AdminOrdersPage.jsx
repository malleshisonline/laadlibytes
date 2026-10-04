import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Search } from 'lucide-react'

import { adminApi } from '../../api/adminApi.js'
import AdminLoadState from '../../components/admin/AdminLoadState.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import AdminPagination from '../../components/admin/AdminPagination.jsx'
import {
  ADMIN_BADGE,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_TABLE,
  ADMIN_TD,
  ADMIN_TH,
} from '../../components/admin/adminStyles.js'
import { adminOrderPath } from '../../constants/appRoutepoints.js'
import { useAdminList } from '../../hooks/useAdminList.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { formatIndianMobile } from '../../utils/addressValidation.js'
import {
  formatOrderDateTime,
  ORDER_STEPS,
  orderStatusBadgeClasses,
  adminOrderStatusLabel,
  paymentStatusBadgeClasses,
  paymentStatusLabel,
} from '../../utils/orderStatus.js'
import { formatPrice } from '../../utils/productFormatters.js'

const STATUS_OPTIONS = [...ORDER_STEPS, 'voided']
const PAYMENT_OPTIONS = ['pending', 'paid', 'failed']

/** /admin/orders. Filters live in the URL, so a dashboard card can open a filtered list and Back keeps it. */
function AdminOrdersPage() {
  useDocumentTitle('Orders')
  const [searchParams, setSearchParams] = useSearchParams()
  const params = {
    status: searchParams.get('status') ?? '',
    paymentStatus: searchParams.get('paymentStatus') ?? '',
    search: searchParams.get('search') ?? '',
    sort: searchParams.get('sort') ?? 'newest',
    page: Number(searchParams.get('page')) || 1,
  }
  const [searchText, setSearchText] = useState(params.search)
  const { items: orders, meta, status, reload } = useAdminList(adminApi.orders.list, params)

  /** Changes filters and goes back to page 1 (except when the page itself is what changes). */
  function updateParams(changes) {
    const next = { ...params, page: 1, ...changes }
    setSearchParams(
      Object.fromEntries(Object.entries(next).filter(([key, value]) => value && !(key === 'page' && value === 1))),
    )
  }

  function handleSearch(event) {
    event.preventDefault()
    updateParams({ search: searchText.trim() })
  }

  return (
    <>
      <AdminPageHeader title="Orders" description="Confirm, pack and ship orders, and record payments." />

      <div className={`${ADMIN_CARD} mb-4`}>
        <div className="grid gap-3 md:grid-cols-12">
          <form onSubmit={handleSearch} className="md:col-span-6" role="search">
            <label htmlFor="order-search" className={ADMIN_LABEL}>
              Search
            </label>
            <div className="flex gap-2">
              <input
                id="order-search"
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Order number, name, phone or email"
                className={ADMIN_INPUT}
              />
              <button type="submit" className={ADMIN_BUTTON_SECONDARY} aria-label="Search orders">
                <Search size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </form>
          <div className="md:col-span-3">
            <label htmlFor="order-status" className={ADMIN_LABEL}>
              Status
            </label>
            <select
              id="order-status"
              value={params.status}
              onChange={(event) => updateParams({ status: event.target.value })}
              className={ADMIN_INPUT}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {adminOrderStatusLabel(option)}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label htmlFor="order-payment" className={ADMIN_LABEL}>
              Payment
            </label>
            <select
              id="order-payment"
              value={params.paymentStatus}
              onChange={(event) => updateParams({ paymentStatus: event.target.value })}
              className={ADMIN_INPUT}
            >
              <option value="">All payments</option>
              {PAYMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {paymentStatusLabel(option)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={ADMIN_CARD}>
        <AdminLoadState
          status={status}
          isEmpty={!orders.length}
          emptyText="No orders match these filters."
          onRetry={reload}
        />
        {status === 'ready' && orders.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className={ADMIN_TABLE}>
                <thead>
                  <tr>
                    <th className={ADMIN_TH}>Order</th>
                    <th className={ADMIN_TH}>Customer</th>
                    <th className={ADMIN_TH}>Items</th>
                    <th className={ADMIN_TH}>Total</th>
                    <th className={ADMIN_TH}>Status</th>
                    <th className={ADMIN_TH}>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-lightblue-50">
                      <td className={ADMIN_TD}>
                        <Link to={adminOrderPath(order.id)} className="font-bold text-navy-800 hover:underline">
                          {order.orderNumber}
                        </Link>
                        <span className="block text-xs text-muted">{formatOrderDateTime(order.createdAt)}</span>
                      </td>
                      <td className={ADMIN_TD}>
                        <span className="block font-semibold text-navy-800">{order.address.name}</span>
                        <span className="block text-xs text-muted">{formatIndianMobile(order.contact.phone)}</span>
                      </td>
                      <td className={ADMIN_TD}>{order.itemCount}</td>
                      <td className={`${ADMIN_TD} font-bold text-navy-800`}>{formatPrice(order.total)}</td>
                      <td className={ADMIN_TD}>
                        <span className={`${ADMIN_BADGE} ${orderStatusBadgeClasses(order.status)}`}>
                          {adminOrderStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className={ADMIN_TD}>
                        <span className={`${ADMIN_BADGE} ${paymentStatusBadgeClasses(order.paymentStatus)}`}>
                          {paymentStatusLabel(order.paymentStatus)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination meta={meta} onPageChange={(page) => updateParams({ page })} />
          </>
        )}
      </div>
    </>
  )
}

export default AdminOrdersPage