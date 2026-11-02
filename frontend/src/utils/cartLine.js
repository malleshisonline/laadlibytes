import { giftHamperDetailsPath, productDetailsPath } from '../constants/appRoutepoints.js'

/**
 * A cart or order line is a product or a gift hamper (`kind: 'hamper'`). Lines without a kind are products.
 * These helpers let the cart and checkout show both without caring which one they hold.
 */
export const isHamperLine = (item) => item.kind === 'hamper'

/** The thing being bought: { id, name, slug, price, mrp, image, … } from the product or the hamper. */
export const lineItemOf = (item) => (isHamperLine(item) ? item.hamper : item.product)

/** Where the line's name and photo link to: the product page, or the hamper's page in the Gift Store. */
export const lineDetailsPath = (item) => {
  const { slug } = lineItemOf(item)
  return isHamperLine(item) ? giftHamperDetailsPath(slug) : productDetailsPath(slug)
}

/** True when the cart holds at least one gift hamper (checkout then asks for the gift details and terms). */
export const hasHamperLine = (items = []) => items.some(isHamperLine)

export default lineItemOf