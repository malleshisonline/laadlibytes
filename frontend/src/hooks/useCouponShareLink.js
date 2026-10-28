import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'react-hot-toast'

import { COUPON_QUERY_PARAM, normaliseCouponCode, pickCouponCode } from '../utils/couponLink.js'

/**
 * A share link (`/?coupon=WELCOME10`, from WhatsApp or Instagram) on any storefront page: the code is saved for
 * checkout, which applies it, and taken out of the address bar so a refresh or a shared URL doesn't repeat it.
 * Whether the code is valid is checked at checkout; a bad one is only a message there, never a blocked order.
 */
export function useCouponShareLink() {
  const [searchParams, setSearchParams] = useSearchParams()
  const linkedCode = searchParams.get(COUPON_QUERY_PARAM)

  useEffect(() => {
    if (linkedCode === null) return
    const code = normaliseCouponCode(linkedCode)
    if (code) {
      pickCouponCode(code)
      toast.success(`Coupon ${code} will be applied at checkout`, { id: 'coupon-share-link' })
    }
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete(COUPON_QUERY_PARAM)
        return next
      },
      { replace: true },
    )
  }, [linkedCode, setSearchParams])
}

export default useCouponShareLink