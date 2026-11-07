import crypto from 'node:crypto';

import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { sendEmail } from '../../integrations/email/index.js';
import { orderReceivedEmail } from '../../templates/email/orderReceived.js';
import { ApiError } from '../../utils/ApiError.js';
import { deliveryDateFrom, deliveryDaysFor } from '../../utils/deliveryEstimate.js';
import { buildMeta, getPagination } from '../../utils/pagination.js';
import { Address } from '../address/address.model.js';
import { addressService } from '../address/address.service.js';
import { Cart } from '../cart/cart.model.js';
import { isHamperLine } from '../cart/cart.service.js';
import { couponService } from '../coupon/coupon.service.js';
import { giftHamperService } from '../giftHamper/giftHamper.service.js';
import { Product } from '../product/product.model.js';
import { User } from '../user/user.model.js';
import { userService } from '../user/user.service.js';

import { Order, ORDER_STATUS_TRANSITIONS } from './order.model.js';

// 32 characters with no 0/O or 1/I, so a number read out over the phone is never ambiguous.
// 32 divides 256, so `byte % 32` picks each character with the same chance.
const ORDER_NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ORDER_NUMBER_SUFFIX_LENGTH = 5;
const ORDER_NUMBER_ATTEMPTS = 5;

const PRODUCT_FIELDS = 'name slug sku price mrp packSize images stock isActive';

const ORDER_SORT_MAP = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
};

// Only a paid order is placed. Before that the document is a checkout holding stock, and customers
// and admins never see it: every read below that serves them filters on this.
const PLACED_ORDER = Object.freeze({ paymentStatus: 'paid' });

const CHECKOUT_FIELDS = '+razorpayOrderId +checkoutUsesCart +guestCartToken +stockReleased +couponId';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 404 for another user's order too, so the response never reveals that it exists.
const orderNotFound = () => ApiError.notFound('Order not found', { code: 'ORDER_NOT_FOUND' });

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * Whose order it is. `owner` is `{ userId }` for a signed-in customer, or `{ guestCheckoutKey }` for a
 * guest: a guest order has no user, and only the browser holding its random checkoutKey can reach it.
 */
function ownerFilter({ userId, guestCheckoutKey }) {
  if (userId) return { user: userId };
  if (guestCheckoutKey) return { user: null, checkoutKey: guestCheckoutKey };
  throw new Error('An order owner needs a userId or a guestCheckoutKey');
}

/** The cart an order's lines came from: the user's, or the guest cart found by its hashed cookie. */
function cartFilterOf(order) {
  if (order.user) return { user: order.user };
  if (order.guestCartToken) return { guestToken: order.guestCartToken };
  return null;
}

const orderChanged = () =>
  ApiError.conflict('This order was just changed by someone else. Reload it and try again.', { code: 'ORDER_CHANGED' });

/** Today's date in India as YYYYMMDD, so an order placed at 1 a.m. IST carries that day's date. */
function indiaDateStamp() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(new Date())
    .replaceAll('-', '');
}

/** e.g. LB-20261003-7K3QX. Unique by index; placeOrder retries on the rare collision. */
function generateOrderNumber() {
  const suffix = Array.from(crypto.randomBytes(ORDER_NUMBER_SUFFIX_LENGTH), (byte) => ORDER_NUMBER_ALPHABET[byte % 32]).join('');
  return `LB-${indiaDateStamp()}-${suffix}`;
}

/** What a customer sees: who changed the order and the admin's notes stay with the shop. */
function toCustomerView(order) {
  const view = order.toJSON();
  view.history = view.history.map(({ event, value, at }) => ({ event, value, at }));
  delete view.user;
  delete view.guestCustomer;
  delete view.razorpayOrderId;
  delete view.checkoutKey;
  delete view.checkoutUsesCart;
  delete view.guestCartToken;
  delete view.stockReleased;
  delete view.couponId;
  return view;
}

/**
 * The lines to order, each with its live product or gift hamper. Buy Now orders one product and ignores
 * the cart; otherwise it is the cart, minus products and hampers that were unpublished since they were
 * added (the cart page already hides those, so the shopper never saw them).
 */
