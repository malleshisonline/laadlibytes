import crypto from 'node:crypto';

import { ApiError } from '../../utils/ApiError.js';
import { Product } from '../product/product.model.js';

import { Cart } from './cart.model.js';

export const MAX_QTY_PER_LINE = 10;
// One line per product, and there are 56 products.
export const MAX_LINES = 56;
export const GUEST_CART_TTL_DAYS = 30;

const PRODUCT_FIELDS = 'name slug price mrp images stock isActive';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * `owner` is `{ userId }` for a signed-in caller or `{ guestToken }` (the raw cookie value) for a guest.
 * Returns null for a guest with no cookie yet: they have no cart.
 */
const ownerFilter = ({ userId, guestToken }) => {
  if (userId) return { user: userId };
  if (guestToken) return { guestToken: hashToken(guestToken) };
  return null;
};

const guestExpiry = () => new Date(Date.now() + GUEST_CART_TTL_DAYS * 24 * 60 * 60 * 1000);

/** Finds the owner's cart, creating it atomically when missing, so two parallel first adds share one cart. */
async function findOrCreateCart(owner) {
  const filter = ownerFilter(owner);
  // The upsert copies the filter's owner field into the new cart by itself.
  const update = { $setOnInsert: { items: [] } };
  if (owner.guestToken) update.$set = { expiresAt: guestExpiry() };

  return Cart.findOneAndUpdate(filter, update, { upsert: true, returnDocument: 'after' });
}

async function findActiveProduct(productId) {
  const product = await Product.findOne({ _id: productId, isActive: true }).select('stock').lean();
  if (!product) throw ApiError.notFound('Product not found', { code: 'PRODUCT_NOT_FOUND' });
  return product;
}

function assertQuantityAllowed(quantity, stock) {
  if (quantity > MAX_QTY_PER_LINE) {
    throw ApiError.conflict(`You can add at most ${MAX_QTY_PER_LINE} of one item`, { code: 'CART_LIMIT' });
  }
  if (quantity > stock) {
    const message = stock > 0 ? `Only ${stock} left in stock` : 'This product is out of stock';
    throw ApiError.conflict(message, { code: 'INSUFFICIENT_STOCK' });
  }
}

const EMPTY_CART = Object.freeze({ items: [], itemCount: 0, subtotal: 0, mrpTotal: 0, savings: 0 });

/**
 * The cart as the storefront shows it, priced from the live products. A line whose quantity no longer
 * fits the stock is kept and flagged with `issue`, so the shopper sees why rather than losing it.
 */
function toCartView(cart) {
  const items = cart.items.map(({ product, quantity }) => {
    let issue = null;
    if (product.stock <= 0) issue = 'OUT_OF_STOCK';
    else if (quantity > product.stock) issue = 'INSUFFICIENT_STOCK';

    return {
      product: {
        id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        price: product.price,
        mrp: product.mrp,
        image: product.images?.[0] ?? null,
        stock: product.stock,
      },
      quantity,
      maxQuantity: Math.min(product.stock, MAX_QTY_PER_LINE),
      lineTotal: product.price * quantity,
      issue,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const mrpTotal = items.reduce((sum, item) => sum + Math.max(item.product.mrp, item.product.price) * item.quantity, 0);

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    mrpTotal,
    savings: mrpTotal - subtotal,
  };
}

/** Loads the owner's cart with its products, dropping lines whose product was deleted or unpublished. */
async function loadCart(filter) {
  const cart = await Cart.findOne(filter).populate('items.product', PRODUCT_FIELDS);
  if (!cart) return null;

  const live = cart.items.filter((item) => item.product?.isActive);
  if (live.length !== cart.items.length) {
    await Cart.updateOne({ _id: cart._id }, { $pull: { items: { product: { $nin: live.map((i) => i.product._id) } } } });
    cart.items = live;
  }
  return cart;
}

export const cartService = {
  async getCart(owner) {
    const filter = ownerFilter(owner);
    const cart = filter && (await loadCart(filter));
    return cart ? toCartView(cart) : { ...EMPTY_CART };
  },

  /** Adds to the line when the product is already in the cart. */
  async addItem(owner, productId, quantity) {
    const product = await findActiveProduct(productId);
    const cart = await findOrCreateCart(owner);

    const line = cart.items.find((item) => item.product.equals(productId));
    const nextQuantity = (line?.quantity ?? 0) + quantity;
    assertQuantityAllowed(nextQuantity, product.stock);

    if (line) {
      line.quantity = nextQuantity;
    } else {
      if (cart.items.length >= MAX_LINES) {
        throw ApiError.conflict('Your cart is full', { code: 'CART_LIMIT' });
      }
      cart.items.push({ product: productId, quantity });
    }
    await cart.save();

    return this.getCart(owner);
  },

  async setItemQuantity(owner, productId, quantity) {
    const filter = ownerFilter(owner);
    const cart = filter && (await Cart.findOne(filter));
    const line = cart?.items.find((item) => item.product.equals(productId));
    if (!line) throw ApiError.notFound('This item is not in your cart', { code: 'CART_ITEM_NOT_FOUND' });

    const product = await findActiveProduct(productId);
    assertQuantityAllowed(quantity, product.stock);

    line.quantity = quantity;
    if (owner.guestToken) cart.expiresAt = guestExpiry();
    await cart.save();

    return this.getCart(owner);
  },

  /** Idempotent: removing a product that is not in the cart is not an error. */
  async removeItem(owner, productId) {
    const filter = ownerFilter(owner);
    if (filter) await Cart.updateOne(filter, { $pull: { items: { product: productId } } });
    return this.getCart(owner);
  },

  async clear(owner) {
    const filter = ownerFilter(owner);
    if (filter) await Cart.updateOne(filter, { $set: { items: [] } });
    return { ...EMPTY_CART };
  },

  /**
   * Moves a guest cart into the user's cart on sign-in, then deletes the guest cart. Quantities of a
   * product in both are added together, capped at the stock and at MAX_QTY_PER_LINE; out-of-stock and
   * unpublished products are left behind. Safe to call twice: the second call finds no guest cart.
   */
  async mergeGuestCartIntoUser(guestToken, userId) {
    const guestFilter = ownerFilter({ guestToken });
    const guestCart = await loadCart(guestFilter);
    if (!guestCart) return;

    if (guestCart.items.length) {
      const userCart = await findOrCreateCart({ userId });

      for (const { product, quantity } of guestCart.items) {
        const line = userCart.items.find((item) => item.product.equals(product._id));
        const merged = Math.min((line?.quantity ?? 0) + quantity, MAX_QTY_PER_LINE, product.stock);

        if (line) {
          line.quantity = Math.max(line.quantity, merged);
        } else if (merged > 0 && userCart.items.length < MAX_LINES) {
          userCart.items.push({ product: product._id, quantity: merged });
        }
      }
      await userCart.save();
    }

    await Cart.deleteOne({ _id: guestCart._id });
  },
};

export default cartService;