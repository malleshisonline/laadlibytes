import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Link, useParams } from 'react-router'
import { PackageSearch, RotateCw } from 'lucide-react'

import wavingMascot from '../assets/illustrations/mascot-waving-with-flute.avif'
import ImageZoomViewer from '../components/product/details/ImageZoomViewer.jsx'
import { ProductBuyBox, ProductCartButtons } from '../components/product/details/ProductBuyBox.jsx'
import ProductImageGallery from '../components/product/details/ProductImageGallery.jsx'
import ProductInfoTabs from '../components/product/details/ProductInfoTabs.jsx'
import ProductSummary from '../components/product/details/ProductSummary.jsx'
import RelatedProducts from '../components/product/details/RelatedProducts.jsx'
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx'
import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { APP_SETTINGS } from '../constants/appSettings.js'
import { categoryProductsPath } from '../content/navigationMenuItems.js'
import { useProduct } from '../hooks/useProduct.js'
import { useProductCartActions } from '../hooks/useProductCartActions.js'
import { maxQuantityFor } from '../utils/productStock.js'

const PAGE_CLASSES = 'px-3 py-5 sm:px-4 md:py-8 lg:px-6 xl:px-16 2xl:px-24'

function DetailsSkeleton() {
  return (
    <div aria-hidden='true' className='grid gap-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-8'>
      <div className='aspect-square animate-pulse rounded-2xl bg-cream-100 lg:col-span-5' />
      <div className='space-y-3 lg:col-span-4'>
        <div className='h-4 w-1/3 animate-pulse rounded bg-cream-100' />
        <div className='h-8 w-3/4 animate-pulse rounded bg-cream-100' />
        <div className='h-10 w-1/3 animate-pulse rounded bg-cream-100' />
        <div className='h-24 animate-pulse rounded-xl bg-cream-100' />
      </div>
      <div className='h-72 animate-pulse rounded-2xl bg-cream-100 md:col-start-2 lg:col-span-3 lg:col-start-auto' />
    </div>
  )
}

/** Wrong or unpublished slug: the mascot, a message and a way back. */
function ProductNotFound() {
  return (
    <div className='mx-auto max-w-md py-12 text-center'>
      <img src={wavingMascot} alt='' aria-hidden='true' width='400' height='400' className='mx-auto w-36' />
      <h1 className='mt-4 text-2xl font-semibold text-navy-800'>Product not found</h1>
      <p className='mt-2 text-body'>This chikki may have sold out or moved. Have a look at the rest of our collection.</p>
      <Link
        to={APP_ROUTES.PRODUCTS}
        className='mt-6 inline-flex min-h-11 items-center rounded-lg bg-navy-800 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'
      >
        Browse all products
      </Link>
    </div>
  )
}

/**
 * Product details page, laid out like Amazon's in the Laadli Bytes style: photos with hover zoom and a
 * full-screen viewer, the summary column, a buy box, product information tabs and related products. On phones
 * a bar with Add to Cart and Buy Now stays at the bottom of the screen.
 */
