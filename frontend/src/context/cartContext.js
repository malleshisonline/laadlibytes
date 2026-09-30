import { createContext } from 'react'

// { cart, status, itemCount, addToCart, updateQuantity, removeFromCart, clearCart, isPending, reload }
// — provided by CartProvider.jsx.
export const CartContext = createContext(null)

export default CartContext