async function resolveLines(cartFilter, buyNow) {
  if (buyNow) {
    const product = await Product.findOne({ _id: buyNow.productId, isActive: true }).select(PRODUCT_FIELDS).lean();
    if (!product) throw ApiError.notFound('Product not found', { code: 'PRODUCT_NOT_FOUND' });
    return [{ kind: 'product', product, quantity: buyNow.quantity }];
  }

  const cart = cartFilter ? await Cart.findOne(cartFilter).lean() : null;
  const cartItems = cart?.items ?? [];
  const productIds = cartItems.filter((item) => !isHamperLine(item)).map((item) => item.product);
  const hamperIds = cartItems.filter(isHamperLine).map((item) => item.hamper);

  const [products, hampersById] = await Promise.all([
    Product.find({ _id: { $in: productIds }, isActive: true }).select(PRODUCT_FIELDS).lean(),
    giftHamperService.findActiveByIds(hamperIds),
  ]);
  const productsById = new Map(products.map((product) => [product._id.toString(), product]));

  const lines = cartItems
    .map((item) =>
      isHamperLine(item)
        ? { kind: 'hamper', hamper: hampersById.get(item.hamper.toString()), quantity: item.quantity }
        : { kind: 'product', product: productsById.get(item.product.toString()), quantity: item.quantity }
    )
    .filter((line) => line.product || line.hamper);

  if (!lines.length) throw ApiError.badRequest('Your cart is empty', { code: 'CART_EMPTY' });

  // Made to order, so there is no stock to run out: only the hamper's own per-order cap.
  const overCap = lines.find((line) => line.kind === 'hamper' && line.quantity > line.hamper.maxQtyPerOrder);
  if (overCap) {
    throw ApiError.conflict(`You can order at most ${overCap.hamper.maxQtyPerOrder} boxes of ${overCap.hamper.name} online`, {
      code: 'CART_LIMIT',
    });
  }
  return lines;
}

/** The order's copy of a hamper line. Its price is the hamper's own, read from the database. */
function toHamperOrderItem({ hamper, quantity }) {
  const image = hamper.images?.[0];
  return {
    kind: 'hamper',
    hamper: hamper._id,
    name: hamper.name,
    sku: hamper.code,
    slug: hamper.slug,
    packSize: { value: hamper.netWeightGrams, unit: 'g' },
    image: image ? { url: image.url, alt: image.alt } : undefined,
    price: hamper.price,
    mrp: hamper.price,
    quantity,
    lineTotal: hamper.price * quantity,
  };
}

function toOrderItem(line) {
  if (line.kind === 'hamper') return toHamperOrderItem(line);
  const { product, quantity } = line;
  const image = product.images?.[0];
  return {
    kind: 'product',
    product: product._id,
    name: product.name,
    sku: product.sku,
    slug: product.slug,
    packSize: product.packSize,
    image: image ? { url: image.url, alt: image.alt } : undefined,
    price: product.price,
    mrp: product.mrp,
    quantity,
    lineTotal: product.price * quantity,
  };
}

const subtotalOf = (items) => items.reduce((sum, item) => sum + item.lineTotal, 0);

function totalsOf(items, discount = 0) {
  const subtotal = subtotalOf(items);
  const mrpTotal = items.reduce((sum, item) => sum + Math.max(item.mrp, item.price) * item.quantity, 0);
  return {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    mrpTotal,
    savings: mrpTotal - subtotal,
    discount,
    // Delivery is free on every order, so the total is the subtotal less the coupon discount.
    total: subtotal - discount,
  };
}

/** The order's copy of the coupon, so editing or deleting it later never changes the order. */
function couponCopy(coupon) {
  return { code: coupon.code, type: coupon.type, value: coupon.value, maxDiscount: coupon.maxDiscount ?? null };
}

/** Gives back the coupon use an unpaid checkout held, if it had a coupon. */
async function releaseCouponOf(order) {
  if (order.couponId) await couponService.release(order.couponId);
}

