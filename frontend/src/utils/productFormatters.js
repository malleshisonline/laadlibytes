// Prices are whole rupees, so no paise: ₹1,240.
const priceFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const formatPrice = (amount) => priceFormatter.format(amount)

/** "100 g" from { value: 100, unit: 'g' }, or null when the pack size is missing. */
export function formatPackSize(packSize) {
  if (!packSize?.value || !packSize?.unit) return null
  return `${packSize.value} ${packSize.unit}`
}

/**
 * "Energy: 438.0 kcal" → { label: 'Energy', value: '438.0 kcal' }. A point without a colon keeps its whole text
 * as the label.
 */
export function splitNutritionPoint(point) {
  const colonIndex = point.indexOf(':')
  if (colonIndex === -1) return { label: point.trim(), value: '' }
  return { label: point.slice(0, colonIndex).trim(), value: point.slice(colonIndex + 1).trim() }
}