// Class strings shared by the admin screens, so every button, field and table looks the same. The admin panel
// has no approved design; it uses the storefront tokens with a plain, calm layout.

const BUTTON_BASE =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-600 disabled:cursor-not-allowed disabled:opacity-60'

export const ADMIN_BUTTON_PRIMARY = `${BUTTON_BASE} bg-navy-800 text-white shadow-sm hover:bg-navy-700`
export const ADMIN_BUTTON_SECONDARY = `${BUTTON_BASE} border border-line bg-surface text-navy-800 hover:bg-lightblue-100`
export const ADMIN_BUTTON_DANGER = `${BUTTON_BASE} border border-error/30 bg-surface text-error hover:bg-cream-100`

export const ADMIN_LABEL = 'mb-1 block text-sm font-semibold text-navy-800'
export const ADMIN_INPUT =
  'min-h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-body placeholder:text-muted focus:border-navy-600 focus:ring-2 focus:ring-lightblue-200 focus:outline-none'
export const ADMIN_TEXTAREA = `${ADMIN_INPUT} py-2`
export const ADMIN_FIELD_ERROR = 'mt-1 text-xs font-semibold text-error'

export const ADMIN_CARD = 'rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5'

export const ADMIN_TABLE = 'w-full min-w-160 text-left text-sm'
export const ADMIN_TH = 'border-b border-line px-3 py-2 text-xs font-bold tracking-wide text-muted uppercase'
export const ADMIN_TD = 'border-b border-line px-3 py-3 align-middle text-body'

export const ADMIN_BADGE = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap'