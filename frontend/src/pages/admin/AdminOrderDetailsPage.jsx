import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Ban, CircleCheck, LoaderCircle } from 'lucide-react'

import { adminApi } from '../../api/adminApi.js'
import AdminLoadState from '../../components/admin/AdminLoadState.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import {
  ADMIN_BADGE,
  ADMIN_BUTTON_DANGER,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_TEXTAREA,
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

// Mirrors ORDER_STATUS_TRANSITIONS in the backend: one step forward at a time, and voiding only before shipping.
const VOIDABLE_STATUSES = ['placed', 'confirmed', 'packed']

const NEXT_STEP_LABELS = {
  confirmed: 'Confirm order',
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

/** The next delivery step, and Void while the order is unpaid and not yet shipped. */
function StatusActions({ order, onChange, isBusy }) {
  const [note, setNote] = useState('')
  const currentIndex = ORDER_STEPS.indexOf(order.status)
  const nextStatus = currentIndex >= 0 ? ORDER_STEPS[currentIndex + 1] : undefined
  const canVoid = VOIDABLE_STATUSES.includes(order.status) && order.paymentStatus !== 'paid'

  if (!nextStatus && !canVoid) {
    return (
      <p className="text-sm text-muted">
        {order.status === 'voided' ? 'This order was voided; its stock is back on sale.' : 'This order is complete.'}
      </p>
    )
  }

  async function change(status) {
    if (
      status === 'voided' &&
      !window.confirm('Void this unpaid order? Its items go back into stock. This cannot be undone.')
    ) {
      return
    }
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
          <button type="button" disabled={isBusy} onClick={() => change(nextStatus)} className={ADMIN_BUTTON_PRIMARY}>
            {isBusy ? (
              <LoaderCircle size={16} strokeWidth={1.75} aria-hidden="true" className="animate-spin" />
            ) : (
              <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
            )}
            {NEXT_STEP_LABELS[nextStatus]}
          </button>
        )}
        {canVoid && (
          <button type="button" disabled={isBusy} onClick={() => change('voided')} className={ADMIN_BUTTON_DANGER}>
            <Ban size={16} strokeWidth={1.75} aria-hidden="true" />
            Void (never paid)
          </button>
        )}
      </div>
      {!canVoid && VOIDABLE_STATUSES.includes(order.status) && (
        <p className="text-xs text-muted">A paid order cannot be voided: the shop takes no cancellations or refunds.</p>
      )}
    </div>
  )
}

/** Records the payment by hand until a payment gateway does it. */
function PaymentForm({ order, onSave, isBusy }) {
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus === 'pending' ? 'paid' : order.paymentStatus)
  const [reference, setReference] = useState(order.paymentReference ?? '')
  const [note, setNote] = useState('')

  if (order.status === 'voided') return <p className="text-sm text-muted">A voided order takes no payment.</p>

  async function handleSubmit(event) {
    event.preventDefault()
    const done = await onSave({ paymentStatus, reference: reference.trim(), note: note.trim() })
    if (done) setNote('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="payment-status" className={ADMIN_LABEL}>
            Payment status
          </label>
          <select
            id="payment-status"
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value)}
            className={ADMIN_INPUT}
          >
            <option value="paid">Paid</option>
            <option value="pending">Payment pending</option>
            <option value="failed">Payment failed</option>
          </select>
        </div>
        <div>
          <label htmlFor="payment-reference" className={ADMIN_LABEL}>
            UPI reference / UTR
          </label>
          <input
            id="payment-reference"
            value={reference}
            maxLength={100}
            onChange={(event) => setReference(event.target.value)}
            placeholder="e.g. 427381920011"
            className={ADMIN_INPUT}
          />
        </div>
      </div>
      <div>
        <label htmlFor="payment-note" className={ADMIN_LABEL}>
          Note <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="payment-note"
          rows={2}
          value={note}
          maxLength={500}
          onChange={(event) => setNote(event.target.value)}
          placeholder="e.g. Checked in the bank app"
          className={ADMIN_TEXTAREA}
        />
      </div>
      <button type="submit" disabled={isBusy} className={ADMIN_BUTTON_PRIMARY}>
        <CircleCheck size={16} strokeWidth={1.75} aria-hidden="true" />
        Save payment
      </button>
    </form>
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
                Paid{order.paidAt ? ` on ${formatOrderDateTime(order.paidAt)}` : ''}
                {order.paymentReference ? ` · reference ${order.paymentReference}` : ''}
              </p>
            )}
            <PaymentForm
              key={`${order.paymentStatus}-${order.paymentReference ?? ''}`}
              order={order}
              isBusy={isBusy}
              onSave={(changes) => runAction(() => adminApi.orders.updatePayment(order.id, changes), 'Payment saved')}
            />
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