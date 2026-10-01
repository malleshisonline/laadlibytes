/** The white card every account section sits in, with its heading and an optional action beside it. */
function AccountCard({ title, description, action, children }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-navy-800 md:text-2xl">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export default AccountCard