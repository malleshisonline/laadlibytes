import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ChevronDown, CircleHelp, MessageCircle, PackageSearch } from 'lucide-react'

import policyBackground from '../assets/illustrations/pages_bottom.avif'
import { APP_ROUTES } from '../constants/appRoutepoints.js'

const FAQ_GROUPS = [
  {
    id: 'shopping',
    title: 'Shopping & products',
    icon: PackageSearch,
    questions: [
      {
        question: 'How do I find a product?',
        answer:
          'Browse the Products page, choose a category, use the search field, or explore the featured collections on the home page.',
      },
      {
        question: 'What does the pack size mean?',
        answer:
          'The pack size shown on a product card and its detail page is the declared size for that product. Please check the product page before adding it to your cart.',
      },
      {
        question: 'Does adding an item to my cart reserve it?',
        answer:
          'No. Cart contents are not a stock reservation. Availability is checked when you place the order, so an item may become unavailable before checkout.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & cart',
    icon: CircleHelp,
    questions: [
      {
        question: 'Can I browse without creating an account?',
        answer:
          'Yes. You can browse products and use a guest cart. You need to sign in to place an order and complete checkout.',
      },
      {
        question: 'What happens to my guest cart after I sign in?',
        answer:
          'The site attempts to merge your guest cart into your account cart when you sign in. Quantities are combined within available stock and per-item limits.',
      },
      {
        question: 'How do I update my delivery address?',
        answer:
          'Sign in and manage saved addresses from My Account. At checkout, select the address you want to use for that order.',
      },
    ],
  },
  {
    id: 'orders',
    title: 'Orders & payment',
    icon: MessageCircle,
    questions: [
      {
        question: 'How can I pay for my order?',
        answer:
          'Payments are completed through Razorpay Checkout using the methods enabled for the payment account. The order is marked paid after payment is verified.',
      },
      {
        question: 'Can I cancel, return, exchange, or get a refund for an order?',
        answer:
          'The shop does not accept cancellations, returns, exchanges, or refunds. Please review the items, quantities, delivery address, and total before placing an order.',
      },
      {
        question: 'Where can I ask about an order?',
        answer:
          'Use the Contact page and include the order details needed to help us identify your request. Please do not send your password or full payment credentials.',
      },
    ],
  },
]

function FaqPage() {
  const [openQuestion, setOpenQuestion] = useState('shopping-0')

  return (
    <main className='relative isolate overflow-hidden bg-cream-50'>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
      >
        <img src={policyBackground} alt='' className='size-full object-cover opacity-20' />
      </div>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-cream-50/55 via-white/35 to-lightblue-50/65'
      />

      <div className='relative mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16'>
        <div className='overflow-hidden rounded-3xl border border-white/90 bg-white/90 shadow-xl shadow-navy-900/10 ring-1 ring-navy-900/5 backdrop-blur-md'>
          <div className='divide-y divide-line/70 px-5 sm:px-8'>
            {FAQ_GROUPS.map(({ id, title, icon: Icon, questions }) => (
              <section key={id} id={id} aria-labelledby={`${id}-heading`} className='py-6 sm:py-7'>
                <div className='mb-2 flex items-center gap-3'>
                  <span className='inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream-100 text-caramel-700 ring-1 ring-caramel-500/20'>
                    <Icon size={19} aria-hidden='true' />
                  </span>
                  <h2 id={`${id}-heading`} className='font-display text-lg font-semibold text-navy-900 sm:text-xl'>
                    {title}
                  </h2>
                </div>

                <div className='ml-0 divide-y divide-line/60 sm:ml-[3.25rem]'>
                  {questions.map(({ question, answer }, index) => {
                    const questionId = `${id}-${index}`
                    const isOpen = openQuestion === questionId

                    return (
                      <article key={question}>
                        <h3>
                          <button
                            type='button'
                            aria-expanded={isOpen}
                            aria-controls={`${questionId}-answer`}
                            onClick={() => setOpenQuestion(isOpen ? '' : questionId)}
                            className='flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left text-sm font-bold text-navy-900 transition-colors hover:text-caramel-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-800 sm:text-base'
                          >
                            <span>{question}</span>
                            <ChevronDown
                              size={19}
                              aria-hidden='true'
                              className={`shrink-0 text-caramel-700 transition-transform duration-300 ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </h3>
                        <div
                          id={`${questionId}-answer`}
                          aria-hidden={!isOpen}
                          className={`grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
                            isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                          }`}
                        >
                          <div className='min-h-0 overflow-hidden'>
                            <p className='pb-4 pr-8 text-sm leading-7 text-body sm:text-base'>
                              {answer}
                            </p>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className='border-t border-line/70 bg-cream-50/70 px-5 py-5 sm:px-8'>
            <p className='text-sm leading-7 text-body sm:text-base'>
              Still need help?{' '}
              <Link
                to={APP_ROUTES.CONTACT}
                className='inline-flex items-center gap-1 font-bold text-navy-800 underline decoration-caramel-500 decoration-2 underline-offset-4 hover:text-caramel-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-800'
              >
                Contact us
                <ArrowRight size={16} aria-hidden='true' />
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default FaqPage
