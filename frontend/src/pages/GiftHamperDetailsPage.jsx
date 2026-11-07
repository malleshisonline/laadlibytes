import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Building2, CalendarClock, Gift, PackageSearch, RotateCw, Scale, ShoppingCart } from 'lucide-react'

import GiftHamperTerms from '../components/giftHamper/GiftHamperTerms.jsx'
import HamperFlavours from '../components/giftHamper/HamperFlavours.jsx'
import { hamperAccentClasses } from '../components/giftHamper/hamperAccent.js'
import DeliveryDateCheck from '../components/product/DeliveryDateCheck.jsx'
import ImageZoomViewer from '../components/product/details/ImageZoomViewer.jsx'
import ProductImageGallery from '../components/product/details/ProductImageGallery.jsx'
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx'
import QuantityStepper from '../components/ui/QuantityStepper.jsx'
import { APP_ROUTES } from '../constants/appRoutepoints.js'
import { APP_SETTINGS } from '../constants/appSettings.js'
import { useCart } from '../hooks/useCart.js'
import { useGiftHamper } from '../hooks/useGiftHampers.js'
import { formatPrice } from '../utils/productFormatters.js'

const PAGE_CLASSES = 'px-3 py-5 sm:px-4 md:py-8 lg:px-6 xl:px-16 2xl:px-24'

const PRIMARY_BUTTON_CLASSES =
  'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy-800 px-6 text-sm font-bold text-white shadow-md transition hover:bg-navy-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 disabled:cursor-not-allowed disabled:opacity-60'

const GO_TO_CART_CLASSES =
  'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-leaf-600 px-6 text-sm font-bold text-white shadow-md transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600'

/** Bulk and custom orders go to the enquiry form on the Gift Store page, with this hamper chosen. */
const bulkEnquiryPath = (hamperId) => `${APP_ROUTES.GIFT_STORE}?${new URLSearchParams({ hamper: hamperId })}#bulk-enquiry`

function DetailsSkeleton() {
  return (
    <div aria-hidden='true' className='grid gap-6 md:grid-cols-2 lg:gap-10'>
      <div className='aspect-square animate-pulse rounded-2xl bg-cream-100' />
      <div className='space-y-3'>
        <div className='h-8 w-3/4 animate-pulse rounded bg-cream-100' />
        <div className='h-4 w-1/2 animate-pulse rounded bg-cream-100' />
        <div className='h-10 w-1/3 animate-pulse rounded bg-cream-100' />
        <div className='h-32 animate-pulse rounded-xl bg-cream-100' />
      </div>
    </div>
  )
}

function SectionTitle({ children, id }) {
  return (
    <h2 id={id} className='text-center text-2xl font-semibold text-navy-800 md:text-3xl'>
      {children}
    </h2>
  )
}

/** One fact under the price: an icon and a short text. */
function HamperFact({ icon: Icon, children }) {
  return (
    <li className='flex items-center gap-2 text-sm text-body'>
      <Icon size={18} strokeWidth={1.75} aria-hidden='true' className='shrink-0 text-caramel-700' />
      {children}
    </li>
  )
}

/**
 * One gift hamper, opened from the Gift Store: photos, price, what is inside (each flavour with its own photo),
 * lead time, the number of boxes and Add to Cart. Bulk and custom orders go to the enquiry form instead.
 */
