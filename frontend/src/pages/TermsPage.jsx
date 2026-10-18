import { useEffect, useState } from 'react'
import { Link } from 'react-router'

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
  const [activeId, setActiveId] = useState(TERMS_SECTIONS[0].id)

  // Highlight the section currently being read in the contents list
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) setActiveId(visible.target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )

    TERMS_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className='min-h-screen bg-cream-50 text-navy-900'>
      {/* Header */}
      <header className='border-b border-caramel-200/60'>
        <div className='mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16'>
          <h1 className='font-display text-4xl font-semibold text-navy-900 sm:text-5xl'>
            Terms &amp; Conditions
          </h1>
          <p className='mt-4 max-w-2xl text-base leading-7 text-body'>
            The details that apply when you use our website, place an order, pay, or receive a
            delivery.
          </p>
          <p className='mt-4 text-sm text-muted'>Last updated: October 2026</p>
        </div>
      </header>

      <div className='mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14 lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-16'>
        {/* Contents (desktop only) */}
        <aside className='hidden lg:block'>
          <nav aria-label='On this page' className='sticky top-28'>
            <p className='mb-3 text-sm font-semibold text-navy-900'>On this page</p>
            <ul className='space-y-1 border-l border-caramel-200'>
              {TERMS_SECTIONS.map(({ id, title }) => {
                const isActive = activeId === id
                return (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      aria-current={isActive ? 'true' : undefined}
                      className={`-ml-px block border-l-2 py-1.5 pl-4 text-sm leading-5 transition-colors ${
                        isActive
                          ? 'border-caramel-500 font-semibold text-navy-900'
                          : 'border-transparent text-muted hover:text-navy-900'
                      }`}
                    >
                      {title}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {/* Content */}
        <main className='max-w-2xl'>
          <p className='text-base leading-7 text-body'>
            These terms apply when you access our website or place an order. Please read them
            together with our{' '}
            <Link
              to={APP_ROUTES.PRIVACY_POLICY}
              className='font-semibold text-navy-800 underline decoration-caramel-500 decoration-2 underline-offset-4 hover:text-caramel-700'
            >
              Privacy Policy
            </Link>
            .
          </p>

          <div className='mt-10 space-y-10'>
            {TERMS_SECTIONS.map(({ id, title, paragraphs }, index) => (
              <section
                key={id}
                id={id}
                aria-labelledby={`${id}-heading`}
                className='scroll-mt-28'
              >
                <h2
                  id={`${id}-heading`}
                  className='font-display text-xl font-semibold text-navy-900 sm:text-2xl'
                >
                  {index + 1}. {title}
                </h2>

                <div className='mt-3 space-y-3 text-base leading-7 text-body'>
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Contact */}
          <div className='mt-14 border-t border-caramel-200 pt-8'>
            <h2 className='font-display text-xl font-semibold text-navy-900'>
              Questions about these terms?
            </h2>
            <p className='mt-2 text-base leading-7 text-body'>
              If something is unclear, or you need help with an order,{' '}
              <Link
                to={APP_ROUTES.CONTACT}
                className='font-semibold text-navy-800 underline decoration-caramel-500 decoration-2 underline-offset-4 hover:text-caramel-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-800'
              >
                contact us
              </Link>
              .
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default TermsPage