/**
 * An order's lines that hold stock, as `[{ productId, quantity }]`. Gift hampers are made to order, so
 * their lines never take stock and never give any back.
 */
const stockLinesOf = (items) =>
  items.filter((item) => !isHamperLine(item)).map((item) => ({ productId: item.product, quantity: item.quantity }));

/** Puts stock back when a later line could not be reserved or checkout setup fails. */
function releaseStock(lines) {
  return Promise.all(
    lines.map(({ productId, quantity }) => Product.updateOne({ _id: productId }, { $inc: { stock: quantity } }))
  );
}

async function stockError(productId, fallbackName) {
  const product = await Product.findById(productId).select('name stock isActive').lean();
  const name = product?.name ?? fallbackName;
  const detail = (message) => [{ field: `items.${productId}`, message }];

  if (!product?.isActive) {
    const message = `${name} is no longer available`;
    return ApiError.conflict(message, { code: 'PRODUCT_UNAVAILABLE', details: detail(message) });
  }
  const message = product.stock > 0 ? `Only ${product.stock} left of ${name}` : `${name} is out of stock`;
  return ApiError.conflict(message, { code: 'INSUFFICIENT_STOCK', details: detail(message) });
}

/**
 * Takes the stock for every line, or none of it. Each decrement only matches while enough is left, so
 * two shoppers racing for the last pack cannot both get it, and no MongoDB transaction is needed: when
 * a line fails, the lines already taken are put back before the error is thrown. Hamper lines are
 * skipped: they are made to order.
 */
async function reserveStock(lines) {
  const reserved = [];
  for (const { product, quantity } of lines.filter((line) => line.kind !== 'hamper')) {
    const { modifiedCount } = await Product.updateOne(
      { _id: product._id, isActive: true, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } }
    );
    if (modifiedCount === 0) {
      await releaseStock(reserved);
      throw await stockError(product._id, product.name);
    }
    reserved.push({ productId: product._id, quantity });
  }
  return reserved;
}

/**
 * A payment arrived for a checkout whose stock was already put back. The money is taken, so the order
 * stands either way: each line takes its stock again where enough is left, and a short line is
 * logged for the shop to handle rather than refusing the paid order.
 */
async function retakeReleasedStock(order) {
  for (const { product, quantity, name } of order.items.filter((item) => !isHamperLine(item))) {
    const { modifiedCount } = await Product.updateOne(
      { _id: product, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } }
    );
    if (modifiedCount === 0) {
      logger.error('A late payment arrived after the stock was released, and the stock is now short', {
        orderNumber: order.orderNumber,
        product: name,
        quantity,
      });
    }
  }
  if (order.couponId) await couponService.retake(order.couponId, order.orderNumber);
  await Order.updateOne({ _id: order._id }, { $set: { stockReleased: false } });
}

/**
 * Prices the lines, takes the stock and saves the order, or saves nothing and puts the stock back.
 * Shared by signed-in and guest orders; `fields` is everything else on the order.
 *
 * With a `couponCode` the discount is worked out here, on the server, and one use of the coupon is
 * taken before the stock, then given back with it if anything later fails. Without one, nothing
 * about the order changes. `customer` (`{ userId, phone }`) is who the per-customer limit counts; it is
 * checked again once the order is saved, and an order past it is deleted and given back like a failed one.
 */
