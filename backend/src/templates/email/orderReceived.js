import { escapeHtml } from '../../utils/escapeHtml.js';

const formatRupees = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

const deliveryDateFormatter = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/**
 * Sent to the shop (ORDER_NOTIFY_EMAIL, else ENQUIRY_NOTIFY_EMAIL) once an order's payment is verified.
 * The customer is the delivery address name, which every order has, signed-in or guest.
 */
export const orderReceivedEmail = ({
  orderNumber,
  address,
  items,
  subtotal,
  coupon,
  discount,
  total,
  giftMessage,
  recipientName,
  estimatedDeliveryBy,
}) => {
  const customer = address.name;
  const deliveryLine = estimatedDeliveryBy
    ? `Promised delivery by: ${deliveryDateFormatter.format(new Date(estimatedDeliveryBy))} (${address.city} ${address.pincode})`
    : null;
  // Only a coupon order shows the subtotal and the discount; any other email reads as before.
  const couponLines = coupon && discount > 0
    ? [`Subtotal: ${formatRupees(subtotal)}`, `Coupon ${coupon.code}: −${formatRupees(discount)}`]
    : [];
  // Only a gift hamper order has these.
  const giftLines = [
    ...(recipientName ? [`Gift for: ${recipientName}`] : []),
    ...(giftMessage ? [`Gift message: ${giftMessage}`] : []),
  ];

  return {
    subject: `New order ${orderNumber} from ${customer}`,
    text: [
      `You have received an order from ${customer}.`,
      `Order ID: ${orderNumber}`,
      ...(deliveryLine ? [deliveryLine] : []),
      '',
      ...items.map((item) => `- ${item.name} x ${item.quantity}`),
      '',
      ...(giftLines.length ? [...giftLines, ''] : []),
      ...couponLines,
      `Total: ${formatRupees(total)}`,
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222">
        <h2 style="color:#043B65;margin:0 0 16px">New order received</h2>
        <p style="margin:4px 0">You have received an order from <strong>${escapeHtml(customer)}</strong>.</p>
        <p style="margin:4px 0"><strong>Order ID:</strong> ${escapeHtml(orderNumber)}</p>
        ${deliveryLine ? `<p style="margin:4px 0">${escapeHtml(deliveryLine)}</p>` : ''}
        <ul style="margin:16px 0;padding:12px 16px 12px 32px;background:#F4F8FB;border-radius:8px">
          ${items
            .map((item) => `<li style="margin:4px 0">${escapeHtml(item.name)} &times; ${item.quantity}</li>`)
            .join('')}
        </ul>
        ${giftLines.map((line) => `<p style="margin:4px 0;white-space:pre-wrap">${escapeHtml(line)}</p>`).join('')}
        ${couponLines.map((line) => `<p style="margin:4px 0">${escapeHtml(line)}</p>`).join('')}
        <p style="margin:4px 0;font-size:16px"><strong>Total: ${formatRupees(total)}</strong></p>
      </div>
    `,
  };
};

export default orderReceivedEmail;