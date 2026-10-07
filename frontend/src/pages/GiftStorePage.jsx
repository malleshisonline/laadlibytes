import { Gift, Heart, Sparkles } from 'lucide-react'
import { Link } from 'react-router'

import giftHamper from '../assets/illustrations/product_hamper.avif'
import GoldenDivider from '../components/common/GoldenDivider.jsx'
import { APP_ROUTES } from '../constants/appRoutepoints.js'
import giftstoreImage from '../assets/backgrounds/Laadli_Bytes__Home_of_Sweet_Memories.avif'

const FLOATING_ITEMS = [
  {
    type: 'chikki',
    left: '5%',
    delay: '0s',
    duration: '10s',
    size: 20,
  },
  {
    type: 'matki',
    left: '14%',
    delay: '2s',
    duration: '12s',
    size: 26,
  },
  {
    type: 'chikki',
    left: '25%',
    delay: '4s',
    duration: '11s',
    size: 17,
  },
  {
    type: 'chikki',
    left: '39%',
    delay: '1s',
    duration: '13s',
    size: 22,
  },
  {
    type: 'matki',
    left: '51%',
    delay: '5s',
    duration: '11s',
    size: 25,
  },
  {
    type: 'chikki',
    left: '64%',
    delay: '3s',
    duration: '12s',
    size: 18,
  },
  {
    type: 'matki',
    left: '76%',
    delay: '7s',
    duration: '13s',
    size: 24,
  },
  {
    type: 'chikki',
    left: '88%',
    delay: '2.5s',
    duration: '10s',
    size: 19,
  },
  {
    type: 'chikki',
    left: '96%',
    delay: '6s',
    duration: '12s',
    size: 16,
  },
]

