// `compact`: smaller label and input with livelier hover/focus, for dense forms such as the address form.
const LABEL_CLASSES = {
  default: 'mb-1.5 block text-sm font-semibold text-navy-800',
  compact: 'mb-1 block text-xs font-bold tracking-wide text-navy-800',
}

const CONTROL_CLASSES = {
  default: 'rounded-xl bg-white px-2 py-2 text-body focus:ring-2 focus:ring-navy-800/25',
  compact:
    'min-h-10 rounded-lg bg-lightblue-50/60 px-3 py-2 text-sm text-body shadow-inner shadow-navy-950/5 hover:border-navy-600/60 hover:bg-white focus:bg-white focus:ring-4 focus:ring-lightblue-200',
}

/**
 * Label + input + inline error, wired together for screen readers. Extra props go to the <input>.
 * Pass `as="textarea"` for a multi-line field, and `compact` for the smaller style.
 */
function FormField({ id, label, error, compact = false, as: Control = 'input', ...inputProps }) {
  const errorId = `${id}-error`
  const size = compact ? 'compact' : 'default'

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASSES[size]}>
        {label}
      </label>
      <Control
        id={id}
        name={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full border placeholder:text-gray-400 transition focus:outline-none ${CONTROL_CLASSES[size]} ${
          error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-navy-800'
        }`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className={`mt-1 text-red-600 ${compact ? 'text-xs font-semibold' : 'text-sm'}`}>
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField