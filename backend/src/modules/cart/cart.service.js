import crypto from 'node:crypto';

import { ApiError } from '../../utils/ApiError.js';
import { giftHamperService } from '../giftHamper/giftHamper.service.js';
import { Product } from '../product/product.model.js';

import { Cart } from './cart.model.js';

export const MAX_QTY_PER_LINE = 10;
// One line per product, and there are 56 products. Gift hamper lines count towards it too.
export const MAX_LINES = 56;
export const GUEST_CART_TTL_DAYS = 30;

const PRODUCT_FIELDS = 'name slug price mrp images stock isActive';
const HAMPER_FIELDS = 'name slug code price images isActive maxQtyPerOrder piecesPerBox netWeightGrams leadTimeDays greetingCardLabel flavours';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const refId = (ref) => (ref?._id ?? ref)?.toString();

/** A line without a kind was saved before gift hampers existed, so it is a product line. */
export const isHamperLine = (item) => item.kind === 'hamper';

/**
 * The one key that names a cart line: `product:<id>` or `hamper:<id>`. Every lookup goes through it, so a
 * product line and a hamper line can never be mistaken for each other.
 */
export const lineKeyOf = (item) => (isHamperLine(item) ? `hamper:${refId(item.hamper)}` : `product:${refId(item.product)}`);

const productLineKey = (productId) => `product:${productId}`;
const hamperLineKey = (hamperId) => `hamper:${hamperId}`;

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

