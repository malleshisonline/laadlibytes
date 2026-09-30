import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'

import { cartApi } from '../api/cartApi.js'
import { useAuth } from '../hooks/useAuth.js'

import { CartContext } from './cartContext.js'

// Backend messages written for shoppers, shown as they are ("Only 3 left in stock").
const SHOPPER_MESSAGE_CODES = ['INSUFFICIENT_STOCK', 'CART_LIMIT']

const CART_ERROR_MESSAGES = {
  PRODUCT_NOT_FOUND: 'Sorry, this product is no longer available.',
  CART_ITEM_NOT_FOUND: 'This item is no longer in your cart.',
}

const GENERIC_CART_ERROR = 'Sorry, we couldn’t update your cart. Please try again.'

/**
 * A toast message the shopper can understand. Anything the cart doesn't expect (a missing route, a server
 * error, a validation detail) becomes one plain sentence instead of the technical backend message.
 */
function cartErrorMessage(error) {
  if (SHOPPER_MESSAGE_CODES.includes(error.code)) return error.message
  if (CART_ERROR_MESSAGES[error.code]) return CART_ERROR_MESSAGES[error.code]
  if (error.status === 0) return 'We couldn’t reach the store. Check your internet connection and try again.'
  if (error.status === 429) return 'Too many tries in a short time. Please wait a moment and try again.'
  return GENERIC_CART_ERROR
}

/**
 * Holds the shopper's cart, kept on the server (see cartApi.js). It loads once the session is restored and
 * again whenever the signed-in user changes: after sign-in that brings in the merged guest cart, and after
 * logout the (empty) guest cart. Every change answers with the whole cart, which simply replaces the state.
 */
function CartProvider({ children }) {
  const { user, isRestoringSession } = useAuth()
  const [cart, setCart] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'error'
  const [pendingProductIds, setPendingProductIds] = useState(() => new Set())

  // Requests can finish out of order; only a response newer than the one on screen may replace it.
  const requestSeqRef = useRef(0)
  const appliedSeqRef = useRef(0)

  const run = useCallback(async (call) => {
    const seq = ++requestSeqRef.current
    const nextCart = await call()
    if (seq > appliedSeqRef.current) {
      appliedSeqRef.current = seq
      setCart(nextCart)
      setStatus('ready')
    }
    return nextCart
  }, [])

  // A failed load keeps a cart already on screen; only with nothing to show does the page offer a retry.
  const markLoadFailed = useCallback(() => setStatus((current) => (current === 'ready' ? current : 'error')), [])

  const reload = useCallback(() => run(cartApi.get).catch(markLoadFailed), [run, markLoadFailed])

  const userId = user?.id ?? null
  useEffect(() => {
    if (isRestoringSession) return
    run(cartApi.get).catch(markLoadFailed)
  }, [isRestoringSession, userId, run, markLoadFailed])

  /** Runs one item change with its product marked pending; errors become a toast. Resolves true on success. */
  const changeItem = useCallback(
    async (productId, call) => {
      setPendingProductIds((current) => new Set(current).add(productId))
      try {
        await run(call)
        return true
      } catch (error) {
        toast.error(cartErrorMessage(error))
        return false
      } finally {
        setPendingProductIds((current) => {
          const next = new Set(current)
          next.delete(productId)
          return next
        })
      }
    },
    [run],
  )

  const addToCart = useCallback(
    (product, quantity = 1) => changeItem(product.id, () => cartApi.addItem(product.id, quantity)),
    [changeItem],
  )

  const updateQuantity = useCallback(
    (productId, quantity) => changeItem(productId, () => cartApi.updateItem(productId, quantity)),
    [changeItem],
  )

  const removeFromCart = useCallback(
    (productId) => changeItem(productId, () => cartApi.removeItem(productId)),
    [changeItem],
  )

  const clearCart = useCallback(async () => {
    try {
      await run(cartApi.clear)
      return true
    } catch (error) {
      toast.error(cartErrorMessage(error))
      return false
    }
  }, [run])

  const isPending = useCallback((productId) => pendingProductIds.has(productId), [pendingProductIds])

  const value = useMemo(
    () => ({
      cart,
      status,
      itemCount: cart?.itemCount ?? 0,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      isPending,
      reload,
    }),
    [cart, status, addToCart, updateQuantity, removeFromCart, clearCart, isPending, reload],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider