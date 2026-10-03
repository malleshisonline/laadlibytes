import { useCallback } from 'react'
import { useNavigate } from 'react-router'

import { APP_ROUTES, buyNowCheckoutPath } from '../constants/appRoutepoints.js'
import { useCart } from './useCart.js'

/**
 * Add to Cart and Buy Now for product cards and the details page. Buy Now on a product that isn't in the cart
 * opens an Order Summary for that product alone and leaves the cart untouched; on one already in the cart it
 * opens the Order Summary for the whole cart. Checkout sends guests through sign-in first. Returns
 * { addToCart(product, quantity = 1), buyNow(product, quantity = 1), isInCart(productId), isPending(productId) }.
 */
export function useProductCartActions() {
  const navigate = useNavigate()
  const { addToCart: addItem, isInCart, isPending } = useCart()

  const addToCart = useCallback((product, quantity = 1) => addItem(product, quantity), [addItem])

  const buyNow = useCallback(
    (product, quantity = 1) => {
      navigate(isInCart(product.id) ? APP_ROUTES.CHECKOUT : buyNowCheckoutPath(product.slug, quantity))
    },
    [isInCart, navigate],
  )

  return { addToCart, buyNow, isInCart, isPending }
}

export default useProductCartActions