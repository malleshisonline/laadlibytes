import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { splitNutritionPoint } from '../../../utils/productFormatters.js'

function DescriptionPanel({ product }) {
  return <p className='max-w-3xl text-base leading-relaxed text-body'>{product.description}</p>
}

function IngredientsPanel({ product }) {
  return (
    <ul className='max-w-3xl space-y-2'>
      {product.ingredients.map((ingredient) => (
        <li key={ingredient} className='flex gap-3 text-base text-body'>
          <span aria-hidden='true' className='mt-2 size-1.5 shrink-0 rotate-45 bg-caramel-500' />
          {ingredient}
        </li>
      ))}
    </ul>
  )
}

function NutritionPanel({ product }) {
  return (
    <div className='max-w-xl overflow-hidden rounded-xl border border-cream-200'>
      <table className='w-full text-sm'>
        <caption className='bg-navy-800 px-4 py-2.5 text-left font-bold text-white'>Nutrition information</caption>
        <tbody>
          {product.nutritionPoints.map((point) => {
            const { label, value } = splitNutritionPoint(point)
            return (
              <tr key={point} className='odd:bg-cream-50 even:bg-surface'>
                <th scope='row' className='px-4 py-2.5 text-left font-semibold text-navy-800'>
                  {label}
                </th>
                <td className='px-4 py-2.5 text-right text-body'>{value}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SafetyPanel({ product }) {
  return (
    <dl className='max-w-3xl space-y-4'>
      {product.allergenInfo && (
        <div>
          <dt className='font-bold text-navy-800'>Allergen information</dt>
          <dd className='mt-1 text-base text-body'>{product.allergenInfo}</dd>
        </div>
      )}
      {product.shelfLife && (
        <div>
          <dt className='font-bold text-navy-800'>Shelf life</dt>
          <dd className='mt-1 text-base text-body'>{product.shelfLife}</dd>
        </div>
      )}
    </dl>
  )
}

/** The sections this product has content for, in display order. */
function sectionsFor(product) {
  return [
    product.description && { key: 'description', label: 'Description', Panel: DescriptionPanel },
    product.ingredients?.length > 0 && { key: 'ingredients', label: 'Ingredients', Panel: IngredientsPanel },
    product.nutritionPoints?.length > 0 && { key: 'nutrition', label: 'Nutrition', Panel: NutritionPanel },
    (product.allergenInfo || product.shelfLife) && {
      key: 'safety',
      label: 'Allergens & Shelf Life',
      Panel: SafetyPanel,
    },
  ].filter(Boolean)
}

/**
 * "Product information": tabs from md, an accordion (one section open at a time) on phones. Only sections the
 * product actually has data for are shown.
 */
function ProductInfoTabs({ product }) {
  const idPrefix = useId()
  const sections = sectionsFor(product)
  const [activeKey, setActiveKey] = useState(sections[0]?.key ?? null)

  if (!sections.length) return null
  const activeSection = sections.find((section) => section.key === activeKey) ?? sections[0]

  return (
    <section aria-labelledby={`${idPrefix}-heading`} className='rounded-2xl border border-cream-200 bg-surface p-4 shadow-sm md:p-6'>
      <h2 id={`${idPrefix}-heading`} className='text-xl font-semibold text-navy-800 md:text-2xl'>
        Product information
      </h2>

      {/* Tabs, md and up. */}
      <div className='mt-4 hidden md:block'>
        <div role='tablist' aria-label='Product information' className='flex gap-1 border-b border-cream-200'>
          {sections.map((section) => {
            const isActive = section.key === activeSection.key
            return (
              <button
                key={section.key}
                id={`${idPrefix}-tab-${section.key}`}
                type='button'
                role='tab'
                aria-selected={isActive}
                aria-controls={`${idPrefix}-panel-${section.key}`}
                onClick={() => setActiveKey(section.key)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                  isActive
                    ? 'border-caramel-500 text-navy-800'
                    : 'border-transparent text-muted hover:border-cream-200 hover:text-navy-800'
                }`}
              >
                {section.label}
              </button>
            )
          })}
        </div>
        <div
          id={`${idPrefix}-panel-${activeSection.key}`}
          role='tabpanel'
          aria-labelledby={`${idPrefix}-tab-${activeSection.key}`}
          className='pt-5'
        >
          <activeSection.Panel product={product} />
        </div>
      </div>

      {/* Accordion, phones. */}
      <div className='mt-3 divide-y divide-cream-200 md:hidden'>
        {sections.map((section) => {
          const isOpen = section.key === activeKey
          return (
            <div key={section.key}>
              <button
                type='button'
                aria-expanded={isOpen}
                aria-controls={`${idPrefix}-accordion-${section.key}`}
                onClick={() => setActiveKey(isOpen ? null : section.key)}
                className='flex min-h-12 w-full items-center justify-between text-left text-sm font-bold text-navy-800'
              >
                {section.label}
                <ChevronDown
                  size={18}
                  strokeWidth={2}
                  aria-hidden='true'
                  className={`text-caramel-700 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <div id={`${idPrefix}-accordion-${section.key}`} className='pb-4'>
                  <section.Panel product={product} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export { ProductInfoTabs }
export default ProductInfoTabs