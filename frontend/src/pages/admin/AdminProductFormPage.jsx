import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'react-hot-toast'
import { ArrowLeft, ExternalLink, LoaderCircle, Save } from 'lucide-react'

import { adminApi } from '../../api/adminApi.js'
import { toEditorImage, toImagePayload } from '../../components/admin/adminImageRules.js'
import AdminLoadState from '../../components/admin/AdminLoadState.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import {
  ADMIN_BUTTON_PRIMARY,
  ADMIN_BUTTON_SECONDARY,
  ADMIN_CARD,
  ADMIN_FIELD_ERROR,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_TEXTAREA,
} from '../../components/admin/adminStyles.js'
import ProductImagesEditor from '../../components/admin/ProductImagesEditor.jsx'
import { APP_ROUTES, productDetailsPath } from '../../constants/appRoutepoints.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'

// Mirrors PACK_UNITS in backend/src/modules/product/product.model.js.
const PACK_UNITS = ['g', 'kg', 'ml', 'l', 'piece']
const SKU_PATTERN = /^[A-Za-z0-9._-]+$/

const EMPTY_FORM = {
  name: '',
  sku: '',
  category: '',
  mrp: '',
  price: '',
  packValue: '',
  packUnit: 'g',
  stock: '0',
  description: '',
  ingredients: '',
  allergenInfo: '',
  shelfLife: '',
  nutritionPoints: '',
  taglines: '',
  isActive: true,
  isFeatured: false,
}

// Lists are edited one item per line.
const toLines = (items) => (items ?? []).join('\n')
const fromLines = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

function toForm(product) {
  return {
    name: product.name ?? '',
    sku: product.sku ?? '',
    category: product.category?.id ?? '',
    mrp: String(product.mrp ?? ''),
    price: String(product.price ?? ''),
    packValue: String(product.packSize?.value ?? ''),
    packUnit: product.packSize?.unit ?? 'g',
    stock: String(product.stock ?? 0),
    description: product.description ?? '',
    ingredients: toLines(product.ingredients),
    allergenInfo: product.allergenInfo ?? '',
    shelfLife: product.shelfLife ?? '',
    nutritionPoints: toLines(product.nutritionPoints),
    taglines: toLines(product.taglines),
    isActive: product.isActive ?? true,
    isFeatured: product.isFeatured ?? false,
  }
}

/** Field errors keyed like the form (the API's `packSize.value` becomes `packValue`). */
function validate(form) {
  const errors = {}
  const mrp = Number(form.mrp)
  const price = form.price === '' ? mrp : Number(form.price)
  if (form.name.trim().length < 2) errors.name = 'Enter the product name'
  if (!SKU_PATTERN.test(form.sku.trim()) || form.sku.trim().length < 2) {
    errors.sku = 'Use letters, digits, dot, underscore or hyphen (at least 2)'
  }
  if (!form.category) errors.category = 'Choose a category'
  if (form.mrp === '' || !Number.isFinite(mrp) || mrp < 0) errors.mrp = 'Enter the MRP in rupees'
  if (form.price !== '' && (!Number.isFinite(price) || price < 0)) errors.price = 'Enter the price in rupees'
  else if (!errors.mrp && price > mrp) errors.price = 'The price cannot be more than the MRP'
  if (!(Number(form.packValue) > 0)) errors.packValue = 'Enter the pack size'
  if (!Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) errors.stock = 'Enter a whole number, 0 or more'
  if (fromLines(form.nutritionPoints).length > 8) errors.nutritionPoints = 'At most 8 lines'
  if (fromLines(form.taglines).length > 5) errors.taglines = 'At most 5 lines'
  return errors
}

function toPayload(form) {
  const payload = {
    name: form.name.trim(),
    sku: form.sku.trim(),
    category: form.category,
    mrp: Number(form.mrp),
    packSize: { value: Number(form.packValue), unit: form.packUnit },
    stock: Number(form.stock),
    description: form.description.trim(),
    ingredients: fromLines(form.ingredients),
    allergenInfo: form.allergenInfo.trim(),
    shelfLife: form.shelfLife.trim(),
    nutritionPoints: fromLines(form.nutritionPoints),
    taglines: fromLines(form.taglines),
    isActive: form.isActive,
    isFeatured: form.isFeatured,
  }
  // Left empty, the backend sets the price to the MRP.
  if (form.price !== '') payload.price = Number(form.price)
  return payload
}

