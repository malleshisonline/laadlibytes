import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'react-hot-toast'
import { Check, Pencil, Plus } from 'lucide-react'

import { adminApi } from '../../api/adminApi.js'
import AdminLoadState from '../../components/admin/AdminLoadState.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import {
  ADMIN_BADGE,
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_CARD,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_TABLE,
  ADMIN_TD,
  ADMIN_TH,
} from '../../components/admin/adminStyles.js'
import { adminProductEditPath, APP_ROUTES } from '../../constants/appRoutepoints.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'
import { formatPackSize, formatPrice } from '../../utils/productFormatters.js'

// Matches DEFAULT_LOW_STOCK_THRESHOLD in backend/src/modules/admin/admin.service.js (the dashboard's "Low stock").
const LOW_STOCK_THRESHOLD = 10
// The API's largest page. The catalogue is 56 products, so one or two requests load it all.
const PAGE_SIZE = 100
const THUMBNAIL_SIZE = 44

/**
 * Every product, published or not. Filtering happens in the browser: with a catalogue this size that is
 * instant, and it allows filters (low stock) the API has no parameter for.
 */
function useAllProducts() {
  const [products, setProducts] = useState([])
  const [status, setStatus] = useState('loading')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isCancelled = false
    async function loadAll() {
      const all = []
      for (let page = 1; ; page++) {
        const { data, meta } = await adminApi.products.list({ page, limit: PAGE_SIZE, sort: 'name_asc' })
        all.push(...data)
        if (!meta?.hasNextPage) return all
      }
    }
    loadAll()
      .then((all) => {
        if (isCancelled) return
        setProducts(all)
        setStatus('ready')
      })
      .catch(() => {
        if (!isCancelled) setStatus('error')
      })
    return () => {
      isCancelled = true
    }
  }, [reloadKey])

  const reload = useCallback(() => {
    setStatus('loading')
    setReloadKey((key) => key + 1)
  }, [])

  const replaceProduct = useCallback((updated) => {
    setProducts((current) => current.map((product) => (product.id === updated.id ? { ...product, ...updated } : product)))
  }, [])

  return { products, status, reload, replaceProduct }
}

function useCategoryOptions() {
  const [categories, setCategories] = useState([])
  useEffect(() => {
    adminApi.categories
      .list()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])
  return categories
}

function matchesFilters(product, { search, category, visibility, stock }) {
  if (search) {
    const term = search.toLowerCase()
    if (!product.name.toLowerCase().includes(term) && !product.sku.toLowerCase().includes(term)) return false
  }
  if (category && product.category?.id !== category) return false
  if (visibility === 'published' && !product.isActive) return false
  if (visibility === 'unpublished' && product.isActive) return false
  // Out of stock and low stock count published products only, like the dashboard.
  if (stock === 'out' && !(product.isActive && product.stock === 0)) return false
  if (stock === 'low' && !(product.isActive && product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD)) return false
  return true
}

/** A number box that saves the new stock with Enter or the tick button. */
function StockEditor({ product, onSave }) {
  const [value, setValue] = useState(String(product.stock))
  const [isSaving, setIsSaving] = useState(false)
  const parsed = Number(value)
  const isValid = value !== '' && Number.isInteger(parsed) && parsed >= 0
  const isChanged = isValid && parsed !== product.stock

  async function save(event) {
    event.preventDefault()
    if (!isChanged || isSaving) return
    setIsSaving(true)
    await onSave(parsed)
    setIsSaving(false)
  }

  let stockTone = 'text-body'
  if (product.stock === 0) stockTone = 'text-error'
  else if (product.stock <= LOW_STOCK_THRESHOLD) stockTone = 'text-warning'

  return (
    <form onSubmit={save} className="flex items-center gap-1">
      <label htmlFor={`stock-${product.id}`} className="sr-only">
        Stock for {product.name}
      </label>
      <input
        id={`stock-${product.id}`}
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={`${ADMIN_INPUT} w-20 font-semibold ${stockTone}`}
      />
      <button
        type="submit"
        disabled={!isChanged || isSaving}
        aria-label={`Save stock for ${product.name}`}
        className={`${ADMIN_BUTTON_SECONDARY} px-2 ${isChanged ? '' : 'invisible'}`}
      >
        <Check size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </form>
  )
}

