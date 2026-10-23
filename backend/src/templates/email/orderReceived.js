import { escapeHtml } from '../../utils/escapeHtml.js';

const formatRupees = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

/**
 * Sent to the shop (ORDER_NOTIFY_EMAIL, else ENQUIRY_NOTIFY_EMAIL) once an order's payment is verified.
 * The customer is the delivery address name, which every order has, signed-in or guest.
 */
export const orderReceivedEmail = ({ orderNumber, address, items, total }) => {
  const customer = address.name;

  return {
    subject: `New order ${orderNumber} from ${customer}`,
    text: [
      `You have received an order from ${customer}.`,
      `Order ID: ${orderNumber}`,
      '',
      ...items.map((item) => `- ${item.name} x ${item.quantity}`),
      '',
      `Total: ${formatRupees(total)}`,
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#222">
        <h2 style="color:#043B65;margin:0 0 16px">New order received</h2>
        <p style="margin:4px 0">You have received an order from <strong>${escapeHtml(customer)}</strong>.</p>
        <p style="margin:4px 0"><strong>Order ID:</strong> ${escapeHtml(orderNumber)}</p>
        <ul style="margin:16px 0;padding:12px 16px 12px 32px;background:#F4F8FB;border-radius:8px">
          ${items.map((item) => `<li style="margin:4px 0">${escapeHtml(item.name)} &times; ${item.quantity}</li>`).join('')}
        </ul>
        <p style="margin:4px 0;font-size:16px"><strong>Total: ${formatRupees(total)}</strong></p>
      </div>
    `,
  };
};

export default orderReceivedEmail;