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
import { APP_ROUTES, giftHamperDetailsPath } from '../../constants/appRoutepoints.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'

// Mirrors HAMPER_ACCENT_COLORS in backend/src/modules/giftHamper/giftHamper.model.js (theme tokens, not colours).
const ACCENT_COLORS = ['caramel', 'cocoa', 'leaf', 'peacock', 'navy']
const CODE_PATTERN = /^[A-Za-z0-9-]+$/
const SLUG_PATTERN = /^[a-z0-9-]+$/
const MAX_FLAVOURS = 60

// The new-hamper defaults match the backend's, so an untouched field saves what it would have anyway.
const EMPTY_FORM = {
  name: '',
  code: '',
  slug: '',
  headline: '',
  shortDescription: '',
  description: '',
  price: '',
  netWeightGrams: '180',
  piecesPerBox: '12',
  leadTimeDays: '14',
  maxQtyPerOrder: '50',
  greetingCardLabel: '',
  accentColor: '',
  flavours: '',
  seoTitle: '',
  seoDescription: '',
  isActive: true,
}

// Flavours are edited one per line.
const toLines = (items) => (items ?? []).join('\n')
const fromLines = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const toNumberText = (value) => (value === undefined || value === null ? '' : String(value))

function toForm(hamper) {
  return {
    name: hamper.name ?? '',
    code: hamper.code ?? '',
    slug: hamper.slug ?? '',
    headline: hamper.headline ?? '',
    shortDescription: hamper.shortDescription ?? '',
    description: hamper.description ?? '',
    price: toNumberText(hamper.price),
    netWeightGrams: toNumberText(hamper.netWeightGrams),
    piecesPerBox: toNumberText(hamper.piecesPerBox),
    leadTimeDays: toNumberText(hamper.leadTimeDays),
    maxQtyPerOrder: toNumberText(hamper.maxQtyPerOrder),
    greetingCardLabel: hamper.greetingCardLabel ?? '',
    accentColor: hamper.accentColor ?? '',
    flavours: toLines(hamper.flavours),
    seoTitle: hamper.seo?.title ?? '',
    seoDescription: hamper.seo?.description ?? '',
    isActive: hamper.isActive ?? true,
  }
}

const isWholeNumber = (text, min) => text !== '' && Number.isInteger(Number(text)) && Number(text) >= min

/** Field errors keyed like the form; the rules mirror giftHamper.validation.js. */
function validate(form) {
  const errors = {}
  const flavours = fromLines(form.flavours)
  if (form.name.trim().length < 2) errors.name = 'Enter the hamper name'
  if (!CODE_PATTERN.test(form.code.trim())) errors.code = 'Use letters, digits or hyphens (up to 12), e.g. FK'
  if (form.slug.trim() && (form.slug.trim().length < 2 || !SLUG_PATTERN.test(form.slug.trim()))) {
    errors.slug = 'Use lowercase letters, digits and hyphens'
  }
  if (!isWholeNumber(form.price, 1)) errors.price = 'Enter the price in whole rupees'
  if (form.netWeightGrams !== '' && !isWholeNumber(form.netWeightGrams, 1)) errors.netWeightGrams = 'Enter a whole number of grams'
  if (form.piecesPerBox !== '' && !isWholeNumber(form.piecesPerBox, 1)) errors.piecesPerBox = 'Enter a whole number, 1 or more'
  if (form.leadTimeDays !== '' && !isWholeNumber(form.leadTimeDays, 0)) errors.leadTimeDays = 'Enter a whole number of days'
  if (form.maxQtyPerOrder !== '' && (!isWholeNumber(form.maxQtyPerOrder, 1) || Number(form.maxQtyPerOrder) > 1000)) {
    errors.maxQtyPerOrder = 'Enter a whole number from 1 to 1000'
  }
  if (!flavours.length) errors.flavours = 'Add at least one flavour'
  else if (flavours.length > MAX_FLAVOURS) errors.flavours = `At most ${MAX_FLAVOURS} flavours`
  else if (flavours.some((name) => name.length > 80)) errors.flavours = 'Each flavour name can be at most 80 characters'
  return errors
}

