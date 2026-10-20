import { Link } from 'react-router'

import policyBackground from '../assets/illustrations/pages_bottom.avif'
import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { APP_SETTINGS } from '../constants/appSettings.js'

const TERMS_SECTIONS = [
  {
    id: 'using-site',
    title: 'Using this website',
    paragraphs: [
      `By browsing or shopping with ${APP_SETTINGS.SITE_NAME}, you agree to use the website lawfully and provide accurate information when creating an account, placing an order, or contacting us.`,
      'Please keep your account credentials private. You are responsible for activity carried out through your account until you notify us of a concern.',
    ],
  },
  {
    id: 'products',
    title: 'Products and availability',
    paragraphs: [
      'We take care to present product descriptions, pack sizes, images, prices, and availability as clearly as possible. Product colours and appearance may vary slightly between screens and actual packaging.',
      'Products are subject to availability. Adding an item to your cart does not reserve stock; stock is checked when an order is placed.',
    ],
  },
  {
    id: 'orders',
    title: 'Orders and payment',
    paragraphs: [
      'When you place an order, you confirm that the delivery and contact details provided are accurate. An order is subject to product availability and successful payment confirmation.',
      'Payments are processed through Razorpay Checkout. Prices are shown in Indian rupees. Your order is treated as paid only after the payment is verified.',
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery details',
    paragraphs: [
      'Orders are prepared using the delivery address submitted at checkout. Please review the address and contact number carefully before placing your order.',
      'Delivery timing and serviceability may depend on the destination and delivery operations. We will use the contact details associated with the order when necessary to help complete delivery.',
    ],
  },
  {
    id: 'cancellations',
    title: 'Cancellations, returns, and refunds',
    paragraphs: [
      'We do not accept cancellations, returns, exchanges, or refund requests for placed orders. Please review your items, quantities, delivery details, and total carefully before paying.',
      'If you experience a payment or delivery issue, contact us so we can review the order details and assist with the issue.',
    ],
  },
  {
    id: 'content',
    title: 'Website content and availability',
    paragraphs: [
      'Website text, photographs, illustrations, and branding are provided for browsing and shopping with us. Please do not copy or reuse them commercially without permission.',
      'We may update product information or website features as the catalogue and services change. We aim to keep the site available, but cannot guarantee uninterrupted access.',
    ],
  },
]

function TermsPage() {
  return (
    <main className='relative isolate overflow-hidden bg-cream-50'>
      <div aria-hidden='true' className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'>
        <img src={policyBackground} alt='' className='size-full object-cover opacity-20' />
      </div>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-cream-50/55 via-white/35 to-lightblue-50/65'
      />

      <div className='relative mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16'>
        <div className='overflow-hidden rounded-3xl border border-white/90 bg-white/90 shadow-xl shadow-navy-900/10 ring-1 ring-navy-900/5 backdrop-blur-md'>
          <div className='px-5 py-5 text-sm leading-7 text-body sm:px-8 sm:py-6 sm:text-base'>
            These terms apply when you access our website or place an order. Please read them
            together with our{' '}
            <Link
              to={APP_ROUTES.PRIVACY_POLICY}
              className='font-bold text-navy-800 underline decoration-caramel-500 decoration-2 underline-offset-4 hover:text-caramel-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-800'
            >
              Privacy Policy
            </Link>
            .
          </div>

          <div className='divide-y divide-line/70 border-t border-line/70 px-5 sm:px-8'>
            {TERMS_SECTIONS.map(({ id, title, paragraphs }, index) => (
              <section key={id} aria-labelledby={`${id}-heading`} className='py-6 sm:py-7'>
                <div className='flex items-baseline gap-3'>
                  <span className='text-xs font-bold tabular-nums tracking-wider text-caramel-700'>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h2
                    id={`${id}-heading`}
                    className='font-display text-lg font-semibold text-navy-900 sm:text-xl'
                  >
                    {title}
                  </h2>
                </div>
                <ul className='mt-3 space-y-2.5 pl-7'>
                  {paragraphs.map((paragraph) => (
                    <li key={paragraph} className='flex gap-3 text-sm leading-7 text-body sm:text-base'>
                      <span
                        aria-hidden='true'
                        className='mt-[0.8rem] size-1.5 shrink-0 rounded-full bg-caramel-500/80'
                      />
                      <span>{paragraph}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className='border-t border-line/70 bg-cream-50/70 px-5 py-5 sm:px-8'>
            <p className='text-sm leading-7 text-body sm:text-base'>
              If something is unclear, or you need help with an order,{' '}
              <Link
                to={APP_ROUTES.CONTACT}
                className='font-bold text-navy-800 underline decoration-caramel-500 decoration-2 underline-offset-4 hover:text-caramel-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-800'
              >
                contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default TermsPage