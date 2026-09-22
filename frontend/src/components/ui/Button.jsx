const VARIANT_CLASSES = {
  primary: 'bg-brand-navy text-white shadow-md hover:bg-brand-navy-dark',
  outline: 'border border-brand-navy bg-white text-brand-navy hover:bg-brand-sky',
}

function Button({
  variant = 'primary',
  type = 'button',
  isLoading = false,
  loadingText,
  disabled = false,
  className = '',
  children,
  ...buttonProps
}) {
  return (
    <button
      type={type}
      disabled={isLoading || disabled}
      className={`w-full rounded-full px-5 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      {...buttonProps}
    >
      {isLoading ? loadingText ?? children : children}
    </button>
  )
}

export default Button