const API_FIELD_TO_FORM = { 'packSize.value': 'packValue', 'packSize.unit': 'packUnit' }

function Field({ id, label, hint, error, required, children }) {
  return (
    <div>
      <label htmlFor={id} className={ADMIN_LABEL}>
        {label}
        {required && <span className="text-error"> *</span>}
        {hint && <span className="font-normal text-muted"> {hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className={ADMIN_FIELD_ERROR}>
          {error}
        </p>
      )}
    </div>
  )
}

/** /admin/products/new and /admin/products/:id/edit. */
function AdminProductFormPage() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [images, setImages] = useState([])
  const [product, setProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [status, setStatus] = useState(isNew ? 'ready' : 'loading')
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  useDocumentTitle(isNew ? 'Add product' : `Edit ${product?.name ?? 'product'}`)

  useEffect(() => {
    adminApi.categories
      .list()
      .then(setCategories)
      .catch(() => toast.error('Couldn’t load the categories. Reload the page to try again.'))
  }, [])

  useEffect(() => {
    if (isNew) return undefined
    let isCancelled = false
    adminApi.products
      .get(id)
      .then((loaded) => {
        if (isCancelled) return
        setProduct(loaded)
        setForm(toForm(loaded))
        setImages(loaded.images.map(toEditorImage))
        setStatus('ready')
      })
      .catch((error) => {
        if (!isCancelled) setStatus(error.status === 404 ? 'not-found' : 'error')
      })
    return () => {
      isCancelled = true
    }
  }, [id, isNew])

  function setValue(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current))
  }

  const inputProps = (name) => ({
    id: `product-${name}`,
    value: form[name],
    onChange: (event) => setValue(name, event.target.value),
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `product-${name}-error` : undefined,
  })

  async function handleSubmit(event) {
    event.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.values(found).some(Boolean)) {
      toast.error('Please fix the highlighted fields.')
      return
    }

    const { images: imageOrder, files } = toImagePayload(images)
    const payload = { ...toPayload(form), images: imageOrder }

    setIsSaving(true)
    try {
      if (isNew) {
        const created = await adminApi.products.create(payload, files)
        toast.success(`${created.name} added`)
        navigate(APP_ROUTES.ADMIN_PRODUCTS, { replace: true })
        return
      }
      const updated = await adminApi.products.update(id, payload, files)
      // The saved list replaces the local one, so new photos now carry their stored publicId.
      images.forEach((entry) => entry.previewUrl && URL.revokeObjectURL(entry.previewUrl))
      setProduct(updated)
      setForm(toForm(updated))
      setImages(updated.images.map(toEditorImage))
      toast.success('Product saved')
    } catch (error) {
      const fieldErrors = Object.fromEntries(
        Object.entries(error.fieldErrors ?? {}).map(([field, message]) => [API_FIELD_TO_FORM[field] ?? field, message]),
      )
      setErrors(fieldErrors)
      if (error.code === 'PRICE_ABOVE_MRP') setErrors({ price: error.message })
      toast.error(error.status === 409 ? `${error.message}. Is the SKU or name already used?` : error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const backLink = (
    <Link to={APP_ROUTES.ADMIN_PRODUCTS} className={ADMIN_BUTTON_SECONDARY}>
      <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
      All products
    </Link>
  )

  if (status !== 'ready') {
    return (
      <>
        <AdminPageHeader title="Edit product" actions={backLink} />
        <AdminLoadState status={status} onRetry={() => window.location.reload()} />
      </>
    )
  }

  return (
    <>
      <AdminPageHeader
        title={isNew ? 'Add product' : product.name}
        description={isNew ? 'Fields marked * are required.' : `SKU ${product.sku}`}
        actions={
          <>
            {!isNew && product.isActive && (
              <a href={productDetailsPath(product.slug)} target="_blank" rel="noreferrer" className={ADMIN_BUTTON_SECONDARY}>
                <ExternalLink size={16} strokeWidth={1.75} aria-hidden="true" />
                View in store
              </a>
            )}
            {backLink}
          </>
        }
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <section className={ADMIN_CARD}>
          <h2 className="mb-4 text-lg font-semibold text-navy-800">Basics</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="product-name" label="Name" required error={errors.name}>
              <input {...inputProps('name')} maxLength={120} className={ADMIN_INPUT} />
            </Field>
            <Field id="product-sku" label="SKU" required hint="(unique code)" error={errors.sku}>
              <input {...inputProps('sku')} maxLength={32} className={`${ADMIN_INPUT} uppercase`} />
            </Field>
            <Field id="product-category" label="Category" required error={errors.category}>
              <select {...inputProps('category')} className={ADMIN_INPUT}>
                <option value="">Choose a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                    {category.isActive ? '' : ' (hidden)'}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="product-packValue" label="Pack size" required error={errors.packValue}>
                <input {...inputProps('packValue')} type="number" min="0" step="any" inputMode="decimal" className={ADMIN_INPUT} />
              </Field>
              <Field id="product-packUnit" label="Unit" error={errors.packUnit}>
                <select {...inputProps('packUnit')} className={ADMIN_INPUT}>
                  {PACK_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </section>

        <section className={ADMIN_CARD}>
          <h2 className="mb-4 text-lg font-semibold text-navy-800">Price and stock</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="product-mrp" label="MRP (₹)" required error={errors.mrp}>
              <input {...inputProps('mrp')} type="number" min="0" step="1" inputMode="numeric" className={ADMIN_INPUT} />
            </Field>
            <Field id="product-price" label="Selling price (₹)" hint="(empty = MRP)" error={errors.price}>
              <input {...inputProps('price')} type="number" min="0" step="1" inputMode="numeric" className={ADMIN_INPUT} />
            </Field>
            <Field id="product-stock" label="Stock" error={errors.stock}>
              <input {...inputProps('stock')} type="number" min="0" step="1" inputMode="numeric" className={ADMIN_INPUT} />
            </Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-6">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-navy-800">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setValue('isActive', event.target.checked)}
                className="size-4 accent-navy-800"
              />
              Published (shown in the store)
            </label>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-navy-800">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(event) => setValue('isFeatured', event.target.checked)}
                className="size-4 accent-navy-800"
              />
              Featured (best sellers on the home page)
            </label>
          </div>
        </section>

        <section className={ADMIN_CARD}>
          <h2 className="mb-4 text-lg font-semibold text-navy-800">Photos</h2>
          <ProductImagesEditor entries={images} onChange={setImages} />
        </section>

        <section className={ADMIN_CARD}>
          <h2 className="mb-4 text-lg font-semibold text-navy-800">Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field id="product-description" label="Description" error={errors.description}>
                <textarea {...inputProps('description')} rows={4} maxLength={2000} className={ADMIN_TEXTAREA} />
              </Field>
            </div>
            <Field id="product-ingredients" label="Ingredients" hint="(one per line)" error={errors.ingredients}>
              <textarea {...inputProps('ingredients')} rows={5} className={ADMIN_TEXTAREA} />
            </Field>
            <Field id="product-nutritionPoints" label="Nutrition" hint="(one per line, up to 8, e.g. Energy: 438 kcal)" error={errors.nutritionPoints}>
              <textarea {...inputProps('nutritionPoints')} rows={5} className={ADMIN_TEXTAREA} />
            </Field>
            <Field id="product-taglines" label="Taglines" hint="(one per line, up to 5)" error={errors.taglines}>
              <textarea {...inputProps('taglines')} rows={3} className={ADMIN_TEXTAREA} />
            </Field>
            <div className="space-y-4">
              <Field id="product-allergenInfo" label="Allergen information" error={errors.allergenInfo}>
                <input {...inputProps('allergenInfo')} maxLength={500} className={ADMIN_INPUT} />
              </Field>
              <Field id="product-shelfLife" label="Shelf life" hint="(e.g. 6 months from packaging)" error={errors.shelfLife}>
                <input {...inputProps('shelfLife')} maxLength={100} className={ADMIN_INPUT} />
              </Field>
            </div>
          </div>
        </section>

        <div className="sticky bottom-0 -mx-3 flex justify-end gap-2 border-t border-line bg-surface/95 px-3 py-3 sm:mx-0 sm:rounded-2xl sm:border">
          <Link to={APP_ROUTES.ADMIN_PRODUCTS} className={ADMIN_BUTTON_SECONDARY}>
            Cancel
          </Link>
          <button type="submit" disabled={isSaving} className={ADMIN_BUTTON_PRIMARY}>
            {isSaving ? (
              <LoaderCircle size={16} strokeWidth={1.75} aria-hidden="true" className="animate-spin" />
            ) : (
              <Save size={16} strokeWidth={1.75} aria-hidden="true" />
            )}
            {isSaving ? 'Saving…' : isNew ? 'Add product' : 'Save changes'}
          </button>
        </div>
      </form>
    </>
  )
}

export default AdminProductFormPage