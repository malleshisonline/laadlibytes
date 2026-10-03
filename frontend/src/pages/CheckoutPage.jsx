import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'react-hot-toast'
import { RotateCw, ShoppingBag } from 'lucide-react'

import { orderApi } from '../api/orderApi.js'
import wavingMascot from '../assets/illustrations/mascot-waving-with-flute.avif'
import DeliveryAddressBox from '../components/cart/DeliveryAddressBox.jsx'
import OrderSummaryView from '../components/checkout/OrderSummaryView.jsx'
import { APP_ROUTES, orderDetailsPath, productDetailsPath } from '../constants/appRoutepoints.js'
import { APP_SETTINGS } from '../constants/appSettings.js'
import { pickAddress, useAddresses } from '../hooks/useAddresses.js'
import { useAuth } from '../hooks/useAuth.js'
import { useCart } from '../hooks/useCart.js'
import { useProduct } from '../hooks/useProduct.js'
import { formatAddressLine, formatIndianMobile } from '../utils/addressValidation.js'
import { maxQuantityFor } from '../utils/productStock.js'

const PAGE_CLASSES = 'px-3 py-5 sm:px-4 md:py-8 lg:px-6 xl:px-16 2xl:px-24'

const PRIMARY_LINK_CLASSES =
  'mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-800 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'

const HEADER_LINK_CLASSES = 'min-h-11 content-center px-2 text-sm font-semibold text-navy-700 hover:underline'

// Backend messages written for shoppers, shown as they are ("Only 1 left of Peanut Chikki").
const SHOPPER_MESSAGE_CODES = ['INSUFFICIENT_STOCK', 'PRODUCT_UNAVAILABLE']

const PLACE_ORDER_ERROR_MESSAGES = {
  ADDRESS_NOT_FOUND: 'That address is no longer saved. Please choose another one.',
  CART_EMPTY: 'Your cart is empty.',
  PRODUCT_NOT_FOUND: 'Sorry, this product is no longer available.',
}

function placeOrderErrorMessage(error) {
  if (SHOPPER_MESSAGE_CODES.includes(error.code)) return error.message
  if (PLACE_ORDER_ERROR_MESSAGES[error.code]) return PLACE_ORDER_ERROR_MESSAGES[error.code]
  if (error.status === 0) return 'We couldn’t reach the store. Check your internet connection and try again.'
  if (error.status === 429) return 'Too many tries in a short time. Please wait a moment and try again.'
  return 'Sorry, we couldn’t place your order. Please try again.'
}

/**
 * Returns placeOrder({ addressId, buyNow }, onFailure). On success it opens the new order (replacing the Order
 * Summary in history, so Back doesn't offer to place it again); on failure it shows a toast and calls
 * `onFailure`, which reloads whatever may have changed (stock, the cart, the addresses).
 */
function usePlaceOrder() {
  const navigate = useNavigate()

  return useCallback(
    async (payload, onFailure) => {
      try {
        const order = await orderApi.place(payload)
        navigate(orderDetailsPath(order.id), { replace: true, state: { justPlaced: true } })
        return order
      } catch (error) {
        toast.error(placeOrderErrorMessage(error))
        onFailure?.(error)
        return null
      }
    },
    [navigate],
  )
}

function SummarySkeleton() {
  return (
    <div aria-hidden='true' className='grid gap-6 lg:grid-cols-12 lg:gap-8'>
      <div className='space-y-4 lg:col-span-8'>
        {[0, 1, 2].map((index) => (
          <div key={index} className='h-32 animate-pulse rounded-2xl bg-cream-100' />
        ))}
      </div>
      <div className='h-64 animate-pulse rounded-2xl bg-cream-100 lg:col-span-4' />
    </div>
  )
}

function LoadError({ onRetry }) {
  return (
    <div className='py-10 text-center'>
      <p className='text-body'>We couldn’t load your order details right now.</p>
      <button
        type='button'
        onClick={onRetry}
        className='mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-800 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'
      >
        <RotateCw size={16} strokeWidth={1.75} aria-hidden='true' />
        Try again
      </button>
    </div>
  )
}

