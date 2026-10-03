// Mirrors backend/src/utils/imageFileRules.js, so a wrong file is refused before it is uploaded. The backend
// still checks every file (including its real signature), so these are a convenience, not the guard.
export const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024
export const MAX_PRODUCT_IMAGE_FILES_PER_SAVE = 10
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif']
export const IMAGE_ACCEPT_ATTRIBUTE = ALLOWED_IMAGE_TYPES.join(',')
export const ALLOWED_IMAGE_FORMATS_LABEL = 'PNG, JPG, WEBP or AVIF'

/** The reason a picked file cannot be used, or null when it is fine. */
export function imageFileProblem(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return `${file.name}: use a ${ALLOWED_IMAGE_FORMATS_LABEL} image`
  if (file.size > MAX_IMAGE_FILE_BYTES) return `${file.name}: the file is larger than 5 MB`
  return null
}

/** A stored product image as a ProductImagesEditor entry. */
export const toEditorImage = (image) => ({ key: image.publicId, publicId: image.publicId, url: image.url, alt: image.alt ?? '' })

/**
 * The editor's list as the API wants it: `images` is the complete final order, each entry either a stored image
 * ({ publicId }) or the n-th of `files` ({ newImageFileIndex }). Uploading a product's images never sends a URL.
 */
export function toImagePayload(entries) {
  const files = []
  const images = entries.map((entry) => {
    const alt = entry.alt.trim() || undefined
    if (entry.file) {
      files.push(entry.file)
      return { newImageFileIndex: files.length - 1, alt }
    }
    return { publicId: entry.publicId, alt }
  })
  return { images, files }
}