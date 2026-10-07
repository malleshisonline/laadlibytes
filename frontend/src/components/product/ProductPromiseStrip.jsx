import {
  Gift,
  Heart,
  Leaf,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'

import chikkiMascot from '../../assets/illustrations/mascot-waving-with-flute.avif'

const PROMISES = [
  {
    icon: Leaf,
    title: '100% Natural',
    text: 'Pure ingredients',
    cardClass:
      'from-[#edf8df] via-[#f7f9e9] to-[#fff8df] border-[#b8d98a]',
    iconClass:
      'bg-[#6f963d] text-white shadow-[0_6px_16px_rgba(91,126,50,0.28)]',
    accentClass: 'text-[#6f963d]',
  },
  {
    icon: Gift,
    title: 'Free Delivery',
    text: 'A little gift from us',
    cardClass:
      'from-[#e7f1ff] via-[#eef6ff] to-[#fff8e9] border-[#a9c8eb]',
    iconClass:
      'bg-[#315b8f] text-white shadow-[0_6px_16px_rgba(49,91,143,0.28)]',
    accentClass: 'text-[#315b8f]',
  },
  {
    icon: Star,
    title: 'Vrindavan Tradition',
    text: 'Recipes with a story',
    cardClass:
      'from-[#fff0c9] via-[#fff7df] to-[#f8e4ad] border-[#e6bd62]',
    iconClass:
      'bg-[#c58a27] text-white shadow-[0_6px_16px_rgba(197,138,39,0.28)]',
    accentClass: 'text-[#c58a27]',
    mascot: true,
  },
  {
    icon: Heart,
    title: 'Made with Love',
    text: 'Joy in every bite',
    cardClass:
      'from-[#ffe7ec] via-[#fff1e9] to-[#fff6dd] border-[#e8a6ad]',
    iconClass:
      'bg-[#c85f72] text-white shadow-[0_6px_16px_rgba(200,95,114,0.26)]',
    accentClass: 'text-[#c85f72]',
  },
]

function ProductPromiseStrip() {
  return (
    <div className='relative z-20 mx-auto mt-3 max-w-6xl px-4 sm:px-6'>

      {/* subtle golden glow behind strip */}
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-x-16 top-1/2 h-20 -translate-y-1/2 rounded-full bg-caramel-500/10 blur-3xl'
      />

      <ul className='relative grid grid-cols-2 gap-3 md:grid-cols-4'>

        {PROMISES.map(
          ({
            icon: Icon,
            title,
            text,
            cardClass,
            iconClass,
            accentClass,
            mascot,
          }) => (
            <li
              key={title}
              className={`
                group
                relative
                min-h-[112px]
                overflow-hidden
                rounded-[20px]
                border
                bg-linear-to-br
                ${cardClass}
                px-3
                py-4
                shadow-[0_7px_20px_rgba(68,47,23,0.08)]
                transition-all
                duration-500
                hover:-translate-y-1.5
                hover:shadow-[0_14px_28px_rgba(68,47,23,0.15)]
                sm:px-4
              `}
            >

              {/* Corner sparkle */}
              <Sparkles
                size={14}
                strokeWidth={1.7}
                aria-hidden='true'
                className={`
                  absolute
                  top-3
                  right-3
                  opacity-40
                  transition-all
                  duration-500
                  group-hover:scale-125
                  group-hover:rotate-12
                  group-hover:opacity-80
                  ${accentClass}
                `}
              />

              {/* Content */}
              <div className='relative z-10 flex h-full items-center gap-3'>

                {/* Icon / Krishna Mascot */}
                {mascot ? (
                  <div className='relative shrink-0'>

                    {/* glow */}
                    <div
                      aria-hidden='true'
                      className='absolute inset-1 rounded-full bg-[#e3b64e]/30 blur-md'
                    />

                    <div
                      className='
                        relative
                        flex
                        size-16
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-[#e3b64e]/50
                        bg-[#fff9e8]/90
                        shadow-[0_6px_18px_rgba(151,103,26,0.18)]
                        transition-transform
                        duration-500
                        group-hover:-rotate-3
                        group-hover:scale-110
                      '
                    >
                      <img
                        src={chikkiMascot}
                        alt=''
                        aria-hidden='true'
                        width='400'
                        height='400'
                        loading='lazy'
                        decoding='async'
                        className='size-14 object-contain'
                      />
                    </div>

                    {/* tiny star */}
                    <Star
                      size={12}
                      aria-hidden='true'
                      className='
                        absolute
                        -top-1
                        -right-1
                        fill-[#e0aa38]
                        text-[#e0aa38]
                        transition-transform
                        duration-500
                        group-hover:rotate-45
                        group-hover:scale-125
                      '
                    />
                  </div>
                ) : (
                  <div
                    className={`
                      relative
                      grid
                      size-12
                      shrink-0
                      place-items-center
                      rounded-[15px]
                      ${iconClass}
                      transition-all
                      duration-500
                      group-hover:-rotate-6
                      group-hover:scale-110
                    `}
                  >
                    <Icon
                      size={23}
                      strokeWidth={1.9}
                      aria-hidden='true'
                    />

                    <span
                      aria-hidden='true'
                      className='absolute inset-1 rounded-[11px] border border-white/20'
                    />
                  </div>
                )}

                {/* Text */}
                <div className='min-w-0'>
                  <p
                    className='
                      font-display
                      text-[15px]
                      leading-tight
                      font-bold
                      text-navy-800
                      sm:text-base
                    '
                  >
                    {title}
                  </p>

                  <p className='mt-1 text-[11px] leading-snug text-navy-700/70 sm:text-xs'>
                    {text}
                  </p>

                  <div
                    aria-hidden='true'
                    className={`
                      mt-2
                      h-[2px]
                      w-7
                      rounded-full
                      bg-current
                      opacity-40
                      transition-all
                      duration-500
                      group-hover:w-12
                      ${accentClass}
                    `}
                  />
                </div>
              </div>
            </li>
          ),
        )}

      </ul>

      {/* Bottom Vrindavan-style message */}
      <div className='mt-3 flex items-center justify-center gap-2 text-center'>
        <span className='h-px w-8 bg-caramel-500/30 sm:w-14' />

        <Sparkles
          size={12}
          aria-hidden='true'
          className='text-caramel-500'
        />

        <p className='font-display text-[11px] font-semibold tracking-wide text-caramel-700 sm:text-xs'>
          From Vrindavan, with love
        </p>

        <Sparkles
          size={12}
          aria-hidden='true'
          className='text-caramel-500'
        />

        <span className='h-px w-8 bg-caramel-500/30 sm:w-14' />
      </div>
    </div>
  )
}

export { ProductPromiseStrip }
export default ProductPromiseStrip