function FloatingChikki({ size }) {
  return (
    <span
      style={{
        width: size,
        height: size,
      }}
      className='
        block rotate-12 rounded-[4px]
        border border-amber-900/25
        bg-linear-to-br
        from-[#f6c35b]
        via-[#d99a2b]
        to-[#a96518]
        shadow-[0_3px_8px_rgba(84,49,15,0.25)]
      '
    >
      <span className='flex h-full w-full items-center justify-center gap-[2px]'>
        <span className='size-[3px] rounded-full bg-amber-950/50' />
        <span className='size-[2px] rounded-full bg-yellow-100/70' />
        <span className='size-[3px] rounded-full bg-amber-950/40' />
      </span>
    </span>
  )
}

function FloatingMatki({ size }) {
  return (
    <span
      style={{
        width: size,
        height: size,
      }}
      className='relative block'
    >
      {/* Butter */}
      <span
        className='
          absolute top-0 left-1/2 z-20
          size-[9px]
          -translate-x-1/2
          rounded-full
          bg-[#fff7cf]
          shadow-sm
        '
      />

      {/* Pot opening */}
      <span
        className='
          absolute top-[5px] left-1/2 z-10
          h-[5px] w-[65%]
          -translate-x-1/2
          rounded-full
          bg-[#6f361c]
        '
      />

      {/* Matki */}
      <span
        className='
          absolute right-[8%] bottom-0 left-[8%]
          h-[75%]
          rounded-[45%_45%_50%_50%]
          border border-[#8a4b25]
          bg-linear-to-br
          from-[#e69a4a]
          via-[#c76c32]
          to-[#93441f]
          shadow-[0_4px_8px_rgba(70,35,15,0.25)]
        '
      />

      {/* Pot decoration */}
      <span
        className='
          absolute right-[16%] bottom-[32%] left-[16%]
          z-10 h-[2px]
          bg-[#f5d37a]
        '
      />
    </span>
  )
}

function FloatingElements() {
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none absolute inset-0 z-20 overflow-hidden'
    >
      {FLOATING_ITEMS.map((item, index) => (
        <span
          key={index}
          className='absolute -top-10 animate-[giftGoodieFall_linear_infinite]'
          style={{
            left: item.left,
            animationDelay: item.delay,
            animationDuration: item.duration,
          }}
        >
          {item.type === 'matki' ? (
            <FloatingMatki size={item.size} />
          ) : (
            <FloatingChikki size={item.size} />
          )}
        </span>
      ))}
    </div>
  )
}

function GiftStorePage() {
  return (
    <main className='overflow-hidden bg-[#fffaf3]'>

      {/* =====================================================
          GIFT STORE HEADER BANNER
      ===================================================== */}
      <section className='relative w-full overflow-hidden bg-cream-50'>

        <img
          src={giftstoreImage}
          alt='Laadli Bytes — from Shreeji’s home to your home'
          width='1920'
          height='650'
          fetchPriority='high'
          className='
            block
            h-auto
            w-full
            object-cover
            object-center
          '
        />

        {/* Floating chikki + makhan matki */}
        <FloatingElements />

      </section>


      {/* =====================================================
          GIFT STORE INTRODUCTION
      ===================================================== */}
      <section
        className='
          relative isolate overflow-hidden
          bg-linear-to-br
          from-cream-50
          via-white
          to-lightblue-50
          px-4
          py-10
          sm:px-6
          md:py-14
        '
      >
        {/* Decorative glow */}
        <div
          aria-hidden='true'
          className='
            pointer-events-none
            absolute
            -top-24
            right-0
            -z-10
            size-80
            rounded-full
            bg-caramel-500/10
            blur-3xl
          '
        />

        <div
          className='
            mx-auto
            grid
            max-w-6xl
            items-center
            gap-6
            md:grid-cols-2
            md:gap-10
          '
        >

          {/* =============================
              CONTENT
          ============================= */}
          <div className='text-center md:text-left'>

            <p
              className='
                inline-flex items-center gap-2
                rounded-full
                border border-caramel-500/30
                bg-white/80
                px-4 py-2
                text-xs font-bold
                tracking-wide
                text-caramel-700
                shadow-sm
              '
            >
              <Sparkles
                size={15}
                aria-hidden='true'
              />

              A little joy, beautifully packed
            </p>


            <h1
              className='
                mt-4
                font-display
                text-3xl
                leading-tight
                font-semibold
                text-navy-800
                sm:text-4xl
                lg:text-[44px]
              '
            >
              Gifts made to share

              <span className='mt-1 block text-caramel-700'>
                a taste of tradition
              </span>
            </h1>


            <GoldenDivider className='mt-3 md:mx-0' />


            <p
              className='
                mx-auto
                mt-4
                max-w-xl
                text-[15px]
                leading-7
                text-body
                md:mx-0
                md:text-base
              '
            >
              Send a thoughtful hamper of traditional chikkis and
              wholesome treats to make every celebration sweeter.
            </p>


            <div
              className='
                mt-6
                flex
                flex-col
                justify-center
                gap-3
                sm:flex-row
                md:justify-start
              '
            >

              <Link
                to={APP_ROUTES.PRODUCTS}
                className='
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-caramel-500
                  px-7
                  text-sm
                  font-bold
                  text-white
                  shadow-md
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:bg-caramel-700
                  hover:shadow-lg
                  focus-visible:outline-2
                  focus-visible:outline-offset-2
                  focus-visible:outline-navy-800
                '
              >
                <Gift
                  size={17}
                  aria-hidden='true'
                />

                Explore our treats
              </Link>


              <span
                className='
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  border border-caramel-500/30
                  bg-white/70
                  px-6
                  text-sm
                  font-semibold
                  text-navy-700
                '
              >
                <Heart
                  size={16}
                  className='text-caramel-700'
                  aria-hidden='true'
                />

                Made with love in Vrindavan
              </span>

            </div>
          </div>


          {/* =============================
              HAMPER
          ============================= */}
          <div className='group relative mx-auto w-full max-w-md'>

            <div
              aria-hidden='true'
              className='
                absolute
                inset-10
                rounded-full
                bg-caramel-500/15
                blur-2xl
              '
            />

            <img
              src={giftHamper}
              alt='Laadli Bytes gift hamper'
              width='1448'
              height='1086'
              loading='lazy'
              decoding='async'
              className='
                relative
                mx-auto
                max-h-[330px]
                w-full
                object-contain
                drop-shadow-[0_20px_24px_rgba(70,43,29,0.18)]
                transition-transform
                duration-700
                ease-out
                group-hover:-translate-y-2
                group-hover:scale-[1.05]
              '
            />

          </div>

        </div>
      </section>
    </main>
  )
}

export { GiftStorePage }
export default GiftStorePage