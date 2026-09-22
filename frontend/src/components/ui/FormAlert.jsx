/** Form-level message, e.g. an API error that belongs to no single field. */
function FormAlert({ children }) {
  if (!children) return null
  return (
    <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
      {children}
    </p>
  )
}

export default FormAlert