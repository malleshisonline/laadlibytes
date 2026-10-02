import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { useCart } from './useCart.js'

/**
 * Add to Cart and Buy Now for product cards and the details page. Buy Now adds the product (unless it is
 * already in the cart, so a second click never adds another unit) and opens checkout, which sends guests
 * through sign-in first. A failed add shows the cart's error toast and stays on the page. Returns
 * { addToCart(product, quantity = 1), buyNow(product, quantity = 1), isInCart(productId), isPending(productId) }.
 */
export function useProductCartActions() {
  const navigate = useNavigate()
  const { addToCart: addItem, isInCart, isPending } = useCart()

  const addToCart = useCallback((product, quantity = 1) => addItem(product, quantity), [addItem])

  const buyNow = useCallback(
    async (product, quantity = 1) => {
      if (!isInCart(product.id) && !(await addItem(product, quantity))) return
      navigate(APP_ROUTES.CHECKOUT)
    },
    [addItem, isInCart, navigate],
  )

  return { addToCart, buyNow, isInCart, isPending }
}

export default useProductCartActions