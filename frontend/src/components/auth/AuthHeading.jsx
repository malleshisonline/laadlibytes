/** Card title in the brand script font, with an optional line underneath. */
function AuthHeading({ title, children }) {
  return (
    <div className="mb-4 text-center">
      <h2 className="font-display text-2xl font-light text-navy-800">{title}</h2>
      <div className="mx-auto mt-2 h-0.5 w-16 rounded-full bg-caramel-500" />
      {children && <p className="mt-3 text-sm text-gray-600">{children}</p>}
    </div>
  )
}

export default AuthHeading