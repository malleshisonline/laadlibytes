import { createContext } from 'react'

// { cart, status, itemCount, addToCart, updateQuantity, removeFromCart, clearCart, isPending, isInCart, reload }
// — provided by CartProvider.jsx.
export const CartContext = createContext(null)

export default CartContext