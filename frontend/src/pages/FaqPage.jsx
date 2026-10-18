import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ChevronDown, CircleHelp, MessageCircle, PackageSearch } from 'lucide-react'

import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { APP_SETTINGS } from '../constants/appSettings.js'

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
    <div className='relative isolate overflow-hidden bg-linear-to-b from-cream-50 via-white to-lightblue-50/70'>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -top-28 right-[-8rem] -z-10 size-80 rounded-full bg-blush-100/70 blur-3xl sm:size-112'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute top-[42rem] left-[-10rem] -z-10 size-80 rounded-full bg-lightblue-100/70 blur-3xl'
      />

      <header className='relative border-b border-caramel-200/60'>
        <div className='mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:py-20'>
          <span className='inline-flex items-center gap-2 rounded-full border border-caramel-300/70 bg-white/85 px-4 py-2 text-xs font-bold tracking-[0.14em] text-caramel-700 uppercase shadow-sm'>
            <CircleHelp size={16} aria-hidden='true' />
            A little help, made simple
          </span>
          <h1 className='mt-5 font-display text-3xl leading-tight font-semibold text-navy-900 sm:text-4xl md:text-5xl'>
            Frequently Asked Questions
          </h1>
          <p className='mx-auto mt-4 max-w-2xl text-base leading-7 text-body sm:text-lg'>
            Quick answers for shopping with {APP_SETTINGS.SITE_NAME}, from finding a treat to
            checking out.
          </p>
        </div>
      </header>

      <main className='mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16'>
        <div className='mb-7 grid gap-3 sm:grid-cols-3'>
          {FAQ_GROUPS.map(({ id, title, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className='flex min-h-14 items-center gap-3 rounded-xl border border-lightblue-200 bg-white/85 px-4 py-3 text-sm font-bold text-navy-800 shadow-sm transition hover:-translate-y-0.5 hover:border-caramel-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600'
            >
              <span className='inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-lightblue-100 text-navy-800'>
                <Icon size={18} aria-hidden='true' />
              </span>
              {title}
            </a>
          ))}
        </div>

        <div className='space-y-8'>
          {FAQ_GROUPS.map(({ id, title, icon: Icon, questions }) => (
            <section key={id} id={id} aria-labelledby={`${id}-heading`} className='scroll-mt-28'>
              <div className='mb-3 flex items-center gap-3'>
                <span className='inline-flex size-10 items-center justify-center rounded-xl bg-caramel-100 text-caramel-800'>
                  <Icon size={19} aria-hidden='true' />
                </span>
                <h2 id={`${id}-heading`} className='font-display text-xl font-semibold text-navy-900 sm:text-2xl'>
                  {title}
                </h2>
              </div>

              <div className='space-y-3'>
                {questions.map(({ question, answer }, index) => {
                  const questionId = `${id}-${index}`
                  const isOpen = openQuestion === questionId

                  return (
                    <article
                      key={question}
                      className={`overflow-hidden rounded-2xl border bg-white/90 transition-colors ${
                        isOpen ? 'border-caramel-300 shadow-md shadow-navy-900/5' : 'border-lightblue-200/80 shadow-sm'
                      }`}
                    >
                      <h3>
                        <button
                          type='button'
                          aria-expanded={isOpen}
                          aria-controls={`${questionId}-answer`}
                          onClick={() => setOpenQuestion(isOpen ? '' : questionId)}
                          className='flex min-h-14 w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-bold text-navy-900 sm:px-5 sm:text-base'
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
                          <p className='border-t border-cream-200 px-4 py-4 text-sm leading-7 text-body sm:px-5 sm:text-base'>
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

        <div className='mt-9 flex flex-col gap-4 rounded-2xl bg-navy-900 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-7'>
          <div>
            <h2 className='font-display text-xl font-semibold'>Still have a question?</h2>
            <p className='mt-1 text-sm leading-6 text-lightblue-100'>
              Send us a note and we’ll help point you in the right direction.
            </p>
          </div>
          <Link
            to={APP_ROUTES.CONTACT}
            className='inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-caramel-500 px-5 text-sm font-bold text-navy-950 transition hover:bg-caramel-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
          >
            Contact us
            <ArrowRight size={16} aria-hidden='true' />
          </Link>
        </div>
      </main>
    </div>
  )
}

export default FaqPage
