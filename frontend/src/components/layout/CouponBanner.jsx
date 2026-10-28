import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { BadgePercent, X } from 'lucide-react'

import { couponApi } from '../../api/couponApi.js'
import { describeCouponOffer, pickCouponCode } from '../../utils/couponLink.js'

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
    <aside aria-label='Offer' className='bg-navy-800 text-white'>
      <div className='relative flex min-h-11 items-center justify-center gap-x-3 gap-y-1 px-12 py-1.5 text-center text-sm max-sm:flex-wrap'>
        <BadgePercent size={18} strokeWidth={1.75} aria-hidden='true' className='hidden shrink-0 text-caramel-500 sm:block' />
        <p>
          <span className='font-semibold'>{coupon.description || describeCouponOffer(coupon)}</span>
          <span className='text-lightblue-200'> · Use code </span>
          <span className='font-bold tracking-wide'>{coupon.code}</span>
        </p>
        <button
          type='button'
          onClick={handleUseCode}
          className='inline-flex min-h-8 items-center rounded-full bg-surface px-3 text-xs font-bold text-navy-800 transition hover:bg-lightblue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
        >
          Use code
        </button>
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