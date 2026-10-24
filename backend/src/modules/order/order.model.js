import mongoose from 'mongoose';

import { INDIAN_STATES } from '../address/address.model.js';
import { PACK_UNITS } from '../product/product.model.js';

// The delivery journey stays separate from the verified payment status.
export const ORDER_STATUSES = ['placed', 'packed', 'shipped', 'delivered'];

// Admins move paid orders forward one delivery step at a time.
export const ORDER_STATUS_TRANSITIONS = Object.freeze({
  placed: ['packed'],
  packed: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
});

// No 'refunded': there are no refunds.
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed'];

export const ORDER_HISTORY_EVENTS = ['status', 'payment'];

// _id: false: a line is a copy of the product as it was sold, not an entity of its own. Editing
// or unpublishing the product later never changes what this order says was bought.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    slug: { type: String, trim: true },
    packSize: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: PACK_UNITS },
    },
    image: {
      url: { type: String, trim: true },
      alt: { type: String, trim: true },
    },
    // Whole rupees, as on Product.
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// A copy of the saved address at the moment of ordering; see the note in address.model.js.
const orderAddressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true }, // E.164
    pincode: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    landmark: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, enum: INDIAN_STATES },
  },
  { _id: false }
);

// One entry per status or payment change. `by` and `note` are for admins; customers see only
// what changed and when (order.service.js leaves the other two out of their reads).
const orderHistorySchema = new mongoose.Schema(
  {
    event: { type: String, enum: ORDER_HISTORY_EVENTS, required: true },
    value: { type: String, required: true },
    note: { type: String, trim: true, maxlength: 500 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * One order. Delivery is free on every order, so there is deliberately no shippingCharge:
 * total is the sum of the lines.
 *
 * The document is created when checkout opens, so it can hold the stock and the Razorpay order, but
 * until `paymentStatus` is 'paid' it is only a checkout: customers and admins never see it
 * (PLACED_ORDER in order.service.js).
 */
const orderSchema = new mongoose.Schema(
  {
    // What the customer and the shop quote, e.g. LB-20261003-7K3QX.
    orderNumber: { type: String, required: true, uppercase: true, trim: true },
    // Empty for a guest order: the guest's details live in `address` and `contact`.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // A guest order's guest customer (User.isGuest), found by phone. Empty when that phone belongs to a
    // registered account. Signing up with the phone moves the order to `user` (auth.service.js).
    guestCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: {
      type: [orderItemSchema],
      validate: [(items) => items.length > 0, 'An order needs at least one item'],
    },
    address: { type: orderAddressSchema, required: true },
    // Phone-only users have no email and email-only users have no phone; the address phone is
    // always there, so it is the contact number.
    contact: {
      phone: { type: String, required: true, trim: true },
      email: { type: String, lowercase: true, trim: true, default: null },
    },
    itemCount: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    mrpTotal: { type: Number, required: true, min: 0 },
    savings: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    // UPI transaction id or gateway payment id, whichever confirmed the payment.
    paymentReference: { type: String, trim: true, maxlength: 100 },
    paidAt: { type: Date, default: null },
    razorpayOrderId: { type: String, trim: true, select: false },
    checkoutKey: { type: String, trim: true, select: false },
    checkoutUsesCart: { type: Boolean, default: false, select: false },
    // sha256 of the guest's `cartId` cookie, for a guest cart order: the paid lines leave that cart.
    guestCartToken: { type: String, select: false },
    // An unpaid checkout whose stock was put back after it was abandoned. A payment that still
    // arrives later takes the stock again (order.service.js markPaymentPaid).
    stockReleased: { type: Boolean, default: false, select: false },
    history: { type: [orderHistorySchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

orderSchema.index({ orderNumber: 1 }, { unique: true });
// A customer's own list, newest first.
orderSchema.index({ user: 1, createdAt: -1 });
// The admin list filtered by status, newest first.
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index(
  { user: 1, checkoutKey: 1 },
  { unique: true, partialFilterExpression: { checkoutKey: { $type: 'string' } } }
);
orderSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
// A guest customer's orders, moved to `user` when they sign up.
orderSchema.index({ guestCustomer: 1 }, { sparse: true });

export const Order = mongoose.model('Order', orderSchema);

export default Order;