function ProductDetailsPage() {
  const { slug } = useParams()
  const { product, status, retry } = useProduct(slug)
  const { addToCart, buyNow, isInCart, isPending } = useProductCartActions()
  const [quantity, setQuantity] = useState(1)
  const [viewerIndex, setViewerIndex] = useState(null) // photo open in the full-screen viewer, or null

  // BrowserRouter keeps the scroll position between pages, so a product opened from halfway down a list (or
  // from "You may also like" at the bottom of this page) would start near its end. Each product opens at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [slug])

  // Tab title follows the product, and goes back to the previous title when leaving the page.
  useEffect(() => {
    if (!product?.name) return undefined
    const previousTitle = document.title
    document.title = `${product.name} | ${APP_SETTINGS.SITE_NAME}`
    return () => {
      document.title = previousTitle
    }
  }, [product?.name])

  // A new product (e.g. from "You may also like") starts at quantity 1 with the viewer closed.
  const [shownProductId, setShownProductId] = useState(null)
  if (product && product.id !== shownProductId) {
    setShownProductId(product.id)
    setQuantity(1)
    setViewerIndex(null)
  }

  const closeViewer = useCallback(() => setViewerIndex(null), [])

  async function handleShare() {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: product.taglines?.[0] ?? product.name, url })
        return
      }
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    } catch (error) {
      // Closing the phone's share sheet rejects with AbortError; that isn't a failure.
      if (error?.name !== 'AbortError') toast.error('Could not share this link')
    }
  }


  if (status === 'loading') {
    return (
      <div className={PAGE_CLASSES}>
        <div className='mb-4 h-4 w-64 animate-pulse rounded bg-cream-100' />
        <DetailsSkeleton />
      </div>
    )
  }

  if (status === 'not-found') {
    return (
      <div className={PAGE_CLASSES}>
        <ProductNotFound />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={`${PAGE_CLASSES} text-center`}>
        <PackageSearch size={40} strokeWidth={1.5} aria-hidden='true' className='mx-auto mt-10 text-caramel-500' />
        <p className='mt-3 text-body'>We couldn’t load this product right now.</p>
        <button
          type='button'
          onClick={retry}
          className='mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-800 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'
        >
          <RotateCw size={16} strokeWidth={1.75} aria-hidden='true' />
          Try again
        </button>
      </div>
    )
  }

  const breadcrumbs = [
    { label: 'Home', to: APP_ROUTES.HOME },
    { label: 'Products', to: APP_ROUTES.PRODUCTS },
    product.category && { label: product.category.name, to: categoryProductsPath(product.category.slug) },
    { label: product.name },
  ].filter(Boolean)

  const images = product.images ?? []
  // Never above what can be bought now (stock can be lower than a quantity picked earlier).
  const safeQuantity = Math.max(1, Math.min(quantity, maxQuantityFor(product) || 1))
  const cartButtonProps = {
    product,
    inCart: isInCart(product.id),
    pending: isPending(product.id),
    onAddToCart: () => addToCart(product, safeQuantity),
    onBuyNow: () => buyNow(product, safeQuantity),
  }

  return (
    <div className='bg-linear-to-b from-cream-50 via-surface to-surface'>
      <div className={PAGE_CLASSES}>
        <Breadcrumbs items={breadcrumbs} className='mb-4 md:mb-6' />

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-12 lg:gap-8'>
          {/* Photos: sticky beside the details on desktop. The hover-zoom pane opens over the next column. */}
          <div className='md:row-span-2 lg:col-span-5 lg:row-span-1'>
            <div className='md:sticky md:top-28'>
              <ProductImageGallery
                key={product.id}
                images={images}
                productName={product.name}
                onOpenViewer={setViewerIndex}
              />
            </div>
          </div>

          <div className='lg:col-span-4'>
            <ProductSummary product={product} />
          </div>

          <div className='md:col-start-2 lg:col-span-3 lg:col-start-auto'>
            <div className='lg:sticky lg:top-28'>
              <ProductBuyBox
                {...cartButtonProps}
                quantity={safeQuantity}
                onQuantityChange={setQuantity}
                onShare={handleShare}
              />
            </div>
          </div>
        </div>

        <div className='mt-10 space-y-10 md:mt-14 md:space-y-14'>
          <ProductInfoTabs key={product.id} product={product} />
          <RelatedProducts product={product} />
        </div>

        {/* Room for the sticky bar below, so it never hides the end of the page on phones. */}
        <div aria-hidden='true' className='h-20 md:hidden' />
      </div>

      {/* Phones: Add to Cart and Buy Now always within reach. The price is already on the page. */}
      <div className='fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-surface/95 px-3 py-2.5 shadow-lg shadow-navy-900/10 backdrop-blur-sm md:hidden'>
        <ProductCartButtons {...cartButtonProps} />
      </div>

      {viewerIndex !== null && images.length > 0 && (
        <ImageZoomViewer images={images} productName={product.name} startIndex={viewerIndex} onClose={closeViewer} />
      )}
    </div>
  )
}

export default ProductDetailsPage