/** A message in place of the summary (empty cart, no address…) with one way forward. */
function SummaryNotice({ title, text, linkTo, linkText }) {
  return (
    <div className='mx-auto max-w-md py-10 text-center'>
      <img src={wavingMascot} alt='' aria-hidden='true' width='400' height='400' className='mx-auto w-32' />
      <h2 className='mt-4 text-2xl font-semibold text-navy-800'>{title}</h2>
      <p className='mt-2 text-body'>{text}</p>
      <Link to={linkTo} className={PRIMARY_LINK_CLASSES}>
        <ShoppingBag size={16} strokeWidth={1.75} aria-hidden='true' />
        {linkText}
      </Link>
    </div>
  )
}

/** The chosen address, read-only. */
function AddressSummary({ address }) {
  return (
    <>
      <p className='flex flex-wrap items-center gap-x-2 gap-y-1'>
        <span className='font-semibold text-navy-800'>{address.name}</span>
        <span className='text-sm font-semibold text-body'>{formatIndianMobile(address.phone)}</span>
      </p>
      <address className='mt-1 text-sm leading-relaxed not-italic wrap-break-word text-body'>
        {formatAddressLine(address)}
      </address>
    </>
  )
}

/**
 * A one-line order in the cart's shape, for Buy Now: the quantity is kept between 1 and what can be bought,
 * and an out-of-stock product is flagged the way the cart flags it.
 */
function buyNowOrder(product, requestedQuantity) {
  const quantity = Math.max(1, Math.min(requestedQuantity, maxQuantityFor(product) || 1))
  const mrp = Math.max(product.mrp ?? product.price, product.price)
  const subtotal = product.price * quantity
  const mrpTotal = mrp * quantity
  const item = {
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      mrp: product.mrp,
      image: product.images?.[0] ?? null,
      stock: product.stock,
    },
    quantity,
    lineTotal: subtotal,
    issue: product.inStock ? null : 'OUT_OF_STOCK',
  }
  return { items: [item], itemCount: quantity, subtotal, mrpTotal, savings: mrpTotal - subtotal }
}

/** The whole cart, delivered to the address chosen in the cart (the default when none was passed). */
function CartOrderSummary() {
  const location = useLocation()
  const { cart, status: cartStatus, reload } = useCart()
  const { addresses, status: addressStatus, retry } = useAddresses()
  const placeOrder = usePlaceOrder()

  if ((cartStatus === 'loading' && !cart) || addressStatus === 'loading') return <SummarySkeleton />

  if ((cartStatus === 'error' && !cart) || addressStatus === 'error') {
    return (
      <LoadError
        onRetry={() => {
          if (!cart) reload()
          if (addressStatus === 'error') retry()
        }}
      />
    )
  }

  if (!cart.items.length) {
    return (
      <SummaryNotice
        title='Your cart is empty'
        text='Add a few chikkis to your cart and come back to place the order.'
        linkTo={APP_ROUTES.PRODUCTS}
        linkText='Browse products'
      />
    )
  }

  const address = pickAddress(addresses, location.state?.addressId)
  if (!address) {
    return (
      <SummaryNotice
        title='Add a delivery address'
        text='Tell us where to deliver your order. You can add an address in your cart.'
        linkTo={APP_ROUTES.CART}
        linkText='Go to cart'
      />
    )
  }

  // The ordered lines leave the cart on the server, so the cart is reloaded either way: after an order it is
  // (usually) empty, after a stock error the short line comes back flagged.
  async function handlePlaceOrder() {
    const order = await placeOrder({ addressId: address.id }, (error) => {
      if (error.code === 'ADDRESS_NOT_FOUND') retry()
    })
    reload()
    return order
  }

  return (
    <OrderSummaryView
      order={cart}
      onPlaceOrder={handlePlaceOrder}
      address={<AddressSummary address={address} />}
      addressAction={
        <Link to={APP_ROUTES.CART} className={HEADER_LINK_CLASSES}>
          Change
        </Link>
      }
      itemsAction={
        <Link to={APP_ROUTES.CART} className={HEADER_LINK_CLASSES}>
          Edit
        </Link>
      }
    />
  )
}

