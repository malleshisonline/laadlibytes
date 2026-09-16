/**
 * Turns a display name into a URL-safe slug: "Millets n Nuts" -> "millets-n-nuts".
 *
 * Accents are decomposed and stripped rather than dropped whole, so "Puree"
 * survives as "puree" instead of collapsing to "pure". "&" becomes "and" because
 * a bare ampersand would otherwise vanish and run two words together.
 */
export function slugify(value) {
  return String(value ?? '')
    .normalize('NFKD') // splits an accented char into base + combining mark
    .replace(/[̀-ͯ]/g, '') // ...then drops the mark
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default slugify;