async function createOrder(lines, fields, { couponCode, customer } = {}) {
  const items = lines.map(toOrderItem);

  let applied = null;
  if (couponCode) {
    applied = await couponService.evaluate(couponCode, subtotalOf(items), customer);
    await couponService.reserve(applied.coupon._id);
  }
  const couponFields = applied ? { coupon: couponCopy(applied.coupon), couponId: applied.coupon._id } : {};
  const totals = totalsOf(items, applied?.discount ?? 0);
  // A mixed order waits for its slowest made-to-order hamper.
  const leadTimeDays = Math.max(0, ...lines.filter((line) => line.kind === 'hamper').map((line) => line.hamper.leadTimeDays ?? 0));
  const deliveryDays = deliveryDaysFor(fields.address.pincode, leadTimeDays);

  let reserved;
  try {
    reserved = await reserveStock(lines);
  } catch (error) {
    if (applied) await couponService.release(applied.coupon._id);
    throw error;
  }

  let order;
  try {
    order = await createWithUniqueNumber({ ...fields, items, ...totals, ...couponFields, deliveryDays });
  } catch (error) {
    await releaseStock(reserved);
    if (applied) await couponService.release(applied.coupon._id);
    throw error;
  }

  // Two checkouts by one customer at once both passed `evaluate`; only the earliest are kept.
  if (applied && !(await couponService.isWithinCustomerLimit(applied.coupon, customer, order._id))) {
    await Order.deleteOne({ _id: order._id });
    await releaseStock(reserved);
    await couponService.release(applied.coupon._id);
    throw couponService.customerLimitError();
  }
  return order;
}

/**
 * The gift hamper fields for an order with a hamper line: the buyer must have accepted the hamper terms
 * (made to order, no returns), and the gift message and recipient are kept. An order without a hamper
 * gets none of them, so every other order is saved exactly as before.
 */
function giftFieldsFor(lines, { giftMessage, recipientName, termsAccepted }) {
  if (!lines.some((line) => line.kind === 'hamper')) return {};
  if (termsAccepted !== true) {
    throw ApiError.badRequest('Please accept the gift hamper terms to place this order', {
      code: 'TERMS_NOT_ACCEPTED',
      details: [{ field: 'termsAccepted', message: 'Accept the gift hamper terms to continue' }],
    });
  }
  return {
    termsAcceptedAt: new Date(),
    ...(giftMessage ? { giftMessage } : {}),
    ...(recipientName ? { recipientName } : {}),
  };
}

/** The order's copy of an address: editing or deleting the saved one later never changes it. */
function addressCopy(address) {
  return {
    name: address.name,
    phone: address.phone,
    pincode: address.pincode,
    line1: address.line1,
    line2: address.line2,
    landmark: address.landmark,
    city: address.city,
    state: address.state,
  };
}

/**
 * Saves a guest order's buyer as a guest customer with the delivery address, so the admin has them
 * under Customers. Best-effort: the order is already placed, so a failure here is logged, never thrown.
 */
async function recordGuestCustomerFor(order) {
  try {
    const { address, contact } = order;
    const guestCustomerId = await userService.recordGuestCustomer({
      name: address.name,
      phone: contact.phone,
      email: contact.email,
    });
    if (!guestCustomerId) return;

    await Order.updateOne({ _id: order._id }, { $set: { guestCustomer: guestCustomerId } });
    order.guestCustomer = guestCustomerId;
    await addressService.saveGuestAddress(guestCustomerId, address);
  } catch (error) {
    logger.error('Could not save the guest customer for an order', { orderId: order.id, message: error.message });
  }
}

/**
 * Emails the shop about a newly paid order. Best-effort and not awaited by the caller: the payment is
 * already recorded, so a slow or failing mail server must never delay or fail the customer's confirmation.
 */
async function notifyOrderReceived(order) {
  const to = env.ORDER_NOTIFY_EMAIL ?? env.ENQUIRY_NOTIFY_EMAIL;
  if (!to) {
    logger.warn('ORDER_NOTIFY_EMAIL and ENQUIRY_NOTIFY_EMAIL are not set; nobody was told about a paid order', {
      orderNumber: order.orderNumber,
    });
    return;
  }
  try {
    await sendEmail({ to, ...orderReceivedEmail(order) });
  } catch (error) {
    logger.error('Order notification email failed', { orderNumber: order.orderNumber, error: error.message });
  }
}

async function createWithUniqueNumber(payload) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await Order.create({ ...payload, orderNumber: generateOrderNumber() });
    } catch (error) {
      const isNumberCollision = error?.code === 11000 && error.keyPattern?.orderNumber;
      if (!isNumberCollision || attempt >= ORDER_NUMBER_ATTEMPTS) throw error;
    }
  }
}