/**
 * Buy Now on a product that isn't in the cart: that product alone, and the cart is left as it is. The cart page
 * isn't part of this path, so the address is chosen (or added) right here.
 */
function BuyNowOrderSummary({ slug, quantity }) {
  const { user } = useAuth()
  const { product, status: productStatus, retry: retryProduct } = useProduct(slug)
  const addressState = useAddresses()
  const [chosenAddressId, setChosenAddressId] = useState(null)
  const placeOrder = usePlaceOrder()

  if (productStatus === 'loading' || addressState.status === 'loading') return <SummarySkeleton />

  if (productStatus === 'not-found') {
    return (
      <SummaryNotice
        title='Product not found'
        text='This product may have sold out or moved. Have a look at the rest of our collection.'
        linkTo={APP_ROUTES.PRODUCTS}
        linkText='Browse products'
      />
    )
  }

  if (productStatus === 'error' || addressState.status === 'error') {
    return (
      <LoadError
        onRetry={() => {
          if (productStatus === 'error') retryProduct()
          if (addressState.status === 'error') addressState.retry()
        }}
      />
    )
  }

  const selectedAddress = pickAddress(addressState.addresses, chosenAddressId)
  const order = buyNowOrder(product, quantity)

  // Buy Now never touches the cart. A failure reloads the product, so a sold-out one shows as out of stock.
  function handlePlaceOrder() {
    const buyNow = { productId: product.id, quantity: order.items[0].quantity }
    return placeOrder({ addressId: selectedAddress.id, buyNow }, (error) => {
      if (error.code === 'ADDRESS_NOT_FOUND') addressState.retry()
      else retryProduct()
    })
  }

  return (
    <OrderSummaryView
      order={order}
      onPlaceOrder={handlePlaceOrder}
      address={
        <DeliveryAddressBox
          bare
          user={user}
          addresses={addressState.addresses}
          status={addressState.status}
          onRetry={addressState.retry}
          onCreateAddress={addressState.createAddress}
          selectedId={selectedAddress?.id}
          onSelect={setChosenAddressId}
        />
      }
      itemsAction={
        <Link to={productDetailsPath(product.slug)} className={HEADER_LINK_CLASSES}>
          Edit
        </Link>
      }
      canPlaceOrder={Boolean(selectedAddress)}
    />
  )
}

/**
 * Order Summary (behind RequireAuth). `?buyNow=<slug>&qty=<n>` (Buy Now on a product not in the cart) shows
 * that product alone; otherwise it is the whole cart, from the cart's Continue or Buy Now on a product already
 * in the cart.
 */
function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const buyNowSlug = searchParams.get('buyNow')?.trim()
  const buyNowQuantity = Number.parseInt(searchParams.get('qty') ?? '1', 10)

  useEffect(() => {
    const previousTitle = document.title
    document.title = `Order Summary | ${APP_SETTINGS.SITE_NAME}`
    return () => {
      document.title = previousTitle
    }
  }, [])

  return (
    <div className='bg-linear-to-b from-cream-50 via-surface to-surface'>
      <div className={PAGE_CLASSES}>
        <h1 className='mb-6 text-center text-3xl font-semibold text-navy-800 md:mb-8 md:text-4xl'>Order Summary</h1>
        {buyNowSlug ? (
          <BuyNowOrderSummary
            key={buyNowSlug}
            slug={buyNowSlug}
            quantity={Number.isInteger(buyNowQuantity) && buyNowQuantity > 0 ? buyNowQuantity : 1}
          />
        ) : (
          <CartOrderSummary />
        )}
      </div>
    </div>
  )
}

export default CheckoutPage