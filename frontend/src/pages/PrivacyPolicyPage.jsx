import { Link } from 'react-router'
import {
  ArrowRight,
  Cookie,
  CreditCard,
  FileText,
  HeartHandshake,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { APP_SETTINGS } from '../constants/appSettings.js'

const POLICY_SECTIONS = [
  {
    id: 'information',
    number: '01',
    title: 'Information we collect',
    icon: UserRound,
    paragraphs: [
      'When you create or use an account, place an order, or contact us, we may collect details such as your name, email address, mobile number, delivery address, and the information you share with us.',
      'We also process order details, saved cart contents, and account activity needed to provide the services you request.',
    ],
  },
  {
    id: 'use',
    number: '02',
    title: 'How we use your information',
    icon: HeartHandshake,
    paragraphs: [
      'We use your information to manage your account, respond to enquiries, maintain your cart, arrange delivery, process orders, provide customer support, and protect the reliability of our services.',
      'We may contact you about an order or account activity using the contact details associated with that request.',
    ],
  },
  {
    id: 'cookies',
    number: '03',
    title: 'Cookies and essential storage',
    icon: Cookie,
    paragraphs: [
      'The site uses essential browser storage to support sign-in and shopping-cart features. For example, an account session and a guest cart may be associated with secure, httpOnly cookies.',
      'These features help the site remember your session or cart between page visits. Blocking cookies may affect sign-in or cart functionality.',
    ],
  },
  {
    id: 'payments',
    number: '04',
    title: 'Payments',
    icon: CreditCard,
    paragraphs: [
      'Online payments are presented through Razorpay Checkout. Payment credentials are entered through the payment provider’s interface; we use payment confirmations and related transaction details to process and support your order.',
      'Payment processing is also subject to Razorpay’s own privacy terms.',
    ],
  },
  {
    id: 'sharing',
    number: '05',
    title: 'When information is shared',
    icon: ShieldCheck,
    paragraphs: [
      'We share only the information needed to operate the services you use—for example, with payment, delivery, hosting, image-storage, or communication providers involved in completing an order or sending a message.',
      'We do not make your account or order information public through the storefront.',
    ],
  },
  {
    id: 'retention',
    number: '06',
    title: 'Storage and retention',
    icon: FileText,
    paragraphs: [
      'We keep information for as long as it is needed to provide the service, support orders and accounts, resolve disputes, and meet applicable obligations. The period can vary depending on the type of information and why it was collected.',
    ],
  },
  {
    id: 'security',
    number: '07',
    title: 'Keeping information safe',
    icon: LockKeyhole,
    paragraphs: [
      'We use safeguards intended to protect account and order information. No online service can guarantee absolute security, so please use a strong password and contact us promptly if you think your account has been accessed without permission.',
    ],
  },
  {
    id: 'choices',
    number: '08',
    title: 'Your choices and contacting us',
    icon: Mail,
    paragraphs: [
      'You can review and update some account details from your account. To ask a question about this policy or request help with your information, please contact us through our Contact page.',
    ],
  },
]

function PrivacyPolicyPage() {
  return (
    <div className='relative isolate overflow-hidden bg-linear-to-b from-cream-50 via-white to-lightblue-50/70'>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -top-28 right-[-8rem] -z-10 size-80 rounded-full bg-blush-100/70 blur-3xl sm:size-112'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute top-[34rem] left-[-10rem] -z-10 size-80 rounded-full bg-lightblue-100/70 blur-3xl'
      />

      <header className='relative border-b border-caramel-200/60'>
        <div className='mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20'>
          <div className='mx-auto max-w-3xl text-center'>
            <span className='inline-flex items-center gap-2 rounded-full border border-caramel-300/70 bg-white/80 px-4 py-2 text-xs font-bold tracking-[0.14em] text-caramel-700 uppercase shadow-sm'>
              <ShieldCheck size={16} aria-hidden='true' />
              Your privacy matters
            </span>
            <h1 className='mt-5 font-display text-3xl leading-tight font-semibold text-navy-900 sm:text-4xl md:text-5xl'>
              Privacy Policy
            </h1>
            <p className='mx-auto mt-4 max-w-2xl text-base leading-7 text-body sm:text-lg'>
              A clear guide to how {APP_SETTINGS.SITE_NAME} handles information when you browse,
              shop, or get in touch with us.
            </p>
            <p className='mt-5 text-sm font-semibold text-muted'>Last updated: October 2026</p>
          </div>
        </div>
      </header>

      <main className='mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12 lg:py-16'>
        <aside className='h-fit rounded-2xl border border-lightblue-200 bg-white/85 p-5 shadow-sm lg:sticky lg:top-28'>
          <h2 className='font-display text-lg font-semibold text-navy-900'>On this page</h2>
          <nav aria-label='Privacy policy sections' className='mt-3'>
            <ul className='grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1'>
              {POLICY_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className='block rounded-lg px-2.5 py-2 text-sm font-medium text-body transition hover:bg-lightblue-50 hover:text-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600'
                  >
                    {section.number}. {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div>
          <div className='mb-6 rounded-2xl border border-caramel-200/70 bg-linear-to-r from-cream-100/80 to-white p-5 sm:p-6'>
            <p className='text-sm leading-6 text-body sm:text-base'>
              We collect only the information needed to help you browse, manage your account, and
              receive your orders. This policy explains the main ways that information is used.
            </p>
          </div>

          <div className='space-y-4 sm:space-y-5'>
            {POLICY_SECTIONS.map(({ id, number, title, icon: Icon, paragraphs }) => (
              <section
                key={id}
                id={id}
                aria-labelledby={`${id}-heading`}
                className='scroll-mt-28 rounded-2xl border border-lightblue-200/80 bg-white/90 p-5 shadow-sm shadow-navy-900/5 sm:p-7'
              >
                <div className='flex items-start gap-4'>
                  <span className='inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-lightblue-100 text-navy-800'>
                    <Icon size={20} strokeWidth={1.8} aria-hidden='true' />
                  </span>
                  <div className='min-w-0'>
                    <p className='text-xs font-extrabold tracking-[0.14em] text-caramel-700'>
                      {number}
                    </p>
                    <h2 id={`${id}-heading`} className='mt-1 font-display text-xl font-semibold text-navy-900 sm:text-2xl'>
                      {title}
                    </h2>
                    <div className='mt-3 space-y-3 text-sm leading-7 text-body sm:text-base'>
                      {paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          
        </div>
      </main>
    </div>
  )
}

export default PrivacyPolicyPage
