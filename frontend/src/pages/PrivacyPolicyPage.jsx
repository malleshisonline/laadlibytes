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

import policyBackground from '../assets/illustrations/pages_bottom.avif'
import { APP_ROUTES } from '../constants/appRoutepoints.js'

const POLICY_SECTIONS = [
  {
    title: 'Information we collect',
    icon: UserRound,
    paragraphs: [
      'When you create or use an account, place an order, or contact us, we may collect details such as your name, email address, mobile number, delivery address, and the information you share with us.',
      'We also process order details, saved cart contents, and account activity needed to provide the services you request.',
    ],
  },
  {
    title: 'How we use your information',
    icon: HeartHandshake,
    paragraphs: [
      'We use your information to manage your account, respond to enquiries, maintain your cart, arrange delivery, process orders, provide customer support, and protect the reliability of our services.',
      'We may contact you about an order or account activity using the contact details associated with that request.',
    ],
  },
  {
    title: 'Cookies and essential storage',
    icon: Cookie,
    paragraphs: [
      'The site uses essential browser storage to support sign-in and shopping-cart features. For example, an account session and a guest cart may be associated with secure, httpOnly cookies.',
      'These features help the site remember your session or cart between page visits. Blocking cookies may affect sign-in or cart functionality.',
    ],
  },
  {
    title: 'Payments',
    icon: CreditCard,
    paragraphs: [
      'Online payments are presented through Razorpay Checkout. Payment credentials are entered through the payment provider’s interface; we use payment confirmations and related transaction details to process and support your order.',
      'Payment processing is also subject to Razorpay’s own privacy terms.',
    ],
  },
  {
    title: 'When information is shared',
    icon: ShieldCheck,
    paragraphs: [
      'We share only the information needed to operate the services you use—for example, with payment, delivery, hosting, image-storage, or communication providers involved in completing an order or sending a message.',
      'We do not make your account or order information public through the storefront.',
    ],
  },
  {
    title: 'Storage and retention',
    icon: FileText,
    paragraphs: [
      'We keep information for as long as it is needed to provide the service, support orders and accounts, resolve disputes, and meet applicable obligations. The period can vary depending on the type of information and why it was collected.',
    ],
  },
  {
    title: 'Keeping information safe',
    icon: LockKeyhole,
    paragraphs: [
      'We use safeguards intended to protect account and order information. No online service can guarantee absolute security, so please use a strong password and contact us promptly if you think your account has been accessed without permission.',
    ],
  },
  {
    title: 'Your choices',
    icon: Mail,
    paragraphs: [
      'You can review and update some account details from your account. To ask a question about this policy or request help with your information, please contact us through our Contact page.',
    ],
  },
]

function PrivacyPolicyPage() {
  return (
    <main className='relative isolate overflow-hidden bg-cream-50'>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
      >
        <img
          src={policyBackground}
          alt=''
          className='size-full object-cover opacity-20'
        />
      </div>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-cream-50/55 via-white/35 to-lightblue-50/65'
      />

      <div className='relative mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16'>
        <div className='overflow-hidden rounded-3xl border border-white/90 bg-white/90 shadow-xl shadow-navy-900/10 ring-1 ring-navy-900/5 backdrop-blur-md'>
          <div className='divide-y divide-line/70 px-5 sm:px-8'>
            {POLICY_SECTIONS.map(({ title, icon: Icon, paragraphs }, index) => (
              <section key={title} className='py-6 sm:py-7'>
                <div className='flex items-start gap-4 sm:gap-5'>
                  <span className='inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-cream-100 text-caramel-700 ring-1 ring-caramel-500/20 sm:size-11'>
                    <Icon size={20} strokeWidth={1.8} aria-hidden='true' />
                  </span>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-baseline gap-3'>
                      <span className='text-xs font-bold tabular-nums tracking-wider text-caramel-700'>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h2 className='font-display text-lg font-semibold text-navy-900 sm:text-xl'>
                        {title}
                      </h2>
                    </div>
                    <ul className='mt-3 space-y-2.5'>
                      {paragraphs.map((paragraph) => (
                        <li key={paragraph} className='flex gap-3 text-sm leading-7 text-body sm:text-base'>
                          <span aria-hidden='true' className='mt-[0.8rem] size-1.5 shrink-0 rounded-full bg-caramel-500/80' />
                          <span>{paragraph}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className='border-t border-line/70 bg-cream-50/70 px-5 py-5 sm:px-8'>
            <p className='text-sm leading-7 text-body sm:text-base'>
              For help with your information or account,{' '}
              <Link
                to={APP_ROUTES.CONTACT}
                className='inline-flex items-center gap-1 font-bold text-navy-800 underline decoration-caramel-500 decoration-2 underline-offset-4 hover:text-caramel-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-800'
              >
                contact us
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

export default PrivacyPolicyPage
