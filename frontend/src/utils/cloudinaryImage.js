/**
 * Asks Cloudinary for a cropped image of the given size (and the best format and quality for the browser)
 * instead of the full upload. Any URL that isn't a Cloudinary upload passes through unchanged.
 */
export function cloudinaryImageUrl(url, width, height) {
  if (!url?.includes('res.cloudinary.com') || !url.includes('/upload/')) return url
  return url.replace('/upload/', `/upload/c_fill,w_${width},h_${height},f_auto,q_auto/`)
}

export default cloudinaryImageUrl