function GiftHamperDetailsPage() {
  const { slug } = useParams()
  const { hamper, status, retry } = useGiftHamper(slug)
  const { addHamperToCart, isInCart, isPending } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [viewerIndex, setViewerIndex] = useState(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [slug])

  useEffect(() => {
    if (!hamper?.name) return undefined
    const previousTitle = document.title
    document.title = hamper.seo?.title || `${hamper.name} | ${APP_SETTINGS.SITE_NAME}`
    return () => {
      document.title = previousTitle
    }
  }, [hamper?.name, hamper?.seo?.title])

  const closeViewer = useCallback(() => setViewerIndex(null), [])

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
      <div className={`${PAGE_CLASSES} mx-auto max-w-md py-12 text-center`}>
        <h1 className='text-2xl font-semibold text-navy-800'>Gift hamper not found</h1>
        <p className='mt-2 text-body'>This hamper may no longer be available. Have a look at our other gift hampers.</p>
        <Link
          to={APP_ROUTES.GIFT_STORE}
          className='mt-6 inline-flex min-h-11 items-center rounded-lg bg-navy-800 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-navy-700'
        >
          Back to the Gift Store
        </Link>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={`${PAGE_CLASSES} text-center`}>
        <PackageSearch size={40} strokeWidth={1.5} aria-hidden='true' className='mx-auto mt-10 text-caramel-500' />
        <p className='mt-3 text-body'>We couldn’t load this gift hamper right now.</p>
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

  const accent = hamperAccentClasses(hamper.accentColor)
  const images = hamper.images ?? []
  const safeQuantity = Math.max(1, Math.min(quantity, hamper.maxQtyPerOrder))
  const inCart = isInCart(hamper.id)

  return (
    <div className='bg-linear-to-b from-cream-50 via-surface to-surface'>
      <div className={PAGE_CLASSES}>
        <Breadcrumbs
          className='mb-4 md:mb-6'
          items={[
            { label: 'Home', to: APP_ROUTES.HOME },
            { label: 'Gift Store', to: APP_ROUTES.GIFT_STORE },
            { label: hamper.name },
          ]}
        />

        <div className='grid gap-6 md:grid-cols-2 lg:gap-10'>
          <div className='min-w-0'>
            {images.length ? (
              <ProductImageGallery
                key={hamper.id}
                images={images}
                productName={hamper.name}
                onOpenViewer={setViewerIndex}
              />
            ) : (
              <div className='grid aspect-square place-items-center rounded-2xl bg-cream-100'>
                <Gift size={64} strokeWidth={1.25} aria-hidden='true' className={accent.text} />
              </div>
            )}
          </div>

          <div>
            <p
              className={`inline-flex items-center gap-1.5 rounded-full bg-cream-100 px-3 py-1 text-xs font-bold ${accent.text}`}
            >
              <Gift size={14} strokeWidth={2} aria-hidden='true' />
              Festive gift hamper
            </p>
            <h1 className='mt-3 text-3xl font-semibold text-navy-800 md:text-4xl'>{hamper.name}</h1>
            {hamper.headline && <p className={`mt-2 text-base font-semibold ${accent.text}`}>{hamper.headline}</p>}
            {(hamper.description || hamper.shortDescription) && (
              <p className='mt-3 max-w-prose leading-7 text-body'>{hamper.description || hamper.shortDescription}</p>
            )}

            <div className='mt-5 rounded-2xl border border-cream-200 bg-surface p-4 shadow-md shadow-navy-900/5 sm:p-5'>
              <p className='text-3xl font-extrabold text-navy-800'>{formatPrice(hamper.price)}</p>
              <p className='text-xs text-muted'>MRP per box, GST included</p>

              <ul className='mt-4 space-y-2'>
                <HamperFact icon={Scale}>
                  {hamper.piecesPerBox} pieces · {hamper.netWeightGrams} g net weight
                </HamperFact>
                {hamper.leadTimeDays > 0 && (
                  <HamperFact icon={CalendarClock}>
                    Made to order: dispatched in about {hamper.leadTimeDays} days after payment
                  </HamperFact>
                )}
                {hamper.greetingCardLabel && (
                  <HamperFact icon={Gift}>Comes with a {hamper.greetingCardLabel}; add your message at checkout</HamperFact>
                )}
              </ul>

              <DeliveryDateCheck leadTimeDays={hamper.leadTimeDays} className='mt-4' />

              <div className='mt-5 flex flex-col gap-3 sm:flex-row sm:items-center'>
                {!inCart && (
                  <QuantityStepper
                    value={safeQuantity}
                    min={1}
                    max={hamper.maxQtyPerOrder}
                    onChange={setQuantity}
                    label={`Number of ${hamper.name} boxes`}
                  />
                )}
                {inCart ? (
                  <Link to={APP_ROUTES.CART} className={GO_TO_CART_CLASSES}>
                    <ShoppingCart size={18} strokeWidth={2} aria-hidden='true' />
                    Go to Cart
                  </Link>
                ) : (
                  <button
                    type='button'
                    onClick={() => addHamperToCart(hamper, safeQuantity)}
                    disabled={isPending(hamper.id)}
                    className={PRIMARY_BUTTON_CLASSES}
                  >
                    <ShoppingCart size={18} strokeWidth={2} aria-hidden='true' />
                    Add to Cart
                  </button>
                )}
              </div>
              <p className='mt-3 text-xs text-muted'>
                Up to {hamper.maxQtyPerOrder} boxes per online order. Gift hampers can’t be returned.
              </p>

              <Link
                to={bulkEnquiryPath(hamper.id)}
                className='mt-4 flex items-center gap-2 rounded-xl bg-lightblue-50 px-3 py-2.5 text-sm font-semibold text-navy-700 transition hover:bg-lightblue-100'
              >
                <Building2 size={18} strokeWidth={1.75} aria-hidden='true' className='shrink-0' />
                Ordering for a team or need a custom hamper? Request a bulk quote
              </Link>
            </div>
          </div>
        </div>

        <section aria-labelledby='hamper-flavours-heading' className='mt-12 md:mt-16'>
          <SectionTitle id='hamper-flavours-heading'>What’s inside</SectionTitle>
          <p className='mx-auto mt-2 max-w-prose text-center text-sm text-muted'>
            {hamper.flavours.length} flavours, packed by our team. Tap a flavour to see that chikki.
          </p>
          <div className='mt-6'>
            <HamperFlavours hamper={hamper} />
          </div>
        </section>

        <section aria-labelledby='hamper-terms-heading' className='mt-12 md:mt-16'>
          <SectionTitle id='hamper-terms-heading'>Gifting terms</SectionTitle>
          <div className='mt-6'>
            <GiftHamperTerms />
          </div>
        </section>
      </div>

      {viewerIndex !== null && (
        <ImageZoomViewer images={images} productName={hamper.name} startIndex={viewerIndex} onClose={closeViewer} />
      )}
    </div>
  )
}

export default GiftHamperDetailsPage