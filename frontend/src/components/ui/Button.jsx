const VARIANT_CLASSES = {
  primary: 'bg-navy-800 text-white shadow-md hover:bg-navy-700',
  outline: 'border border-navy-800 bg-white text-navy-800 hover:bg-lightblue-100',
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