import { useEffect, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from 'lucide-react'

import { cloudinaryImageUrl } from '../../utils/cloudinaryImage.js'

import {
  ALLOWED_IMAGE_FORMATS_LABEL,
  IMAGE_ACCEPT_ATTRIBUTE,
  imageFileProblem,
  MAX_PRODUCT_IMAGE_FILES_PER_SAVE,
} from './adminImageRules.js'
import { ADMIN_BUTTON_SECONDARY, ADMIN_INPUT } from './adminStyles.js'

const PREVIEW_SIZE = 96
let newImageKeySeq = 0

/**
 * The product's photos in display order. The first one is the front of pack (what cards and the cart show).
 * New files are previewed locally and only uploaded when the form is saved. `entries` / `onChange` hold the
 * list: stored images carry `publicId` and `url`, new ones carry `file` and a local `previewUrl`.
 */
function ProductImagesEditor({ entries, onChange }) {
  const inputRef = useRef(null)
  const newFileCount = entries.filter((entry) => entry.file).length

  // Local previews hold memory until revoked; revoke them when the editor goes away.
  const entriesRef = useRef(entries)
  useEffect(() => {
    entriesRef.current = entries
  }, [entries])
  useEffect(
    () => () => {
      entriesRef.current.forEach((entry) => entry.previewUrl && URL.revokeObjectURL(entry.previewUrl))
    },
    [],
  )

  function addFiles(fileList) {
    const picked = Array.from(fileList ?? [])
    const accepted = []
    picked.forEach((file) => {
      const problem = imageFileProblem(file)
      if (problem) toast.error(problem)
      else accepted.push(file)
    })

    const room = MAX_PRODUCT_IMAGE_FILES_PER_SAVE - newFileCount
    if (accepted.length > room) {
      toast.error(`You can add up to ${MAX_PRODUCT_IMAGE_FILES_PER_SAVE} new photos per save. Save, then add the rest.`)
    }
    const added = accepted.slice(0, Math.max(0, room)).map((file) => {
      newImageKeySeq += 1
      return { key: `new-${newImageKeySeq}`, file, previewUrl: URL.createObjectURL(file), alt: '' }
    })
    if (added.length) onChange([...entries, ...added])
  }

  function move(index, offset) {
    const target = index + offset
    if (target < 0 || target >= entries.length) return
    const next = [...entries]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  function makeFront(index) {
    const next = [...entries]
    const [entry] = next.splice(index, 1)
    onChange([entry, ...next])
  }

  function remove(index) {
    const entry = entries[index]
    if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl)
    onChange(entries.filter((_, entryIndex) => entryIndex !== index))
  }

  function setAlt(index, alt) {
    onChange(entries.map((entry, entryIndex) => (entryIndex === index ? { ...entry, alt } : entry)))
  }

  return (
    <div>
      {entries.length > 0 ? (
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry, index) => (
            <li key={entry.key} className="rounded-xl border border-line p-3">
              <div className="flex gap-3">
                <span className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-cream-100 p-1">
                  <img
                    src={entry.previewUrl ?? cloudinaryImageUrl(entry.url, PREVIEW_SIZE * 2, PREVIEW_SIZE * 2, { crop: 'limit' })}
                    alt=""
                    width={PREVIEW_SIZE}
                    height={PREVIEW_SIZE}
                    className="size-full object-contain"
                  />
                  {index === 0 && (
                    <span className="absolute top-1 left-1 rounded-full bg-navy-800 px-1.5 text-xs font-bold text-white uppercase">
                      Front
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-xs text-muted">
                    Photo {index + 1}
                    {entry.file ? ' · new, uploads on save' : ''}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move photo ${index + 1} earlier`}
                      className={`${ADMIN_BUTTON_SECONDARY} min-h-9 px-2`}
                    >
                      <ArrowUp size={14} strokeWidth={2} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === entries.length - 1}
                      aria-label={`Move photo ${index + 1} later`}
                      className={`${ADMIN_BUTTON_SECONDARY} min-h-9 px-2`}
                    >
                      <ArrowDown size={14} strokeWidth={2} aria-hidden="true" />
                    </button>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => makeFront(index)}
                        aria-label={`Make photo ${index + 1} the front`}
                        className={`${ADMIN_BUTTON_SECONDARY} min-h-9 px-2`}
                      >
                        <Star size={14} strokeWidth={2} aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      aria-label={`Remove photo ${index + 1}`}
                      className={`${ADMIN_BUTTON_SECONDARY} min-h-9 px-2 text-error`}
                    >
                      <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
              <label htmlFor={`image-alt-${entry.key}`} className="mt-2 block text-xs font-semibold text-navy-800">
                Description for screen readers
              </label>
              <input
                id={`image-alt-${entry.key}`}
                value={entry.alt}
                maxLength={160}
                onChange={(event) => setAlt(index, event.target.value)}
                placeholder="e.g. Front of the pack"
                className={`${ADMIN_INPUT} mt-1 min-h-9`}
              />
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">No photos yet.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT_ATTRIBUTE}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          addFiles(event.target.files)
          event.target.value = ''
        }}
      />
      <button type="button" onClick={() => inputRef.current?.click()} className={`${ADMIN_BUTTON_SECONDARY} mt-3`}>
        <ImagePlus size={16} strokeWidth={1.75} aria-hidden="true" />
        Add photos
      </button>
      <p className="mt-1 text-xs text-muted">
        {ALLOWED_IMAGE_FORMATS_LABEL}, up to 5 MB each. The first photo is the front of the pack. Removed photos are deleted
        when you save.
      </p>
    </div>
  )
}

export default ProductImagesEditor