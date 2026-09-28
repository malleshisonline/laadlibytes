// Products page filters, as in the "Product Listing" design. Each option's `value` is what goes in the URL.

// Whole-rupee prices (₹140–₹340 across the catalogue). `max` is inclusive; a missing bound means open-ended.
export const PRICE_RANGES = [
  { value: 'under-150', label: 'Under ₹150', maxPrice: 149 },
  { value: '150-200', label: '₹150 – ₹200', minPrice: 150, maxPrice: 200 },
  { value: '201-300', label: '₹201 – ₹300', minPrice: 201, maxPrice: 300 },
  { value: 'above-300', label: 'Above ₹300', minPrice: 301 },
]

// `value` is the backend's sort key (PRODUCT_SORTS in product.validation.js).
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
]

export const DEFAULT_SORT = 'newest'

// Products per page: fills 2, 3 and 4 columns evenly.
export const PRODUCTS_PER_PAGE = 12

export default { PRICE_RANGES, SORT_OPTIONS, DEFAULT_SORT, PRODUCTS_PER_PAGE }