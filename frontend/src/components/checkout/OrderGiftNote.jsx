import { Gift } from 'lucide-react'

/**
 * The gift details of a placed order with a gift hamper: who it is for and the greeting card message. Renders
 * nothing for an order without either.
 */
function OrderGiftNote({ order, className = '' }) {
  if (!order?.recipientName && !order?.giftMessage) return null

  return (
    <div className={`rounded-xl border border-cream-200 bg-cream-50 p-4 ${className}`}>
      <p className='flex items-center gap-2 text-sm font-bold text-navy-800'>
        <Gift size={16} strokeWidth={1.75} aria-hidden='true' className='text-caramel-700' />
        Gift details
      </p>
      {order.recipientName && (
        <p className='mt-2 text-sm text-body'>
          <span className='font-semibold text-navy-800'>For:</span> {order.recipientName}
        </p>
      )}
      {order.giftMessage && (
        <p className='mt-1 text-sm whitespace-pre-wrap text-body'>
          <span className='font-semibold text-navy-800'>Message:</span> {order.giftMessage}
        </p>
      )}
    </div>
  )
}

export { OrderGiftNote }
export default OrderGiftNote