function toPayload(form) {
  const optionalNumber = (text) => (text === '' ? undefined : Number(text))
  const payload = {
    name: form.name.trim(),
    code: form.code.trim().toUpperCase(),
    headline: form.headline.trim(),
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    netWeightGrams: optionalNumber(form.netWeightGrams),
    piecesPerBox: optionalNumber(form.piecesPerBox),
    leadTimeDays: optionalNumber(form.leadTimeDays),
    maxQtyPerOrder: optionalNumber(form.maxQtyPerOrder),
    greetingCardLabel: form.greetingCardLabel.trim(),
    accentColor: form.accentColor || null,
    flavours: fromLines(form.flavours),
    seo: { title: form.seoTitle.trim(), description: form.seoDescription.trim() },
    isActive: form.isActive,
  }
  // Left empty on a new hamper, the backend makes the slug from the name; an edit keeps the stored one.
  if (form.slug.trim()) payload.slug = form.slug.trim()
  return payload
}

const API_FIELD_TO_FORM = { 'seo.title': 'seoTitle', 'seo.description': 'seoDescription' }

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

/** /admin/gift-hampers/new and /admin/gift-hampers/:id/edit. Display order is set on the list page. */
function AdminGiftHamperFormPage() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [images, setImages] = useState([])
  const [hamper, setHamper] = useState(null)
  const [status, setStatus] = useState(isNew ? 'ready' : 'loading')
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  useDocumentTitle(isNew ? 'Add gift hamper' : `Edit ${hamper?.name ?? 'gift hamper'}`)

  useEffect(() => {
    if (isNew) return undefined
    let isCancelled = false
    adminApi.giftHampers
      .get(id)
      .then((loaded) => {
        if (isCancelled) return
        setHamper(loaded)
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
    id: `hamper-${name}`,
    value: form[name],
    onChange: (event) => setValue(name, event.target.value),
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `hamper-${name}-error` : undefined,
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
        const created = await adminApi.giftHampers.create(payload, files)
        toast.success(`${created.name} added`)
        navigate(APP_ROUTES.ADMIN_GIFT_HAMPERS, { replace: true })
        return
      }
      const updated = await adminApi.giftHampers.update(id, payload, files)
      // The saved list replaces the local one, so new photos now carry their stored publicId.
      images.forEach((entry) => entry.previewUrl && URL.revokeObjectURL(entry.previewUrl))
      setHamper(updated)
      setForm(toForm(updated))
      setImages(updated.images.map(toEditorImage))
      toast.success('Gift hamper saved')
    } catch (error) {
      setErrors(
        Object.fromEntries(
          Object.entries(error.fieldErrors ?? {}).map(([field, message]) => [API_FIELD_TO_FORM[field] ?? field, message]),
        ),
      )
      toast.error(error.status === 409 ? `${error.message}. Is the code or slug already used?` : error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const backLink = (
    <Link to={APP_ROUTES.ADMIN_GIFT_HAMPERS} className={ADMIN_BUTTON_SECONDARY}>
      <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
      All hampers
    </Link>
  )

  if (status !== 'ready') {
    return (
      <>
        <AdminPageHeader title="Edit gift hamper" actions={backLink} />
        <AdminLoadState status={status} onRetry={() => window.location.reload()} />
      </>
    )
  }

  return (
    <>
      <AdminPageHeader
        title={isNew ? 'Add gift hamper' : hamper.name}
        description={isNew ? 'Fields marked * are required.' : `Code ${hamper.code}`}
        actions={
          <>
            {!isNew && hamper.isActive && (
              <a href={giftHamperDetailsPath(hamper.slug)} target="_blank" rel="noreferrer" className={ADMIN_BUTTON_SECONDARY}>
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
            <Field id="hamper-name" label="Name" required error={errors.name}>
              <input {...inputProps('name')} maxLength={120} className={ADMIN_INPUT} />
            </Field>
            <Field id="hamper-code" label="Code" required hint="(short and unique, e.g. FK)" error={errors.code}>
              <input {...inputProps('code')} maxLength={12} className={`${ADMIN_INPUT} uppercase`} />
            </Field>
            <Field
              id="hamper-slug"
              label="Web address"
              hint={isNew ? '(empty = made from the name)' : '(changing it breaks old links)'}
              error={errors.slug}
            >
              <input {...inputProps('slug')} maxLength={140} className={ADMIN_INPUT} />
            </Field>
            <Field id="hamper-accentColor" label="Accent colour" error={errors.accentColor}>
              <select {...inputProps('accentColor')} className={`${ADMIN_INPUT} capitalize`}>
                <option value="">Default</option>
                {ACCENT_COLORS.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field id="hamper-headline" label="Headline" hint="(one line under the name)" error={errors.headline}>
                <input {...inputProps('headline')} maxLength={160} className={ADMIN_INPUT} />
              </Field>
            </div>
          </div>
        </section>

        <section className={ADMIN_CARD}>
          <h2 className="mb-4 text-lg font-semibold text-navy-800">Price and box</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Field id="hamper-price" label="Price (₹)" required hint="(GST incl.)" error={errors.price}>
              <input {...inputProps('price')} type="number" min="1" step="1" inputMode="numeric" className={ADMIN_INPUT} />
            </Field>
            <Field id="hamper-netWeightGrams" label="Net weight (g)" error={errors.netWeightGrams}>
              <input {...inputProps('netWeightGrams')} type="number" min="1" step="1" inputMode="numeric" className={ADMIN_INPUT} />
            </Field>
            <Field id="hamper-piecesPerBox" label="Pieces per box" error={errors.piecesPerBox}>
              <input {...inputProps('piecesPerBox')} type="number" min="1" step="1" inputMode="numeric" className={ADMIN_INPUT} />
            </Field>
            <Field id="hamper-leadTimeDays" label="Lead time (days)" error={errors.leadTimeDays}>
              <input {...inputProps('leadTimeDays')} type="number" min="0" step="1" inputMode="numeric" className={ADMIN_INPUT} />
            </Field>
            <Field id="hamper-maxQtyPerOrder" label="Max boxes per order" error={errors.maxQtyPerOrder}>
              <input
                {...inputProps('maxQtyPerOrder')}
                type="number"
                min="1"
                max="1000"
                step="1"
                inputMode="numeric"
                className={ADMIN_INPUT}
              />
            </Field>
          </div>
          <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-navy-800">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setValue('isActive', event.target.checked)}
              className="size-4 accent-navy-800"
            />
            Published (shown in the Gift Store)
          </label>
        </section>

        <section className={ADMIN_CARD}>
          <h2 className="mb-4 text-lg font-semibold text-navy-800">Photos</h2>
          <ProductImagesEditor entries={images} onChange={setImages} />
        </section>

        <section className={ADMIN_CARD}>
          <h2 className="mb-4 text-lg font-semibold text-navy-800">What’s inside</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              id="hamper-flavours"
              label="Flavours"
              required
              hint="(one per line; a name that matches a product shows its photo)"
              error={errors.flavours}
            >
              <textarea {...inputProps('flavours')} rows={10} className={ADMIN_TEXTAREA} />
            </Field>
            <div className="space-y-4">
              <Field id="hamper-shortDescription" label="Short description" hint="(shown on the card)" error={errors.shortDescription}>
                <textarea {...inputProps('shortDescription')} rows={3} maxLength={300} className={ADMIN_TEXTAREA} />
              </Field>
              <Field id="hamper-greetingCardLabel" label="Greeting card" hint="(e.g. Happy Diwali greeting card)" error={errors.greetingCardLabel}>
                <input {...inputProps('greetingCardLabel')} maxLength={80} className={ADMIN_INPUT} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field id="hamper-description" label="Description" error={errors.description}>
                <textarea {...inputProps('description')} rows={4} maxLength={2000} className={ADMIN_TEXTAREA} />
              </Field>
            </div>
          </div>
        </section>

        <section className={ADMIN_CARD}>
          <h2 className="mb-4 text-lg font-semibold text-navy-800">Search engines</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="hamper-seoTitle" label="Page title" hint="(up to 70 characters)" error={errors.seoTitle}>
              <input {...inputProps('seoTitle')} maxLength={70} className={ADMIN_INPUT} />
            </Field>
            <Field id="hamper-seoDescription" label="Page description" hint="(up to 160 characters)" error={errors.seoDescription}>
              <textarea {...inputProps('seoDescription')} rows={2} maxLength={160} className={ADMIN_TEXTAREA} />
            </Field>
          </div>
        </section>

        <div className="sticky bottom-0 -mx-3 flex justify-end gap-2 border-t border-line bg-surface/95 px-3 py-3 sm:mx-0 sm:rounded-2xl sm:border">
          <Link to={APP_ROUTES.ADMIN_GIFT_HAMPERS} className={ADMIN_BUTTON_SECONDARY}>
            Cancel
          </Link>
          <button type="submit" disabled={isSaving} className={ADMIN_BUTTON_PRIMARY}>
            {isSaving ? (
              <LoaderCircle size={16} strokeWidth={1.75} aria-hidden="true" className="animate-spin" />
            ) : (
              <Save size={16} strokeWidth={1.75} aria-hidden="true" />
            )}
            {isSaving ? 'Saving…' : isNew ? 'Add hamper' : 'Save changes'}
          </button>
        </div>
      </form>
    </>
  )
}

export default AdminGiftHamperFormPage