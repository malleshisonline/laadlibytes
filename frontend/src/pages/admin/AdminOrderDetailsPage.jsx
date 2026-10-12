import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'react-hot-toast'
import { ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-react'

import { adminApi } from '../../api/adminApi.js'
import AdminLoadState from '../../components/admin/AdminLoadState.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import {
  ADMIN_BADGE,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_LABEL,
} from '../../components/admin/adminStyles.js'
import PriceDetailsBox from '../../components/cart/PriceDetailsBox.jsx'
import OrderItemsSummary from '../../components/checkout/OrderItemsSummary.jsx'
import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { formatAddressLine, formatIndianMobile } from '../../utils/addressValidation.js'
import {
  formatOrderDateTime,
  ORDER_STEPS,
  orderStatusBadgeClasses,
  adminOrderStatusLabel,
  paymentStatusBadgeClasses,
  paymentStatusLabel,
  toSummaryItem,
} from '../../utils/orderStatus.js'

const NEXT_STEP_LABELS = {
  packed: 'Mark as packed',
  shipped: 'Mark as shipped',
  delivered: 'Mark as delivered',
}

/** Backend refusals an admin can act on, in plain words; anything else falls back to the API's message. */
function actionErrorMessage(error) {
  if (error.code === 'ORDER_CHANGED') return 'Someone else just changed this order. It has been reloaded; check it and try again.'
  if (error.status === 0) return 'Couldn’t reach the server. Check the connection and try again.'
  return error.message || 'That didn’t work. Please try again.'
}

function useAdminOrder(id) {
  const [order, setOrder] = useState(null)
  const [status, setStatus] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isCancelled = false
    adminApi.orders
      .get(id)
      .then((data) => {
        if (isCancelled) return
        setOrder(data)
        setStatus('ready')
      })
      .catch((error) => {
        if (!isCancelled) setStatus(error.status === 404 || error.status === 400 ? 'not-found' : 'error')
      })
    return () => {
      isCancelled = true
    }
  }, [id, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])
  return { order, setOrder, status, reload }
}

function Section({ title, children, className = '' }) {
  return (
    <section className={`${ADMIN_CARD} ${className}`}>
      <h2 className="mb-3 text-lg font-semibold text-navy-800">{title}</h2>
      {children}
    </section>
  )
}

/** The next delivery step; packing is available only after verified payment. */
function StatusActions({ order, onChange, isBusy }) {
  const [note, setNote] = useState('')
  const currentIndex = ORDER_STEPS.indexOf(order.status)
  const nextStatus = currentIndex >= 0 ? ORDER_STEPS[currentIndex + 1] : undefined
  const canPack = nextStatus !== 'packed' || order.paymentStatus === 'paid'

  if (!nextStatus) return <p className="text-sm text-muted">This order is complete.</p>

  async function change(status) {
    const done = await onChange(status, note)
    if (done) setNote('')
  }

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="status-note" className={ADMIN_LABEL}>
          Note <span className="font-normal text-muted">(optional, only admins see it)</span>
        </label>
        <input
          id="status-note"
          value={note}
          maxLength={500}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Courier: DTDC, tracking 1234567890"
          className={ADMIN_INPUT}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {nextStatus && (
          <button
            type="button"
            disabled={isBusy || !canPack}
            onClick={() => change(nextStatus)}
            className={ADMIN_BUTTON_PRIMARY}
          >
            {isBusy ? (
              <LoaderCircle size={16} strokeWidth={1.75} aria-hidden="true" className="animate-spin" />
            ) : (
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
            )}
            {NEXT_STEP_LABELS[nextStatus]}
          </button>
        )}
      </div>
      {!canPack && <p className="text-xs text-muted">Packing can begin after Razorpay verifies payment.</p>}
    </div>
  )
}

function HistoryList({ history }) {
  return (
    <ol className="space-y-3">
      {[...history].reverse().map((entry, index) => (
        <li key={`${entry.at}-${index}`} className="border-l-2 border-lightblue-300 pl-3">
          <p className="text-sm font-semibold text-navy-800">
            {entry.event === 'payment' ? paymentStatusLabel(entry.value) : adminOrderStatusLabel(entry.value)}
          </p>
          <p className="text-xs text-muted">
            {formatOrderDateTime(entry.at)}
            {entry.by?.name ? ` · ${entry.by.name}` : ''}
          </p>
          {entry.note && <p className="mt-1 text-sm wrap-break-word text-body">{entry.note}</p>}
        </li>
      ))}
    </ol>
  )
}

