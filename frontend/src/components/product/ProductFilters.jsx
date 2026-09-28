import { useId } from 'react'

import { PRICE_RANGES, SORT_OPTIONS } from '../../content/productFilterOptions.js'

/**
 * One radio row: the whole row is the click target (44px tall). The chosen row turns into a white tab with a
 * caramel bar on its left; the others nudge right on hover.
 */
function FilterOption({ name, value, label, checked, onSelect }) {
  return (
    <label
      className={`relative flex min-h-11 cursor-pointer items-center gap-3 overflow-hidden rounded-lg px-3 text-sm transition duration-200 lg:min-h-10 ${
        checked
          ? 'bg-surface font-bold text-navy-800 shadow-sm ring-1 ring-caramel-500/40'
          : 'text-body hover:bg-cream-100 motion-safe:hover:translate-x-0.5'
      }`}
    >
      <span
        aria-hidden='true'
        className={`absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-caramel-500 transition-opacity duration-200 ${
          checked ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <input
        type='radio'
        name={name}
        value={value}
        checked={checked}
        onChange={() => onSelect(value)}
        className='size-4 shrink-0 accent-caramel-700'
      />
      {label}
    </label>
  )
}

/** A titled group of options (fieldset + legend, so screen readers announce the group). */
function FilterGroup({ title, children }) {
  return (
    <fieldset className='border-b border-cream-200 py-4 first:pt-0 last:border-b-0 last:pb-0'>
      <legend className='mb-2 flex items-center gap-2 px-1 text-xs font-extrabold tracking-[0.15em] text-caramel-700 uppercase'>
        <span aria-hidden='true' className='size-1.5 rotate-45 bg-caramel-500' />
        {title}
      </legend>
      <div className='space-y-0.5'>{children}</div>
    </fieldset>
  )
}

/**
 * Products page filters, as in the "Product Listing" design: Categories, Price Range and Sort By. Controlled:
 * `filters` is { category, price, sort } (URL values; '' means "all") and `onChange(key, value)` updates one.
 * Used in the desktop sidebar and inside the mobile drawer.
 */
function ProductFilters({ categories, filters, onChange }) {
  // Unique radio group names, since the sidebar and the drawer can both be in the page.
  const idPrefix = useId()

  return (
    <div>
      <FilterGroup title='Categories'>
        <FilterOption
          name={`${idPrefix}-category`}
          value=''
          label='All Products'
          checked={!filters.category}
          onSelect={(value) => onChange('category', value)}
        />
        {categories.map((category) => (
          <FilterOption
            key={category.id}
            name={`${idPrefix}-category`}
            value={category.slug}
            label={category.name}
            checked={filters.category === category.slug}
            onSelect={(value) => onChange('category', value)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title='Price Range'>
        <FilterOption
          name={`${idPrefix}-price`}
          value=''
          label='Any price'
          checked={!filters.price}
          onSelect={(value) => onChange('price', value)}
        />
        {PRICE_RANGES.map((range) => (
          <FilterOption
            key={range.value}
            name={`${idPrefix}-price`}
            value={range.value}
            label={range.label}
            checked={filters.price === range.value}
            onSelect={(value) => onChange('price', value)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title='Sort By'>
        {SORT_OPTIONS.map((option) => (
          <FilterOption
            key={option.value}
            name={`${idPrefix}-sort`}
            value={option.value}
            label={option.label}
            checked={filters.sort === option.value}
            onSelect={(value) => onChange('sort', value)}
          />
        ))}
      </FilterGroup>
    </div>
  )
}

export { ProductFilters }
export default ProductFilters