/** /admin/products: the whole catalogue with quick stock edits and the publish switch. */
function AdminProductsPage() {
  useDocumentTitle('Products')
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = {
    search: searchParams.get('search') ?? '',
    category: searchParams.get('category') ?? '',
    visibility: searchParams.get('visibility') ?? '',
    stock: searchParams.get('stock') ?? '',
  }
  const { products, status, reload, replaceProduct } = useAllProducts()
  const categories = useCategoryOptions()
  const [busyIds, setBusyIds] = useState(() => new Set())

  // 56 rows: filtering on every render is cheaper than keeping a memo in sync with four filters.
  const filtered = products.filter((product) => matchesFilters(product, filters))

  function setFilter(name, value) {
    const next = { ...filters, [name]: value }
    setSearchParams(Object.fromEntries(Object.entries(next).filter(([, filterValue]) => filterValue)), { replace: true })
  }

  /** Saves one change; resolves true on success. */
  async function updateProduct(product, changes, successMessage) {
    setBusyIds((current) => new Set(current).add(product.id))
    try {
      replaceProduct(await adminApi.products.update(product.id, changes))
      toast.success(successMessage)
      return true
    } catch (error) {
      toast.error(error.message || 'Couldn’t save. Please try again.')
      return false
    } finally {
      setBusyIds((current) => {
        const next = new Set(current)
        next.delete(product.id)
        return next
      })
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Products"
        description="Update stock, publish or hide products, and edit their details and photos."
        actions={
          <Link to={APP_ROUTES.ADMIN_PRODUCT_NEW} className={ADMIN_BUTTON_PRIMARY}>
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Add product
          </Link>
        }
      />

      <div className={`${ADMIN_CARD} mb-4`}>
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label htmlFor="product-search" className={ADMIN_LABEL}>
              Search
            </label>
            <input
              id="product-search"
              type="search"
              value={filters.search}
              onChange={(event) => setFilter('search', event.target.value)}
              placeholder="Name or SKU"
              className={ADMIN_INPUT}
            />
          </div>
          <div className="md:col-span-3">
            <label htmlFor="product-category" className={ADMIN_LABEL}>
              Category
            </label>
            <select
              id="product-category"
              value={filters.category}
              onChange={(event) => setFilter('category', event.target.value)}
              className={ADMIN_INPUT}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="product-visibility" className={ADMIN_LABEL}>
              Shown in store
            </label>
            <select
              id="product-visibility"
              value={filters.visibility}
              onChange={(event) => setFilter('visibility', event.target.value)}
              className={ADMIN_INPUT}
            >
              <option value="">All</option>
              <option value="published">Published</option>
              <option value="unpublished">Hidden</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label htmlFor="product-stock" className={ADMIN_LABEL}>
              Stock
            </label>
            <select
              id="product-stock"
              value={filters.stock}
              onChange={(event) => setFilter('stock', event.target.value)}
              className={ADMIN_INPUT}
            >
              <option value="">Any stock</option>
              <option value="low">Low ({LOW_STOCK_THRESHOLD} or fewer)</option>
              <option value="out">Out of stock</option>
            </select>
          </div>
        </div>
      </div>

      <div className={ADMIN_CARD}>
        <AdminLoadState
          status={status}
          isEmpty={!filtered.length}
          emptyText={products.length ? 'No products match these filters.' : 'No products yet.'}
          onRetry={reload}
        />
        {status === 'ready' && filtered.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className={ADMIN_TABLE}>
                <thead>
                  <tr>
                    <th className={ADMIN_TH}>Product</th>
                    <th className={ADMIN_TH}>Category</th>
                    <th className={ADMIN_TH}>Price</th>
                    <th className={ADMIN_TH}>Stock</th>
                    <th className={ADMIN_TH}>In store</th>
                    <th className={ADMIN_TH}>
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => {
                    const image = product.images?.[0]
                    const isBusy = busyIds.has(product.id)
                    return (
                      <tr key={product.id} className={product.isActive ? '' : 'bg-cream-50'}>
                        <td className={ADMIN_TD}>
                          <div className="flex items-center gap-3">
                            <span className="size-11 shrink-0 overflow-hidden rounded-lg bg-cream-100 p-0.5">
                              {image && (
                                <img
                                  src={cloudinaryImageUrl(image.url, THUMBNAIL_SIZE * 2, THUMBNAIL_SIZE * 2, { crop: 'limit' })}
                                  alt=""
                                  width={THUMBNAIL_SIZE}
                                  height={THUMBNAIL_SIZE}
                                  loading="lazy"
                                  decoding="async"
                                  className="size-full object-contain"
                                />
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block font-semibold text-navy-800">{product.name}</span>
                              <span className="block text-xs text-muted">
                                {product.sku}
                                {formatPackSize(product.packSize) ? ` · ${formatPackSize(product.packSize)}` : ''}
                                {product.isFeatured ? ' · Featured' : ''}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className={ADMIN_TD}>{product.category?.name ?? '—'}</td>
                        <td className={ADMIN_TD}>
                          <span className="font-semibold text-navy-800">{formatPrice(product.price)}</span>
                          {product.mrp > product.price && (
                            <span className="block text-xs text-muted line-through">{formatPrice(product.mrp)}</span>
                          )}
                        </td>
                        <td className={ADMIN_TD}>
                          <StockEditor
                            key={product.stock}
                            product={product}
                            onSave={(stock) => updateProduct(product, { stock }, `Stock for ${product.name} is now ${stock}`)}
                          />
                        </td>
                        <td className={ADMIN_TD}>
                          <label className="inline-flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              role="switch"
                              checked={product.isActive}
                              disabled={isBusy}
                              onChange={() =>
                                updateProduct(
                                  product,
                                  { isActive: !product.isActive },
                                  product.isActive ? `${product.name} is hidden from the store` : `${product.name} is published`,
                                )
                              }
                              className="size-4 accent-navy-800"
                            />
                            <span className={`${ADMIN_BADGE} ${product.isActive ? 'bg-leaf-600/10 text-success' : 'bg-cream-100 text-muted'}`}>
                              {product.isActive ? 'Published' : 'Hidden'}
                            </span>
                          </label>
                        </td>
                        <td className={`${ADMIN_TD} text-right`}>
                          <Link to={adminProductEditPath(product.id)} className={ADMIN_BUTTON_SECONDARY}>
                            <Pencil size={14} strokeWidth={1.75} aria-hidden="true" />
                            Edit
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted">
              Showing {filtered.length} of {products.length} products
            </p>
          </>
        )}
      </div>
    </>
  )
}

export default AdminProductsPage