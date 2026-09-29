const HTML_ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Makes user-supplied text safe to interpolate into an HTML email. */
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ENTITIES[char]);

export default escapeHtml;