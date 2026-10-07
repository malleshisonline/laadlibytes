import { Gift, MessageCircle, Phone } from 'lucide-react'
import { Link } from 'react-router'

import { APP_ROUTES } from '../../constants/appRoutepoints.js'

const WHATSAPP_URL = 'https://wa.me/918008142786'

function FloatingContactActions() {
  return (
    <div className='pointer-events-none fixed right-0 bottom-5 z-40 flex flex-col items-end gap-4 sm:bottom-6'>
      <Link
        to={APP_ROUTES.CONTACT}
        aria-label='Send us an enquiry'
        className='pointer-events-auto flex h-44 w-11 flex-col items-center justify-center gap-3 rounded-l-xl border border-r-0 border-white/80 bg-linear-to-b from-[#d4145a] via-caramel-700 to-caramel-500 text-white shadow-[0_8px_24px_rgba(70,43,29,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-caramel-500'
      >
        <span className='grid size-7 shrink-0 place-items-center rounded-full border border-white/40 bg-white/20 text-white shadow-inner'>
          <Gift size={15} strokeWidth={2} aria-hidden='true' />
        </span>
        <span className='[writing-mode:vertical-rl] rotate-180 text-xs font-extrabold tracking-[0.18em] uppercase'>
          Enquiry
        </span>
      </Link>

      <a
        href={WHATSAPP_URL}
        target='_blank'
        rel='noreferrer'
        aria-label='Chat with us on WhatsApp'
        className='pointer-events-auto inline-flex size-14 items-center justify-center rounded-full border-2 border-white bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,38,74,0.25)] transition duration-200 hover:scale-105 hover:bg-[#1ebe5d] hover:shadow-[0_12px_28px_rgba(0,38,74,0.32)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-800 sm:size-16'
      >
        <span className='relative inline-flex size-9 items-center justify-center' aria-hidden='true'>
          <MessageCircle className='absolute inset-0 size-9' strokeWidth={2.2} />
          <Phone className='size-4 -rotate-12 fill-white' strokeWidth={2.8} />
        </span>
      </a>
    </div>
  )
}

export { FloatingContactActions }
export default FloatingContactActions
