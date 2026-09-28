import { Minus, Plus } from 'lucide-react'

const STEP_BUTTON_CLASSES =
  'inline-flex size-10 items-center justify-center text-navy-800 transition hover:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-40'

/** − [n] + quantity picker, kept between `min` and `max`. `label` names it for screen readers. */
function QuantityStepper({ value, min = 1, max, onChange, label = 'Quantity', disabled = false }) {
  const clamp = (next) => Math.min(max, Math.max(min, next))

  return (
    <div
      role='group'
      aria-label={label}
      className='inline-flex items-center overflow-hidden rounded-lg border border-cream-200 bg-surface shadow-sm'
    >
      <button
        type='button'
        onClick={() => onChange(clamp(value - 1))}
        disabled={disabled || value <= min}
        aria-label='Decrease quantity'
        className={STEP_BUTTON_CLASSES}
      >
        <Minus size={16} strokeWidth={2} aria-hidden='true' />
      </button>
      <output aria-live='polite' className='w-10 text-center text-base font-extrabold text-navy-800'>
        {value}
      </output>
      <button
        type='button'
        onClick={() => onChange(clamp(value + 1))}
        disabled={disabled || value >= max}
        aria-label='Increase quantity'
        className={STEP_BUTTON_CLASSES}
      >
        <Plus size={16} strokeWidth={2} aria-hidden='true' />
      </button>
    </div>
  )
}

export { QuantityStepper }
export default QuantityStepper