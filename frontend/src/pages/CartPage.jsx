import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { Link, useNavigate } from 'react-router'
import { Lock, RotateCw, ShoppingBag } from 'lucide-react'

import wavingMascot from '../assets/illustrations/mascot-waving-with-flute.avif'
import CartItemRow from '../components/cart/CartItemRow.jsx'
import PriceDetailsBox from '../components/cart/PriceDetailsBox.jsx'
import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { APP_SETTINGS } from '../constants/appSettings.js'
import { useAuth } from '../hooks/useAuth.js'
import { useCart } from '../hooks/useCart.js'

const PAGE_CLASSES = 'px-3 py-5 sm:px-4 md:py-8 lg:px-6 xl:px-16 2xl:px-24'

const PRIMARY_BUTTON_CLASSES =
  'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy-800 px-6 text-sm font-bold text-white shadow-md transition hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 disabled:cursor-not-allowed disabled:bg-lightblue-100 disabled:text-muted disabled:shadow-none'

function CartSkeleton() {
  return (
    <div aria-hidden='true' className='grid gap-6 lg:grid-cols-12 lg:gap-8'>
      <div className='space-y-4 lg:col-span-8'>
        {[0, 1, 2].map((index) => (
          <div key={index} className='flex gap-4'>
            <div className='size-24 animate-pulse rounded-xl bg-cream-100' />
            <div className='flex-1 space-y-2'>
              <div className='h-4 w-2/3 animate-pulse rounded bg-cream-100' />
              <div className='h-4 w-1/4 animate-pulse rounded bg-cream-100' />
              <div className='h-10 w-32 animate-pulse rounded-lg bg-cream-100' />
            </div>
          </div>
        ))}
      </div>
      <div className='h-64 animate-pulse rounded-2xl bg-cream-100 lg:col-span-4' />
    </div>
  )
}

/** Nothing in the cart yet: the mascot and a way to the products. */
function EmptyCart() {
  return (
    <div className='mx-auto max-w-md py-10 text-center'>
      <img src={wavingMascot} alt='' aria-hidden='true' width='400' height='400' className='mx-auto w-36' />
      <h2 className='mt-4 text-2xl font-semibold text-navy-800'>Your cart is empty</h2>
      <p className='mt-2 text-body'>Our chikkis are waiting for you. Pick a few favourites and they will show up here.</p>
      <Link
        to={APP_ROUTES.PRODUCTS}
        className='mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-800 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'
      >
        <ShoppingBag size={16} strokeWidth={1.75} aria-hidden='true' />
        Browse products
      </Link>
    </div>
  )
}


function CartPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cart, status, updateQuantity, removeFromCart, clearCart, isPending, reload } = useCart()

  useEffect(() => {
    const previousTitle = document.title
    document.title = `Your Cart | ${APP_SETTINGS.SITE_NAME}`
    return () => {
      document.title = previousTitle
    }
  }, [])

  const hasIssues = cart?.items.some((item) => item.issue) ?? false

  function handleCheckout() {
    if (!user) {
      navigate(APP_ROUTES.IDENTIFY, { state: { returnTo: APP_ROUTES.CART } })
      return
    }
    // Checkout, orders and payment are the next branch.
    toast('Checkout is coming soon.')
  }

  let content
  if (status === 'loading' && !cart) {
    content = <CartSkeleton />
  } else if (status === 'error' && !cart) {
    content = (
      <div className='py-10 text-center'>
        <p className='text-body'>We couldn’t load your cart right now.</p>
        <button
          type='button'
          onClick={reload}
          className='mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-800 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'
        >
          <RotateCw size={16} strokeWidth={1.75} aria-hidden='true' />
          Try again
        </button>
      </div>
    )
  } else if (!cart.items.length) {
    content = <EmptyCart />
  } else {
    content = (
      <div className='grid gap-6 lg:grid-cols-12 lg:gap-8'>
        <section aria-label='Items in your cart' className='lg:col-span-8'>
          <div className='rounded-2xl border border-line bg-surface px-4 shadow-card sm:px-5'>
            <ul className='divide-y divide-line'>
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.product.id}
                  item={item}
                  onQuantityChange={updateQuantity}
                  onRemove={removeFromCart}
                  isPending={isPending(item.product.id)}
                />
              ))}
            </ul>
          </div>
          <div className='mt-3 flex items-center justify-between gap-3'>
            <Link to={APP_ROUTES.PRODUCTS} className='text-sm font-semibold text-navy-700 hover:underline'>
              Continue shopping
            </Link>
            <button
              type='button'
              onClick={clearCart}
              className='min-h-11 rounded-lg px-2 text-sm font-semibold text-muted transition hover:text-error'
            >
              Remove all
            </button>
          </div>
        </section>

        <div className='lg:col-span-4'>
          <div className='lg:sticky lg:top-28'>
            <PriceDetailsBox cart={cart}>
              <button type='button' onClick={handleCheckout} disabled={hasIssues} className={PRIMARY_BUTTON_CLASSES}>
                {!user && <Lock size={16} strokeWidth={2} aria-hidden='true' />}
                {user ? 'Proceed to Payment' : 'Sign in to Payment'}
              </button>
              {hasIssues && (
                <p className='mt-2 text-center text-xs font-semibold text-error'>
                  Fix the items marked above to continue.
                </p>
              )}
            </PriceDetailsBox>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-linear-to-b from-cream-50 via-surface to-surface'>
      <div className={PAGE_CLASSES}>
        <h1 className='mb-6 text-center text-3xl font-semibold text-navy-800 md:mb-8 md:text-4xl'>Your Cart</h1>
        {content}
      </div>
    </div>
  )
}

export default CartPage