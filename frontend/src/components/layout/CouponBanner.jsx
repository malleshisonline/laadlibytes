import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { BadgePercent, Copy, X } from 'lucide-react'

import { couponApi } from '../../api/couponApi.js'
import { describeCouponOffer, pickCouponCode } from '../../utils/couponLink.js'
import { formatOrderDate } from '../../utils/orderStatus.js'

const DISMISSED_KEY = 'laadlibytes.couponBannerDismissed'

function readDismissedCode() {
  try {
    return globalThis.sessionStorage?.getItem(DISMISSED_KEY) ?? null
  } catch {
    return null
  }
}

/**
 * The one coupon the shop features, above the navbar. Renders nothing until one is featured, so the site looks the
 * same without it. "Use code" saves it for checkout (and copies it); closing hides it for this tab.
 */
function CouponBanner() {
  const [coupon, setCoupon] = useState(null)
  const [dismissedCode, setDismissedCode] = useState(readDismissedCode)
  useEffect(() => {
    let isCancelled = false
    couponApi
      .featured()
      .then((featured) => {
        if (!isCancelled) setCoupon(featured)
      })
      .catch(() => {
        // No banner is the same as no featured coupon.
      })
    return () => {
      isCancelled = true
    }
  }, [])
  if (!coupon || dismissedCode === coupon.code) return null

  async function handleUseCode() {
    pickCouponCode(coupon.code)
    try {
      await globalThis.navigator?.clipboard?.writeText(coupon.code)
    } catch {
      // Copying is a bonus; the code is saved for checkout either way.
    }
    toast.success(`${coupon.code} will be applied at checkout`)
  }

  function handleDismiss() {
    setDismissedCode(coupon.code)
    try {
      globalThis.sessionStorage?.setItem(DISMISSED_KEY, coupon.code)
    } catch {
      // Hidden for now; it may come back on the next visit.
    }
  }

  return (
    <aside
      aria-label='Offer'
      className='relative overflow-hidden border-y border-caramel-500/40 bg-linear-to-r from-navy-950 via-navy-800 to-navy-950 text-white'
    >
      {/* A slow light sweep across the band; decorative only. */}
      <span
        aria-hidden='true'
        className='pointer-events-none absolute inset-y-0 -left-1/3 w-1/5 -skew-x-20 bg-linear-to-r from-transparent via-caramel-500/20 to-transparent motion-safe:animate-[offerShine_6s_ease-in-out_infinite] motion-reduce:hidden'
      />
      <div className='relative flex min-h-12 flex-wrap items-center justify-center gap-x-4 gap-y-1.5 px-11 py-2 text-center text-xs sm:flex-nowrap sm:px-12 sm:text-sm'>
        <span
          aria-hidden='true'
          className='hidden size-8 shrink-0 place-items-center rounded-full bg-caramel-500/15 text-caramel-500 ring-1 ring-caramel-500/50 sm:grid'
        >
          <BadgePercent size={16} strokeWidth={1.75} />
        </span>
        <p className='flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 max-sm:w-full'>
          <span className='hidden text-[0.65rem] font-bold tracking-[0.2em] text-caramel-500 uppercase sm:inline'>
            Limited offer
          </span>
          <span className='font-semibold tracking-wide'>{coupon.description || describeCouponOffer(coupon)}</span>
          {coupon.endsAt && (
            <span className='text-xs text-lightblue-200'>· Ends {formatOrderDate(coupon.endsAt)}</span>
          )}
        </p>
        {/* One ticket: the code on the left, the Use code half on the right, both the same height. */}
        <span className='inline-flex h-9 max-w-full min-w-0 items-stretch overflow-hidden rounded-full border border-dashed border-caramel-500 bg-white/5 sm:h-8'>
          <span className='flex min-w-0 items-center truncate pr-2.5 pl-3.5 font-mono text-xs leading-none font-bold tracking-[0.18em] text-cream-100'>
            {coupon.code}
          </span>
          <button
            type='button'
            onClick={handleUseCode}
            className='flex shrink-0 items-center gap-1.5 bg-caramel-500 pr-3.5 pl-3 text-xs leading-none font-bold whitespace-nowrap text-navy-950 transition hover:bg-cream-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-950'
          >
            <Copy size={14} strokeWidth={2.25} aria-hidden='true' className='shrink-0' />
            <span>Use code</span>
          </button>
        </span>
        <button
          type='button'
          onClick={handleDismiss}
          aria-label='Close offer'
          className='absolute top-1/2 right-1 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-lightblue-200 hover:text-white focus-visible:outline-2 focus-visible:outline-white'
        >
          <X size={18} strokeWidth={1.75} aria-hidden='true' />
        </button>
      </div>
    </aside>
  )
}

export { CouponBanner }
export default CouponBanner