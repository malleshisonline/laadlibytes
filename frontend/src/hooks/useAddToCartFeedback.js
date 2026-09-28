import { useCallback, useEffect, useRef, useState } from 'react'

// How long a card's button shows "Added" before returning to "Add to Cart".
const ADDED_FEEDBACK_MS = 1500

/**
 * Placeholder until the cart module exists: only the product card's brief "Added" confirmation, nothing is
 * stored. Returns { handleAddToCart(product), isAdded(productId) }; swap the handler for the real cart action
 * later and ProductCard needs no change.
 */
export function useAddToCartFeedback() {
  const [addedProductIds, setAddedProductIds] = useState(() => new Set())
  const timersRef = useRef(new Map())

  // Clear any pending timers on unmount.
  useEffect(() => {
    const timers = timersRef.current
    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [])

  const handleAddToCart = useCallback((product) => {
    const timers = timersRef.current
    clearTimeout(timers.get(product.id))

    setAddedProductIds((current) => new Set(current).add(product.id))
    timers.set(
      product.id,
      setTimeout(() => {
        timers.delete(product.id)
        setAddedProductIds((current) => {
          const next = new Set(current)
          next.delete(product.id)
          return next
        })
      }, ADDED_FEEDBACK_MS),
    )
  }, [])

  const isAdded = useCallback((productId) => addedProductIds.has(productId), [addedProductIds])

  return { handleAddToCart, isAdded }
}

export default useAddToCartFeedback