/** /admin/orders/:id: everything about one order, and the buttons that move it along. */
function AdminOrderDetailsPage() {
  const { id } = useParams()
  const { order, setOrder, status, reload } = useAdminOrder(id)
  const [isBusy, setIsBusy] = useState(false)
  useDocumentTitle(order ? `Order ${order.orderNumber}` : 'Order')

  /** Runs one change; the API answers with the whole updated order. Resolves true on success. */
  async function runAction(call, successMessage) {
    setIsBusy(true)
    try {
      setOrder(await call())
      toast.success(successMessage)
      return true
    } catch (error) {
      toast.error(actionErrorMessage(error))
      if (error.code === 'ORDER_CHANGED') reload()
      return false
    } finally {
      setIsBusy(false)
    }
  }

  const backLink = (
    <Link to={APP_ROUTES.ADMIN_ORDERS} className={ADMIN_BUTTON_SECONDARY}>
      <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
      All orders
    </Link>
  )

  if (status !== 'ready') {
    return (
      <>
        <AdminPageHeader title="Order" actions={backLink} />
        <AdminLoadState status={status} onRetry={reload} />
      </>
    )
  }

  const customer = order.user

  return (
    <>
      <AdminPageHeader
        title={order.orderNumber}
        description={`Placed on ${formatOrderDateTime(order.createdAt)}`}
        actions={backLink}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <span className={`${ADMIN_BADGE} ${orderStatusBadgeClasses(order.status)} text-sm`}>{adminOrderStatusLabel(order.status)}</span>
        <span className={`${ADMIN_BADGE} ${paymentStatusBadgeClasses(order.paymentStatus)} text-sm`}>
          {paymentStatusLabel(order.paymentStatus)}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <Section title="Delivery status">
            <StatusActions
              key={order.status}
              order={order}
              isBusy={isBusy}
              onChange={(nextStatus, note) =>
                runAction(
                  () => adminApi.orders.updateStatus(order.id, { status: nextStatus, note: note.trim() }),
                  `Order ${adminOrderStatusLabel(nextStatus).toLowerCase()}`,
                )
              }
            />
          </Section>

          <Section title="Payment">
            {order.paymentStatus === 'paid' && (
              <p className="mb-3 text-sm text-body">
                Verified by Razorpay{order.paidAt ? ` on ${formatOrderDateTime(order.paidAt)}` : ''}
                {order.paymentReference ? ` · payment ${order.paymentReference}` : ''}
              </p>
            )}
            {order.paymentStatus === 'pending' && (
              <p className="text-sm text-body">Payment has not been verified. The order cannot be packed yet.</p>
            )}
            {order.paymentStatus === 'failed' && (
              <p className="text-sm text-body">Razorpay reported a failed payment attempt; the order remains placed.</p>
            )}
            {order.paymentStatus === 'paid' && <p className="text-sm text-muted">Payment status is updated only by verified Razorpay events.</p>}
          </Section>

          <Section title={`Items (${order.itemCount})`}>
            <OrderItemsSummary items={order.items.map(toSummaryItem)} />
            <p className="mt-2 text-xs text-muted">SKUs: {order.items.map((item) => `${item.sku} × ${item.quantity}`).join(', ')}</p>
          </Section>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <Section title="Customer">
            <p className="font-semibold text-navy-800">{customer?.name ?? 'Deleted account'}</p>
            {customer?.email && <p className="text-sm break-all text-body">{customer.email}</p>}
            {customer?.phone && <p className="text-sm text-body">{formatIndianMobile(customer.phone)}</p>}
            <p className="mt-3 text-xs font-bold tracking-wide text-muted uppercase">Contact for this order</p>
            <p className="text-sm text-body">
              <a href={`tel:${order.contact.phone}`} className="font-semibold text-navy-700 hover:underline">
                {formatIndianMobile(order.contact.phone)}
              </a>
              {order.contact.email && <span className="block break-all">{order.contact.email}</span>}
            </p>
          </Section>

          <Section title="Delivery address">
            <p className="font-semibold text-navy-800">
              {order.address.name} · {formatIndianMobile(order.address.phone)}
            </p>
            <address className="mt-1 text-sm leading-relaxed not-italic wrap-break-word text-body">
              {formatAddressLine(order.address)}
            </address>
          </Section>

          <PriceDetailsBox cart={order} />

          <Section title="History">
            <HistoryList history={order.history} />
          </Section>
        </div>
      </div>
    </>
  )
}

export default AdminOrderDetailsPage
