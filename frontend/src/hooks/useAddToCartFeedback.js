import { useCallback, useEffect, useRef, useState } from 'react'

import { useCart } from './useCart.js'

// How long a card's button shows "Added" before returning to "Add to Cart".
const ADDED_FEEDBACK_MS = 1500

/**
 * Add to Cart for product cards and the details page: adds through the cart, then shows the button's brief
 * "Added" confirmation. A failed add shows the cart's error toast and no "Added". Returns
 * { handleAddToCart(product, quantity = 1), isAdded(productId) }.
 */
export function useAddToCartFeedback() {
  const { addToCart } = useCart()
  const [addedProductIds, setAddedProductIds] = useState(() => new Set())
  const timersRef = useRef(new Map())

  // Clear any pending timers on unmount.
  useEffect(() => {
    const timers = timersRef.current
    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [])

  const handleAddToCart = useCallback(
    async (product, quantity = 1) => {
      if (!(await addToCart(product, quantity))) return

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
    },
    [addToCart],
  )

  const isAdded = useCallback((productId) => addedProductIds.has(productId), [addedProductIds])

  return { handleAddToCart, isAdded }
}

export default useAddToCartFeedback