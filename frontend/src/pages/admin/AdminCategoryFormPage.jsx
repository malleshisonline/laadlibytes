import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'react-hot-toast'
import { ArrowLeft, ImagePlus, LoaderCircle, Save, Trash2 } from 'lucide-react'

import { adminApi } from '../../api/adminApi.js'
import { ALLOWED_IMAGE_FORMATS_LABEL, IMAGE_ACCEPT_ATTRIBUTE, imageFileProblem } from '../../components/admin/adminImageRules.js'
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
import { APP_ROUTES } from '../../constants/appRoutepoints.js'
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js'
import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'

const PREVIEW_SIZE = 120
const EMPTY_FORM = { name: '', description: '', displayOrder: '0', isActive: true, imageAlt: '' }

function toForm(category) {
  return {
    name: category.name ?? '',
    description: category.description ?? '',
    displayOrder: String(category.displayOrder ?? 0),
    isActive: category.isActive ?? true,
    imageAlt: category.image?.alt ?? '',
  }
}

/** /admin/categories/new and /admin/categories/:id/edit. One image; a new file replaces the stored one. */
function AdminCategoryFormPage() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [category, setCategory] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  // The picked file and its local preview, or `removeImage` to drop the stored one on save.
  const [newImage, setNewImage] = useState(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [status, setStatus] = useState(isNew ? 'ready' : 'loading')
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  useDocumentTitle(isNew ? 'Add category' : `Edit ${category?.name ?? 'category'}`)

  useEffect(() => {
    if (isNew) return undefined
    let isCancelled = false
    adminApi.categories
      .get(id)
      .then((loaded) => {
        if (isCancelled) return
        setCategory(loaded)
        setForm(toForm(loaded))
        setStatus('ready')
      })
      .catch((error) => {
        if (!isCancelled) setStatus(error.status === 404 || error.status === 400 ? 'not-found' : 'error')
      })
    return () => {
      isCancelled = true
    }
  }, [id, isNew])

  // Free the preview's memory when it is replaced or the page closes.
  useEffect(() => () => newImage && URL.revokeObjectURL(newImage.previewUrl), [newImage])

  function setValue(name, value) {
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current))
  }

  function pickFile(file) {
    if (!file) return
    const problem = imageFileProblem(file)
    if (problem) {
      toast.error(problem)
      return
    }
    setNewImage({ file, previewUrl: URL.createObjectURL(file) })
    setRemoveImage(false)
  }

  function buildPayload() {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      displayOrder: Number(form.displayOrder),
      isActive: form.isActive,
    }
    const alt = form.imageAlt.trim() || undefined
    if (newImage) payload.image = { alt }
    else if (removeImage) payload.image = null
    else if (category?.image) payload.image = { alt }
    return payload
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = {}
    if (form.name.trim().length < 2) found.name = 'Enter the category name'
    if (!Number.isInteger(Number(form.displayOrder)) || Number(form.displayOrder) < 0) {
      found.displayOrder = 'Enter a whole number, 0 or more'
    }
    setErrors(found)
    if (Object.keys(found).length) return

    setIsSaving(true)
    try {
      const payload = buildPayload()
      if (isNew) {
        await adminApi.categories.create(payload, newImage?.file)
        toast.success(`${payload.name} added`)
      } else {
        await adminApi.categories.update(id, payload, newImage?.file)
        toast.success('Category saved')
      }
      navigate(APP_ROUTES.ADMIN_CATEGORIES, { replace: true })
    } catch (error) {
      setErrors(error.fieldErrors ?? {})
      toast.error(error.status === 409 ? `${error.message}. Is the name already used?` : error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const backLink = (
    <Link to={APP_ROUTES.ADMIN_CATEGORIES} className={ADMIN_BUTTON_SECONDARY}>
      <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
      All categories
    </Link>
  )

  if (status !== 'ready') {
    return (
      <>
        <AdminPageHeader title="Edit category" actions={backLink} />
        <AdminLoadState status={status} onRetry={() => window.location.reload()} />
      </>
    )
  }

  let previewUrl = null
  if (newImage) previewUrl = newImage.previewUrl
  else if (!removeImage && category?.image?.url) {
    previewUrl = cloudinaryImageUrl(category.image.url, PREVIEW_SIZE * 2, PREVIEW_SIZE * 2, { crop: 'fill' })
  }

  return (
    <>
      <AdminPageHeader title={isNew ? 'Add category' : category.name} actions={backLink} />

      <form onSubmit={handleSubmit} noValidate className={`${ADMIN_CARD} max-w-content space-y-4`}>
        <div>
          <label htmlFor="category-name" className={ADMIN_LABEL}>
            Name <span className="text-error">*</span>
          </label>
          <input
            id="category-name"
            value={form.name}
            maxLength={60}
            onChange={(event) => setValue('name', event.target.value)}
            aria-invalid={Boolean(errors.name)}
            className={ADMIN_INPUT}
          />
          {errors.name && <p className={ADMIN_FIELD_ERROR}>{errors.name}</p>}
          {!isNew && <p className="mt-1 text-xs text-muted">Renaming keeps the web address /{category.slug}.</p>}
        </div>

        <div>
          <label htmlFor="category-description" className={ADMIN_LABEL}>
            Description
          </label>
          <textarea
            id="category-description"
            rows={3}
            maxLength={500}
            value={form.description}
            onChange={(event) => setValue('description', event.target.value)}
            className={ADMIN_TEXTAREA}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="category-order" className={ADMIN_LABEL}>
              Display order <span className="font-normal text-muted">(lowest first)</span>
            </label>
            <input
              id="category-order"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={form.displayOrder}
              onChange={(event) => setValue('displayOrder', event.target.value)}
              aria-invalid={Boolean(errors.displayOrder)}
              className={ADMIN_INPUT}
            />
            {errors.displayOrder && <p className={ADMIN_FIELD_ERROR}>{errors.displayOrder}</p>}
          </div>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 self-end text-sm font-semibold text-navy-800">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setValue('isActive', event.target.checked)}
              className="size-4 accent-navy-800"
            />
            Published (shown in the store)
          </label>
        </div>

        <div>
          <p className={ADMIN_LABEL}>Image</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid size-30 shrink-0 place-items-center overflow-hidden rounded-full bg-cream-100">
              {previewUrl ? (
                <img src={previewUrl} alt="" width={PREVIEW_SIZE} height={PREVIEW_SIZE} className="size-full object-cover" />
              ) : (
                <span className="text-xs text-muted">No image</span>
              )}
            </span>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={IMAGE_ACCEPT_ATTRIBUTE}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) => {
                  pickFile(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} className={ADMIN_BUTTON_SECONDARY}>
                <ImagePlus size={16} strokeWidth={1.75} aria-hidden="true" />
                {previewUrl ? 'Replace image' : 'Add image'}
              </button>
              {previewUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setNewImage(null)
                    setRemoveImage(Boolean(category?.image))
                  }}
                  className={`${ADMIN_BUTTON_SECONDARY} text-error`}
                >
                  <Trash2 size={16} strokeWidth={1.75} aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-muted">{ALLOWED_IMAGE_FORMATS_LABEL}, up to 5 MB.</p>
          {previewUrl && (
            <div className="mt-3">
              <label htmlFor="category-image-alt" className={ADMIN_LABEL}>
                Image description for screen readers
              </label>
              <input
                id="category-image-alt"
                value={form.imageAlt}
                maxLength={160}
                onChange={(event) => setValue('imageAlt', event.target.value)}
                className={ADMIN_INPUT}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Link to={APP_ROUTES.ADMIN_CATEGORIES} className={ADMIN_BUTTON_SECONDARY}>
            Cancel
          </Link>
          <button type="submit" disabled={isSaving} className={ADMIN_BUTTON_PRIMARY}>
            {isSaving ? (
              <LoaderCircle size={16} strokeWidth={1.75} aria-hidden="true" className="animate-spin" />
            ) : (
              <Save size={16} strokeWidth={1.75} aria-hidden="true" />
            )}
            {isSaving ? 'Saving…' : isNew ? 'Add category' : 'Save changes'}
          </button>
        </div>
      </form>
    </>
  )
}

export default AdminCategoryFormPage