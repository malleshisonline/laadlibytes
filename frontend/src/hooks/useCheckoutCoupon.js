import { useCallback, useEffect, useState } from 'react'

import { couponApi } from '../api/couponApi.js'
import { clearSavedCouponCode, COUPON_PICKED_EVENT, readSavedCouponCode, saveCouponCode } from '../utils/couponLink.js'

function couponErrorMessage(error) {
  // The backend's coupon messages are written for shoppers ("This coupon has expired").
  if (error.code?.startsWith('COUPON_')) return error.message
  if (error.status === 429) return 'Too many tries. Please wait a moment and try again.'
  if (error.status === 0) return 'We couldn’t reach the store. Check your internet connection and try again.'
  return 'We couldn’t apply this coupon right now. Please try again.'
}

/**
 * The coupon on the Order Summary. The backend prices it (`preview`: { code, description, subtotal, discount,
 * total }); the page only shows that. The applied code is priced again whenever `pricingKey` (the lines), the
 * Buy Now line or the delivery `phone` changes, and a code saved from a share link is applied when the page opens.
 * A code the backend refuses is dropped, with its message in `error`.
 *
 * `enabled` holds the pricing back until there is something to price (the cart or the Buy Now product has loaded).
 *
 * Returns { code, preview, error, isApplying, apply, remove, revalidate }. `preview` is null while a code is being
 * priced, so the page never shows (or charges) a stale discount.
 */
export function useCheckoutCoupon({ buyNow, phone, pricingKey, enabled = true }) {
  const [code, setCode] = useState(readSavedCouponCode)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const buyNowProductId = buyNow?.productId
  const buyNowQuantity = buyNow?.quantity
  const requestKey =
    code && enabled ? [code, pricingKey, buyNowProductId, buyNowQuantity, phone, attempt].join('|') : null
  // The last finished request and which key it answered, like useProduct.
  const [result, setResult] = useState({ key: null, preview: null })

  useEffect(() => {
    if (!requestKey) return undefined
    let isCancelled = false

    couponApi
      .apply({
        code,
        buyNow: buyNowProductId ? { productId: buyNowProductId, quantity: buyNowQuantity } : undefined,
        phone,
      })
      .then((preview) => {
        if (isCancelled) return
        setResult({ key: requestKey, preview })
        saveCouponCode(preview.code)
      })
      .catch((applyError) => {
        if (isCancelled) return
        setResult({ key: requestKey, preview: null })
        setCode(null)
        setError(couponErrorMessage(applyError))
        clearSavedCouponCode()
      })

    return () => {
      isCancelled = true
    }
  }, [requestKey, code, buyNowProductId, buyNowQuantity, phone])

  const apply = useCallback((typedCode) => {
    const nextCode = typedCode.trim().toUpperCase()
    if (!nextCode) return
    setError(null)
    setCode(nextCode)
    setAttempt((count) => count + 1)
  }, [])

  // "Use code" in the banner, or a share link, while this page is open.
  useEffect(() => {
    const handlePicked = (event) => apply(event.detail)
    globalThis.addEventListener(COUPON_PICKED_EVENT, handlePicked)
    return () => globalThis.removeEventListener(COUPON_PICKED_EVENT, handlePicked)
  }, [apply])

  const remove = useCallback(() => {
    setCode(null)
    setError(null)
    clearSavedCouponCode()
  }, [])

  // After a failed order: the code may have just run out, so price it again.
  const revalidate = useCallback(() => setAttempt((count) => count + 1), [])

  const isCurrent = requestKey !== null && result.key === requestKey
  return {
    code,
    preview: isCurrent ? result.preview : null,
    error,
    isApplying: requestKey !== null && !isCurrent,
    apply,
    remove,
    revalidate,
  }
}

export default useCheckoutCoupon