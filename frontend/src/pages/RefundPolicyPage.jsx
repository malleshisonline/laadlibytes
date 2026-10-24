import PolicyPage from '../components/common/PolicyPage.jsx'
import { APP_SETTINGS } from '../constants/appSettings.js'

// Mirrors "Cancellations, returns, and refunds" in TermsPage.jsx; change the two together.
const REFUND_SECTIONS = [
  {
    id: 'no-cancellations',
    title: 'Cancellations, returns and exchanges',
    paragraphs: [
      'We do not accept cancellations, returns, exchanges, or refund requests for placed orders.',
      'Please review your items, quantities, delivery details, and total carefully before paying.',
    ],
  },
  {
    id: 'failed-payments',
    title: 'Payments that do not go through',
    paragraphs: [
      'An order is placed only after its payment is confirmed. If a payment fails or is not completed, no order is placed.',
      'If money was debited for a payment that did not complete, it is reversed to the original payment method by the bank or payment provider, usually within 5–7 working days.',
    ],
  },
  {
    id: 'help',
    title: 'Payment or delivery issues',
    paragraphs: [
      'If you experience a payment or delivery issue, contact us with your order number so we can review the order details and assist with the issue.',
    ],
  },
]

function RefundPolicyPage() {
  return (
    <PolicyPage
      title='Refund & Cancellation Policy'
      intro={`This policy explains how cancellations, returns and refunds work for orders placed with ${APP_SETTINGS.SITE_NAME}.`}
      sections={REFUND_SECTIONS}
    />
  )
}

export default RefundPolicyPage