async function findActiveHamper(hamperId) {
  const hamper = await giftHamperService.findActive(hamperId);
  if (!hamper) throw ApiError.notFound('Gift hamper not found', { code: 'GIFT_HAMPER_NOT_FOUND' });
  return hamper;
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

/** Hampers are made to order, so there is no stock: only the hamper's own per-order cap. */
function assertHamperQuantityAllowed(quantity, hamper) {
  if (quantity > hamper.maxQtyPerOrder) {
    throw ApiError.conflict(`You can order at most ${hamper.maxQtyPerOrder} boxes of ${hamper.name} online`, {
      code: 'CART_LIMIT',
    });
  }
}

const EMPTY_CART = Object.freeze({ items: [], itemCount: 0, subtotal: 0, mrpTotal: 0, savings: 0 });

function toProductLineView({ product, quantity }) {
  let issue = null;
  if (product.stock <= 0) issue = 'OUT_OF_STOCK';
  else if (quantity > product.stock) issue = 'INSUFFICIENT_STOCK';

  return {
    kind: 'product',
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
}

/** A hamper's price is its MRP, so `mrp` equals `price` and it adds nothing to the savings. */
function toHamperLineView({ hamper, quantity }) {
  return {
    kind: 'hamper',
    hamper: {
      id: hamper._id.toString(),
      name: hamper.name,
      slug: hamper.slug,
      code: hamper.code,
      price: hamper.price,
      mrp: hamper.price,
      image: hamper.images?.[0] ?? null,
      piecesPerBox: hamper.piecesPerBox,
      netWeightGrams: hamper.netWeightGrams,
      leadTimeDays: hamper.leadTimeDays,
      greetingCardLabel: hamper.greetingCardLabel ?? null,
      flavours: hamper.flavours,
    },
    quantity,
    maxQuantity: hamper.maxQtyPerOrder,
    lineTotal: hamper.price * quantity,
    // The admin lowered the cap after this was added: the shopper has to lower the quantity.
    issue: quantity > hamper.maxQtyPerOrder ? 'QUANTITY_LIMIT' : null,
  };
}

/**
 * The cart as the storefront shows it, priced from the live products and hampers. A product line whose
 * quantity no longer fits the stock is kept and flagged with `issue`, so the shopper sees why rather
 * than losing it.
 */
function toCartView(cart) {
  const items = cart.items.map((item) => (isHamperLine(item) ? toHamperLineView(item) : toProductLineView(item)));

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const mrpTotal = items.reduce((sum, item) => {
    const priced = item.product ?? item.hamper;
    return sum + Math.max(priced.mrp, priced.price) * item.quantity;
  }, 0);

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    mrpTotal,
    savings: mrpTotal - subtotal,
  };
}

/**
 * Loads the owner's cart with its products and hampers, dropping lines whose product or hamper was
 * deleted or unpublished.
 */
async function loadCart(filter) {
  const cart = await Cart.findOne(filter)
    .populate('items.product', PRODUCT_FIELDS)
    .populate('items.hamper', HAMPER_FIELDS);
  if (!cart) return null;

  const isLive = (item) => (isHamperLine(item) ? item.hamper?.isActive : item.product?.isActive);
  const live = cart.items.filter(isLive);
  if (live.length !== cart.items.length) {
    // A dead line's ref did not populate (it is null), so lines are kept by the ids still live.
    const liveProductIds = live.filter((item) => !isHamperLine(item)).map((item) => item.product._id);
    const liveHamperIds = live.filter(isHamperLine).map((item) => item.hamper._id);
    await Cart.updateOne(
      { _id: cart._id },
      {
        $pull: {
          items: {
            $or: [
              { kind: { $ne: 'hamper' }, product: { $nin: liveProductIds } },
              { kind: 'hamper', hamper: { $nin: liveHamperIds } },
            ],
          },
        },
      }
    );
    cart.items = live;
  }
  return cart;
}

/** Adds `line` to `cart`, refusing a new line when the cart already has MAX_LINES. */
function pushLine(cart, line) {
  if (cart.items.length >= MAX_LINES) {
    throw ApiError.conflict('Your cart is full', { code: 'CART_LIMIT' });
  }
  cart.items.push(line);
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

    const line = cart.items.find((item) => lineKeyOf(item) === productLineKey(productId));
    const nextQuantity = (line?.quantity ?? 0) + quantity;
    assertQuantityAllowed(nextQuantity, product.stock);

    if (line) line.quantity = nextQuantity;
    else pushLine(cart, { kind: 'product', product: productId, quantity });
    await cart.save();

    return this.getCart(owner);
  },

  async setItemQuantity(owner, productId, quantity) {
    const filter = ownerFilter(owner);
    const cart = filter && (await Cart.findOne(filter));
    const line = cart?.items.find((item) => lineKeyOf(item) === productLineKey(productId));
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
    if (filter) await Cart.updateOne(filter, { $pull: { items: { kind: { $ne: 'hamper' }, product: productId } } });
    return this.getCart(owner);
  },

  /**
   * Adds boxes of a gift hamper, to the line when it is already in the cart. Only the hamper and the
   * number of boxes are taken: what is inside is always the hamper's own fixed box.
   */
  async addHamper(owner, hamperId, quantity) {
    const hamper = await findActiveHamper(hamperId);
    const cart = await findOrCreateCart(owner);

    const line = cart.items.find((item) => lineKeyOf(item) === hamperLineKey(hamperId));
    const nextQuantity = (line?.quantity ?? 0) + quantity;
    assertHamperQuantityAllowed(nextQuantity, hamper);

    if (line) line.quantity = nextQuantity;
    else pushLine(cart, { kind: 'hamper', hamper: hamperId, quantity });
    await cart.save();

    return this.getCart(owner);
  },

  async setHamperQuantity(owner, hamperId, quantity) {
    const filter = ownerFilter(owner);
    const cart = filter && (await Cart.findOne(filter));
    const line = cart?.items.find((item) => lineKeyOf(item) === hamperLineKey(hamperId));
    if (!line) throw ApiError.notFound('This item is not in your cart', { code: 'CART_ITEM_NOT_FOUND' });

    assertHamperQuantityAllowed(quantity, await findActiveHamper(hamperId));

    line.quantity = quantity;
    if (owner.guestToken) cart.expiresAt = guestExpiry();
    await cart.save();

    return this.getCart(owner);
  },

  /** Idempotent, like removeItem. */
  async removeHamper(owner, hamperId) {
    const filter = ownerFilter(owner);
    if (filter) await Cart.updateOne(filter, { $pull: { items: { kind: 'hamper', hamper: hamperId } } });
    return this.getCart(owner);
  },

  async clear(owner) {
    const filter = ownerFilter(owner);
    if (filter) await Cart.updateOne(filter, { $set: { items: [] } });
    return { ...EMPTY_CART };
  },

  /**
   * Moves a guest cart into the user's cart on sign-in, then deletes the guest cart. Quantities of a
   * line in both are added together, capped at the stock and MAX_QTY_PER_LINE for a product, or at the
   * hamper's maxQtyPerOrder; out-of-stock and unpublished products are left behind. Safe to call twice:
   * the second call finds no guest cart.
   */
  async mergeGuestCartIntoUser(guestToken, userId) {
    const guestFilter = ownerFilter({ guestToken });
    const guestCart = await loadCart(guestFilter);
    if (!guestCart) return;

    if (guestCart.items.length) {
      const userCart = await findOrCreateCart({ userId });

      for (const guestLine of guestCart.items) {
        const hamperLine = isHamperLine(guestLine);
        const key = lineKeyOf(guestLine);
        const cap = hamperLine
          ? guestLine.hamper.maxQtyPerOrder
          : Math.min(MAX_QTY_PER_LINE, guestLine.product.stock);
        const line = userCart.items.find((item) => lineKeyOf(item) === key);
        const merged = Math.min((line?.quantity ?? 0) + guestLine.quantity, cap);

        if (line) {
          line.quantity = Math.max(line.quantity, merged);
        } else if (merged > 0 && userCart.items.length < MAX_LINES) {
          userCart.items.push(
            hamperLine
              ? { kind: 'hamper', hamper: guestLine.hamper._id, quantity: merged }
              : { kind: 'product', product: guestLine.product._id, quantity: merged }
          );
        }
      }
      await userCart.save();
    }

    await Cart.deleteOne({ _id: guestCart._id });
  },
};

export default cartService;