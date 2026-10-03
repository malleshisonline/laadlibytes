// Mirrors ORDER_STATUSES and PAYMENT_STATUSES in backend/src/modules/order/order.model.js. The shop takes no
// cancellations, refunds or returns, so there are no such statuses. 'voided' is the shop setting aside an order
// that was never paid for.

/** The delivery journey in order, as the tracking steps show it. */
export const ORDER_STEPS = ['placed', 'confirmed', 'packed', 'shipped', 'delivered']

const ORDER_STATUS_LABELS = {
  placed: 'Order placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  voided: 'Not completed',
}

const PAYMENT_STATUS_LABELS = {
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Payment failed',
}

// Badge colours from the palette: navy while on the way, green when done, warning or error when it needs a look.
const ORDER_STATUS_BADGE_CLASSES = {
  placed: 'bg-lightblue-100 text-navy-800',
  confirmed: 'bg-lightblue-100 text-navy-800',
  packed: 'bg-lightblue-100 text-navy-800',
  shipped: 'bg-lightblue-100 text-navy-800',
  delivered: 'bg-leaf-600/10 text-success',
  voided: 'bg-cream-100 text-error',
}

const PAYMENT_STATUS_BADGE_CLASSES = {
  pending: 'bg-cream-100 text-warning',
  paid: 'bg-leaf-600/10 text-success',
  failed: 'bg-cream-100 text-error',
}

export const orderStatusLabel = (status) => ORDER_STATUS_LABELS[status] ?? status
export const paymentStatusLabel = (status) => PAYMENT_STATUS_LABELS[status] ?? status
export const orderStatusBadgeClasses = (status) => ORDER_STATUS_BADGE_CLASSES[status] ?? 'bg-lightblue-100 text-navy-800'
export const paymentStatusBadgeClasses = (status) => PAYMENT_STATUS_BADGE_CLASSES[status] ?? 'bg-lightblue-100 text-navy-800'

const orderDateFormatter = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const orderDateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/** "3 Oct 2026" */
export const formatOrderDate = (isoDate) => orderDateFormatter.format(new Date(isoDate))

/** "3 Oct 2026, 4:05 pm" */
export const formatOrderDateTime = (isoDate) => orderDateTimeFormatter.format(new Date(isoDate))

/**
 * An order line in the cart's shape ({ product: { id, name, slug, price, image }, quantity, lineTotal }), so the
 * checkout's OrderItemsSummary can show a placed order's own copy of its items.
 */
export const toSummaryItem = (item) => ({
  product: { id: item.product, name: item.name, slug: item.slug, price: item.price, image: item.image?.url ? item.image : null },
  quantity: item.quantity,
  lineTotal: item.lineTotal,
})