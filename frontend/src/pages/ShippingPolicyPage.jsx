import PolicyPage from '../components/common/PolicyPage.jsx'
import { APP_SETTINGS } from '../constants/appSettings.js'

// Mirrors "Delivery details" in TermsPage.jsx; change the two together.
const SHIPPING_SECTIONS = [
  {
    id: 'charges',
    title: 'Delivery charges',
    paragraphs: ['Delivery is free on every order, with no minimum order value.'],
  },
  {
    id: 'where',
    title: 'Where we deliver',
    paragraphs: [
      'We deliver to addresses in India. Orders are prepared using the delivery address submitted at checkout.',
      'Please review the address and contact number carefully before placing your order.',
    ],
  },
  {
    id: 'when',
    title: 'Processing and delivery',
    paragraphs: [
      'An order is packed once its payment is confirmed, then handed over for delivery.',
      'Delivery timing and serviceability may depend on the destination and delivery operations.',
      'Signed-in customers can follow each order (Placed, Packed, Shipped, Delivered) under My Account → My Orders.',
    ],
  },
  {
    id: 'contact',
    title: 'Reaching you',
    paragraphs: [
      'We will use the contact details associated with the order when necessary to help complete delivery.',
    ],
  },
]

function ShippingPolicyPage() {
  return (
    <PolicyPage
      title='Shipping & Delivery Policy'
      intro={`This policy explains how ${APP_SETTINGS.SITE_NAME} delivers your orders.`}
      sections={SHIPPING_SECTIONS}
    />
  )
}

export default ShippingPolicyPage