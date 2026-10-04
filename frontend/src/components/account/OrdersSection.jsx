import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight, LoaderCircle, Package, RotateCw, ShoppingBag } from 'lucide-react'

import { orderApi } from '../../api/orderApi.js'
import { APP_ROUTES, orderDetailsPath } from '../../constants/appRoutepoints.js'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'
import {
  formatOrderDate,
  orderStatusBadgeClasses,
  orderStatusLabel,
  paymentStatusBadgeClasses,
  paymentStatusLabel,
} from '../../utils/orderStatus.js'
import { formatPrice } from '../../utils/productFormatters.js'

import AccountCard from './AccountCard.jsx'

const PRIMARY_BUTTON_CLASSES =
  'mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-800 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'

// At most this many product photos per order row; the rest become "+2".
const THUMBNAIL_LIMIT = 3
const THUMBNAIL_SIZE = 48

function OrderThumbnails({ items }) {
  const shown = items.slice(0, THUMBNAIL_LIMIT)
  const hiddenCount = items.length - shown.length

  return (
    <div className='flex shrink-0 -space-x-3'>
      {shown.map((item) => (
        <span key={item.product} className='size-12 overflow-hidden rounded-lg border-2 border-surface bg-cream-100 p-0.5'>
          {item.image?.url && (
            <img
              src={cloudinaryImageUrl(item.image.url, THUMBNAIL_SIZE * 2, THUMBNAIL_SIZE * 2, { crop: 'limit' })}
              alt=''
              width={THUMBNAIL_SIZE}
              height={THUMBNAIL_SIZE}
              loading='lazy'
              decoding='async'
              className='size-full object-contain'
            />
          )}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className='grid size-12 place-items-center rounded-lg border-2 border-surface bg-lightblue-100 text-xs font-bold text-navy-800'>
          +{hiddenCount}
        </span>
      )}
    </div>
  )
}

function OrderRow({ order }) {
  return (
    <li>
      <Link
        to={orderDetailsPath(order.id)}
        className='flex items-center gap-3 rounded-xl border border-line p-3 transition hover:border-lightblue-300 hover:bg-lightblue-50 sm:gap-4 sm:p-4'
      >
        <OrderThumbnails items={order.items} />
        <div className='min-w-0 flex-1'>
          <p className='font-bold wrap-break-word text-navy-800'>{order.orderNumber}</p>
          <p className='mt-0.5 text-sm text-muted'>
            {formatOrderDate(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} ·{' '}
            <span className='font-semibold text-navy-800'>{formatPrice(order.total)}</span>
          </p>
          <p className='mt-2 flex flex-wrap gap-2'>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${orderStatusBadgeClasses(order.status)}`}>
              {orderStatusLabel(order.status)}
            </span>
            {order.status !== 'voided' && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${paymentStatusBadgeClasses(order.paymentStatus)}`}
              >
                {paymentStatusLabel(order.paymentStatus)}
              </span>
            )}
          </p>
        </div>
        <ChevronRight size={20} strokeWidth={1.75} aria-hidden='true' className='shrink-0 text-muted' />
      </Link>
    </li>
  )
}

/**
 * The user's orders, newest first, a page at a time with "Load more". Returns { orders, meta, status,
 * isLoadingMore, loadMore, retry }; `status` is 'loading' | 'error' | 'ready'.
 */
function useMyOrders() {
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState(null)
  const [status, setStatus] = useState('loading')
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isCancelled = false
    orderApi
      .list(1)
      .then(({ data, meta: firstMeta }) => {
        if (isCancelled) return
        setOrders(data)
        setMeta(firstMeta)
        setStatus('ready')
      })
      .catch(() => {
        if (!isCancelled) setStatus('error')
      })
    return () => {
      isCancelled = true
    }
  }, [reloadKey])

  const retry = useCallback(() => {
    setStatus('loading')
    setReloadKey((key) => key + 1)
  }, [])

  const loadMore = useCallback(async () => {
    if (!meta?.hasNextPage || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const { data, meta: nextMeta } = await orderApi.list(meta.page + 1)
      // A new order placed meanwhile shifts the pages by one, so skip any order already shown.
      setOrders((current) => {
        const shownIds = new Set(current.map((order) => order.id))
        return [...current, ...data.filter((order) => !shownIds.has(order.id))]
      })
      setMeta(nextMeta)
    } catch {
      // The button stays, so the user can simply try again.
    } finally {
      setIsLoadingMore(false)
    }
  }, [meta, isLoadingMore])

  return { orders, meta, status, isLoadingMore, loadMore, retry }
}

/** My Account → My Orders. Each row opens the order's details. */
function OrdersSection() {
  const { orders, meta, status, isLoadingMore, loadMore, retry } = useMyOrders()

  if (status === 'loading') {
    return (
      <AccountCard title='My Orders'>
        <div aria-hidden='true' className='space-y-3'>
          {[0, 1, 2].map((index) => (
            <div key={index} className='h-24 animate-pulse rounded-xl bg-cream-100' />
          ))}
        </div>
        <span role='status' className='sr-only'>
          Loading your orders…
        </span>
      </AccountCard>
    )
  }

  if (status === 'error') {
    return (
      <AccountCard title='My Orders'>
        <div className='py-8 text-center'>
          <p className='text-body'>We couldn’t load your orders right now.</p>
          <button type='button' onClick={retry} className={PRIMARY_BUTTON_CLASSES}>
            <RotateCw size={16} strokeWidth={1.75} aria-hidden='true' />
            Try again
          </button>
        </div>
      </AccountCard>
    )
  }

  if (!orders.length) {
    return (
      <AccountCard title='My Orders'>
        <div className='py-8 text-center'>
          <Package size={40} strokeWidth={1.5} className='mx-auto text-muted' aria-hidden='true' />
          <h3 className='mt-3 text-lg font-semibold text-navy-800'>No orders yet</h3>
          <p className='mt-1 text-body'>When you place an order, you can follow it here.</p>
          <Link to={APP_ROUTES.PRODUCTS} className={PRIMARY_BUTTON_CLASSES}>
            <ShoppingBag size={16} strokeWidth={1.75} aria-hidden='true' />
            Start shopping
          </Link>
        </div>
      </AccountCard>
    )
  }

  return (
    <AccountCard title='My Orders' description={`${meta.total} ${meta.total === 1 ? 'order' : 'orders'}`}>
      <ul className='space-y-3'>
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </ul>
      {meta.hasNextPage && (
        <div className='mt-5 text-center'>
          <button
            type='button'
            onClick={loadMore}
            disabled={isLoadingMore}
            className='inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-6 text-sm font-semibold text-navy-800 transition hover:bg-lightblue-100 disabled:cursor-not-allowed disabled:text-muted'
          >
            {isLoadingMore && <LoaderCircle size={16} strokeWidth={1.75} aria-hidden='true' className='animate-spin' />}
            {isLoadingMore ? 'Loading…' : 'Load more orders'}
          </button>
        </div>
      )}
    </AccountCard>
  )
}

export default OrdersSection