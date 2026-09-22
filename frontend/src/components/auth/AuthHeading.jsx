/** Card title in the brand script font, with an optional line underneath. */
function AuthHeading({ title, children }) {
  return (
    <div className="mb-4 text-center">
      <h2 className="font-heading text-2xl font-light text-brand-navy-dark">{title}</h2>
      <div className="mx-auto mt-2 h-0.5 w-16 rounded-full bg-brand-gold" />
      {children && <p className="mt-3 text-sm text-gray-600">{children}</p>}
    </div>
  )
}

export default AuthHeading