/** Data access + business rules. Controllers stay free of Mongoose. */
export const orderService = {
  /**
   * Places an order for the signed-in user: checks the address is theirs, prices every line live,
   * takes the stock and saves a copy of the products and the address. Cart-order lines are removed
   * after payment is verified; a Buy Now order leaves the cart alone.
   */
  async placeOrder(userId, { addressId, buyNow, checkoutKey, couponCode, ...gift }, { deferCartRemoval = false } = {}) {
    const [address, user] = await Promise.all([
      Address.findOne({ _id: addressId, user: userId }).lean(),
      User.findById(userId).select('email').lean(),
    ]);
    if (!user) throw ApiError.unauthorized('Your account could not be found. Please sign in again.');
    if (!address) throw ApiError.notFound('Address not found', { code: 'ADDRESS_NOT_FOUND' });

    const lines = await resolveLines({ user: userId }, buyNow);
    const order = await createOrder(lines, {
      user: userId,
      address: addressCopy(address),
      contact: { phone: address.phone, email: user.email ?? null },
      checkoutKey,
      checkoutUsesCart: !buyNow,
      ...giftFieldsFor(lines, gift),
      history: [{ event: 'status', value: 'placed', by: userId, at: new Date() }],
    }, { couponCode, customer: { userId, phone: address.phone } });

    if (!buyNow && !deferCartRemoval) {
      await orderService.removeOrderedCartItems(order);
    }

    return toCustomerView(order);
  },

  /**
   * Places an order for a guest, who has no account: the address and email come with the request and
   * are copied onto the order. The buyer is also kept as a guest customer with that address (see
   * recordGuestCustomerFor), while the order itself stays a guest order with no `user`. Without
   * `buyNow` it orders the guest cart named by the `cartId` cookie
   * (`guestCartToken` is the raw cookie value, or null). The cart lines are removed after payment.
   */
  async placeGuestOrder({ address, email, buyNow, checkoutKey, couponCode, ...gift }, guestCartToken) {
    const guestCartHash = guestCartToken ? hashToken(guestCartToken) : null;
    const lines = await resolveLines(guestCartHash ? { guestToken: guestCartHash } : null, buyNow);
    const order = await createOrder(lines, {
      address: addressCopy(address),
      contact: { phone: address.phone, email: email ?? null },
      checkoutKey,
      checkoutUsesCart: !buyNow,
      ...(buyNow ? {} : { guestCartToken: guestCartHash }),
      ...giftFieldsFor(lines, gift),
      history: [{ event: 'status', value: 'placed', at: new Date() }],
    }, { couponCode, customer: { phone: address.phone } });
    await recordGuestCustomerFor(order);
    return toCustomerView(order);
  },

  /** Signed-in orders go through placeOrder, guest orders through placeGuestOrder. */
  async placeFor(owner, payload, guestCartToken) {
    return owner.userId
      ? orderService.placeOrder(owner.userId, payload, { deferCartRemoval: true })
      : orderService.placeGuestOrder(payload, guestCartToken);
  },

  /**
   * What a coupon would take off the cart (or the Buy Now line) right now, for the checkout page.
   * `owner` is `{ userId }` or `{}` for a guest. Takes no use and holds no stock: placing the order
   * checks the code again, so this is only a preview.
   */
  async previewCoupon(owner, { code, buyNow, phone }, guestCartToken) {
    let cartFilter = null;
    if (owner.userId) cartFilter = { user: owner.userId };
    else if (guestCartToken) cartFilter = { guestToken: hashToken(guestCartToken) };

    const lines = await resolveLines(cartFilter, buyNow);
    const subtotal = subtotalOf(lines.map(toOrderItem));
    const { coupon, discount } = await couponService.evaluate(code, subtotal, { userId: owner.userId, phone });
    return {
      ...couponCopy(coupon),
      description: coupon.description ?? null,
      subtotal,
      discount,
      total: subtotal - discount,
    };
  },

  async findCheckout(owner, checkoutKey) {
    return Order.findOne({ ...ownerFilter(owner), checkoutKey }).select('+razorpayOrderId +checkoutKey +stockReleased');
  },

  async attachRazorpayOrder(orderId, owner, razorpayOrderId) {
    return Order.findOneAndUpdate(
      {
        _id: orderId,
        ...ownerFilter(owner),
        status: 'placed',
        paymentStatus: 'pending',
        razorpayOrderId: { $exists: false },
      },
      { $set: { razorpayOrderId } },
      { returnDocument: 'after' }
    ).select('+razorpayOrderId');
  },

  /** Removes a paid cart order's lines from the cart they came from. Needs `user` / `guestCartToken` loaded. */
  async removeOrderedCartItems(order) {
    const cartFilter = cartFilterOf(order);
    const productIds = order.items.filter((item) => !isHamperLine(item)).map((item) => item.product);
    const hamperIds = order.items.filter(isHamperLine).map((item) => item.hamper);
    if (cartFilter && (productIds.length || hamperIds.length)) {
      await Cart.updateOne(cartFilter, {
        $pull: {
          items: {
            $or: [
              { kind: { $ne: 'hamper' }, product: { $in: productIds } },
              { kind: 'hamper', hamper: { $in: hamperIds } },
            ],
          },
        },
      });
    }
  },

  async discardUnpaidCheckout(orderId, owner) {
    const order = await Order.findOneAndDelete({
      _id: orderId,
      ...ownerFilter(owner),
      status: 'placed',
      paymentStatus: 'pending',
    }).select('+couponId');
    if (order) {
      await releaseStock(stockLinesOf(order.items));
      await releaseCouponOf(order);
    }
    return Boolean(order);
  },

  async checkoutForRazorpayOrder(razorpayOrderId) {
    return Order.findOne({ razorpayOrderId }).select(CHECKOUT_FIELDS);
  },

  async getCheckoutFor(owner, orderId) {
    return Order.findOne({ _id: orderId, ...ownerFilter(owner) }).select(CHECKOUT_FIELDS);
  },

  /**
   * Puts back the stock of an unpaid checkout that was abandoned. The document is kept, hidden, so a
   * payment that still arrives later finds its order. Matches at most once, so stock never goes back twice.
   */
  async releaseCheckoutStock(order) {
    const released = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $ne: 'paid' }, stockReleased: { $ne: true } },
      { $set: { stockReleased: true } }
    ).select('+couponId');
    if (released) {
      await releaseStock(stockLinesOf(released.items));
      await releaseCouponOf(released);
    }
    return Boolean(released);
  },

  /** Unpaid checkouts older than `createdBefore` that still hold stock, oldest first. */
  async findAbandonedCheckouts(createdBefore, limit = 50) {
    return Order.find({
      paymentStatus: { $ne: 'paid' },
      stockReleased: { $ne: true },
      razorpayOrderId: { $exists: true },
      createdAt: { $lt: createdBefore },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .select(CHECKOUT_FIELDS);
  },

  async markPaymentPaid(order, paymentId) {
    if (order.paymentStatus === 'paid') {
      if (order.paymentReference === paymentId) {
        return toCustomerView(order);
      }
      throw ApiError.conflict('This order already has a verified payment', { code: 'ORDER_ALREADY_PAID' });
    }

    const now = new Date();
    const history = [{ event: 'payment', value: 'paid', at: now }];

    const updated = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: order.status,
        paymentStatus: { $in: ['pending', 'failed'] },
        razorpayOrderId: order.razorpayOrderId,
      },
      {
        $set: {
          paymentStatus: 'paid',
          paymentReference: paymentId,
          paidAt: now,
          // Counted from payment. A checkout opened before deliveryDays existed falls back to the pincode alone.
          estimatedDeliveryBy: deliveryDateFrom(now, order.deliveryDays ?? deliveryDaysFor(order.address?.pincode)),
        },
        $push: { history: { $each: history } },
      },
      { returnDocument: 'after' }
    ).select('+stockReleased +couponId');
    if (updated) {
      if (updated.stockReleased) await retakeReleasedStock(updated);
      // Only this branch moved the order to paid, so a repeated verify or webhook never emails twice.
      notifyOrderReceived(updated);
      return toCustomerView(updated);
    }

    const latest = await Order.findById(order._id).select('+razorpayOrderId');
    if (latest?.paymentStatus === 'paid' && latest.paymentReference === paymentId) {
      return toCustomerView(latest);
    }
    throw orderChanged();
  },

  async markPaymentFailed(order, paymentId) {
    if (order.paymentStatus === 'paid' || order.paymentStatus === 'failed') return;
    await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: order.status,
        paymentStatus: 'pending',
        razorpayOrderId: order.razorpayOrderId,
      },
      {
        $set: { paymentStatus: 'failed' },
        $push: {
          history: {
            event: 'payment',
            value: 'failed',
            note: `Razorpay payment ${paymentId} failed`,
            at: new Date(),
          },
        },
      }
    );
  },

  /** The signed-in user's own orders, newest first. */
  async listMine(userId, query) {
    const { page, limit, skip } = getPagination(query, 50);
    const filter = { user: userId, ...PLACED_ORDER };

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(ORDER_SORT_MAP.newest).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);

    return { items: orders.map(toCustomerView), meta: buildMeta({ page, limit, total }) };
  },

  async getMine(userId, orderId) {
    const order = await Order.findOne({ _id: orderId, user: userId, ...PLACED_ORDER });
    if (!order) throw orderNotFound();
    return toCustomerView(order);
  },

  /**
   * One order or checkout as its owner sees it: a signed-in customer's own, or a guest's by checkoutKey.
   * Unpaid ones too, because the checkout flow itself reads them; customer-facing reads use getMine.
   */
  async getFor(owner, orderId) {
    const order = await Order.findOne({ _id: orderId, ...ownerFilter(owner) });
    if (!order) throw orderNotFound();
    return toCustomerView(order);
  },

  /** Admin list. Leaves the history out; the detail route has it. */
  async list(query) {
    const { page, limit, skip } = getPagination(query);
    const filter = { ...PLACED_ORDER };

    if (query.status) filter.status = query.status;
    if (query.search) {
      const term = { $regex: escapeRegex(query.search), $options: 'i' };
      filter.$or = [{ orderNumber: term }, { 'address.name': term }, { 'contact.phone': term }, { 'contact.email': term }];
    }

    const [items, total] = await Promise.all([
      Order.find(filter)
        .select('-history')
        .sort(ORDER_SORT_MAP[query.sort] ?? ORDER_SORT_MAP.newest)
        .skip(skip)
        .limit(limit),
      Order.countDocuments(filter),
    ]);

    return { items, meta: buildMeta({ page, limit, total }) };
  },

  /** Admin detail, with the customer and who made each change. */
  async getById(orderId) {
    const order = await Order.findOne({ _id: orderId, ...PLACED_ORDER })
      .populate('user', 'name email phone')
      .populate('guestCustomer', 'name email phone')
      .populate('history.by', 'name');
    if (!order) throw orderNotFound();
    return order;
  },

  /**
   * Moves a paid order one step along ORDER_STATUS_TRANSITIONS.
   * admins clicking at once cannot both move it (or put its stock back twice).
   */
  async updateStatus(orderId, { status, note }, actorId) {
    const order = await Order.findOne({ _id: orderId, ...PLACED_ORDER }).select('status paymentStatus').lean();
    if (!order) throw orderNotFound();

    if (!ORDER_STATUS_TRANSITIONS[order.status]?.includes(status)) {
      throw ApiError.conflict(`An order that is ${order.status} cannot be moved to ${status}`, {
        code: 'INVALID_STATUS_TRANSITION',
      });
    }
    if (status === 'packed' && order.paymentStatus !== 'paid') {
      throw ApiError.conflict('An order cannot be packed until payment is verified', { code: 'PAYMENT_REQUIRED' });
    }

    const updated = await Order.findOneAndUpdate(
      { _id: orderId, status: order.status },
      { $set: { status }, $push: { history: { event: 'status', value: status, note, by: actorId, at: new Date() } } },
      { returnDocument: 'after' }
    );
    if (!updated) throw orderChanged();

    return orderService.getById(orderId);
  },

};

export default orderService;
