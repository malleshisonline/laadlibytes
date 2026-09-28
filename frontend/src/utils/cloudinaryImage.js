/**
 * Asks Cloudinary for the image at the given size (and the best format and quality for the browser) instead of
 * the full upload. `crop` is 'fill' (crop to exactly width × height) or 'limit' (shrink to fit, never crop or
 * enlarge — for product photos that must show the whole pack). Non-Cloudinary URLs pass through unchanged.
 */
export function cloudinaryImageUrl(url, width, height, { crop = 'fill' } = {}) {
  if (!url?.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/c_${crop},w_${width},h_${height},f_auto,q_auto/`)
}

export default cloudinaryImageUrl