/** Label + input + inline error, wired together for screen readers. Extra props go to the <input>. */
function FormField({ id, label, error, ...inputProps }) {
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-navy-800">
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-xl border bg-white px-2 py-2 text-body placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-navy-800/25 ${
          error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-navy-800'
        }`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default FormField