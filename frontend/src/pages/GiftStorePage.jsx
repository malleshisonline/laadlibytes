import { useEffect, useState } from 'react'
import { Building2, Gift, Heart, RotateCw, Sparkles } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router'

import giftHamper from '../assets/illustrations/product_hamper.avif'
import GoldenDivider from '../components/common/GoldenDivider.jsx'
import BulkEnquiryForm from '../components/giftHamper/BulkEnquiryForm.jsx'
import GiftHamperCard from '../components/giftHamper/GiftHamperCard.jsx'
import GiftHamperTerms from '../components/giftHamper/GiftHamperTerms.jsx'
import HamperFlavoursPanel from '../components/giftHamper/HamperFlavoursPanel.jsx'
import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useGiftHampers } from '../hooks/useGiftHampers.js'
import giftstoreImage from '../assets/backgrounds/Laadli_Bytes__Home_of_Sweet_Memories.avif'

const HAMPERS_SECTION_ID = 'gift-hampers'
const BULK_ENQUIRY_SECTION_ID = 'bulk-enquiry'

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

function SectionHeading({ id, title, subtitle }) {
  return (
    <div className='text-center'>
      <h2 id={id} className='font-display text-2xl font-semibold text-navy-800 md:text-3xl'>
        {title}
      </h2>
      <GoldenDivider className='mt-3' />
      {subtitle && <p className='mx-auto mt-3 max-w-prose text-sm text-body md:text-base'>{subtitle}</p>}
    </div>
  )
}

// Phones and tablets show 2–3 cards across, kept to about a product card's width; from lg the sidebar sits left.
const HAMPER_GRID_CLASSES = 'mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-5 lg:max-w-none'

function HamperGridSkeleton() {
  return (
    <div aria-hidden='true' className='lg:flex lg:gap-6 xl:gap-8'>
      <div className='hidden h-96 w-64 shrink-0 animate-pulse rounded-2xl bg-cream-100 lg:block' />
      <div className={`${HAMPER_GRID_CLASSES} flex-1`}>
        {[0, 1, 2].map((index) => (
          <div key={index} className='aspect-3/5 animate-pulse bg-cream-100' />
        ))}
      </div>
    </div>
  )
}

/**
 * The hampers on sale, laid out like the Products page: from lg a sidebar on the left lists what is inside the
 * hamper being hovered (the first one until then), and the cards sit on the right. Phones and tablets show the
 * cards only; each hamper's own page lists its flavours.
 */
function GiftHamperShop({ hampers, status, onRetry }) {
  const [activeHamperId, setActiveHamperId] = useState(null)

  if (status === 'loading') return <HamperGridSkeleton />

  if (status === 'error') {
    return (
      <div className='py-6 text-center'>
        <p className='text-body'>We couldn’t load the gift hampers right now.</p>
        <button
          type='button'
          onClick={onRetry}
          className='mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-800 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'
        >
          <RotateCw size={16} strokeWidth={1.75} aria-hidden='true' />
          Try again
        </button>
      </div>
    )
  }

  if (!hampers.length) {
    return (
      <p className='py-6 text-center text-body'>
        Our festive hampers are being packed. Check back soon, or ask us for a custom hamper below.
      </p>
    )
  }

  const activeHamper = hampers.find((hamper) => hamper.id === activeHamperId) ?? hampers[0]

  return (
    <div className='lg:flex lg:items-start lg:gap-6 xl:gap-8'>
      <aside aria-label={`What's inside ${activeHamper.name}`} className='hidden w-64 shrink-0 lg:sticky lg:top-28 lg:block'>
        <HamperFlavoursPanel hamper={activeHamper} />
      </aside>

      <div className='min-w-0 flex-1'>
        <ul className={HAMPER_GRID_CLASSES}>
          {hampers.map((hamper, index) => (
            <li key={hamper.id}>
              <GiftHamperCard
                hamper={hamper}
                isActive={hamper.id === activeHamper.id}
                onActivate={() => setActiveHamperId(hamper.id)}
                priority={index < 3}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/**
 * The Gift Store: the banner, the gift hampers on sale (with what is inside each), the intro, the gifting terms
 * and the bulk / corporate quote form. `?hamper=<id>#bulk-enquiry` (from a hamper's page) opens
 * the form with that hamper chosen.
 */
function GiftStorePage() {
  const { hash } = useLocation()
  const [searchParams] = useSearchParams()
  const { hampers, status, retry } = useGiftHampers()
  const requestedHamperId = searchParams.get('hamper') ?? ''

  useDocumentTitle('Gift Store')

  // The router does not scroll to `#…` itself. Wait for the hampers, so the page has its full height first.
  useEffect(() => {
    if (!hash || status === 'loading') return
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash, status])

  return (
    <main className='overflow-x-clip bg-[#fffaf3]'>

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
          GIFT HAMPERS
      ===================================================== */}
      <section
        id={HAMPERS_SECTION_ID}
        aria-labelledby='gift-hampers-heading'
        className='scroll-mt-24 px-3 py-10 sm:px-6 md:py-14'
      >
        <div className='mx-auto max-w-5xl'>
          <SectionHeading
            id='gift-hampers-heading'
            title='Festive gift hampers'
            subtitle='Premium chikkis, thoughtfully curated. Each box is made to order for you.'
          />
          <div className='mt-8'>
            <GiftHamperShop hampers={hampers} status={status} onRetry={retry} />
          </div>
        </div>
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


            {/* Stacked on phones; a row on small tablets; stacked again on md, where the text column is narrow
                beside the hamper picture; a row from lg. */}
            <div
              className='
                mt-6
                flex
                flex-col
                justify-center
                gap-3
                sm:flex-row
                sm:flex-wrap
                md:flex-col
                md:items-start
                md:justify-start
                lg:flex-row
                lg:items-center
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
                  py-2
                  text-center
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

                Made with devotion, Shared with love
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




      {/* =====================================================
          GIFTING TERMS
      ===================================================== */}
      <section aria-labelledby='gifting-terms-heading' className='bg-lightblue-50 px-4 py-10 sm:px-6 md:py-14'>
        <div className='mx-auto max-w-6xl'>
          <SectionHeading id='gifting-terms-heading' title='Gifting terms' />
          <div className='mt-8'>
            <GiftHamperTerms />
          </div>
        </div>
      </section>


      {/* =====================================================
          BULK / CORPORATE ENQUIRY
      ===================================================== */}
      <section
        id={BULK_ENQUIRY_SECTION_ID}
        aria-labelledby='bulk-enquiry-heading'
        className='scroll-mt-24 px-4 py-10 sm:px-6 md:py-14'
      >
        <div className='mx-auto max-w-3xl'>
          <SectionHeading
            id='bulk-enquiry-heading'
            title='Gifting for your team or clients?'
            subtitle='For bulk orders, a mix of hampers or a custom hamper, tell us what you need and we’ll send you a quote.'
          />
          <div className='mt-8 rounded-2xl border border-line bg-surface p-6 shadow-lg shadow-navy-900/10 md:p-8'>
            <p className='mb-5 flex items-center gap-2 text-sm font-semibold text-navy-700'>
              <Building2 size={18} strokeWidth={1.75} aria-hidden='true' className='text-caramel-700' />
              Corporate and bulk enquiry
            </p>
            {/* Keyed by the chosen hamper, so arriving from another hamper's page resets the choice. */}
            <BulkEnquiryForm key={requestedHamperId} hampers={hampers} defaultHamperId={requestedHamperId} />
          </div>
        </div>
      </section>
    </main>
  )
}

export { GiftStorePage }
export default GiftStorePage