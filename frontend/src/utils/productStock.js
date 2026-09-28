// Below this many packs the product page warns "Only N left".
export const LOW_STOCK_THRESHOLD = 10

// Most packs one order line can hold, whatever the stock.
export const MAX_QUANTITY_PER_ORDER = 10

/** Most the quantity picker allows for this product (0 when out of stock). */
export function maxQuantityFor(product) {
  if (!product.inStock) return 0
  return Math.min(MAX_QUANTITY_PER_ORDER, product.stock ?? MAX_QUANTITY_PER_ORDER)
}