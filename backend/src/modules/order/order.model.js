import mongoose from 'mongoose';

import { INDIAN_STATES } from '../address/address.model.js';
import { PACK_UNITS } from '../product/product.model.js';

// The delivery journey. Kept apart from the payment status, so whichever gateway (or manual UPI)
// the client chooses only ever has to set paymentStatus.
export const ORDER_STATUSES = ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'voided'];

/**
 * The only moves an admin may make: forward, one step at a time. The shop takes no cancellations,
 * refunds, returns or exchanges, so nothing moves backwards. `voided` is the one exception and is
 * not a cancellation: an admin may void an order that was never paid for, which puts its stock
 * back. order.service.js refuses it once paymentStatus is 'paid'.
 */
export const ORDER_STATUS_TRANSITIONS = Object.freeze({
  placed: ['confirmed', 'voided'],
  confirmed: ['packed', 'voided'],
  packed: ['shipped', 'voided'],
  shipped: ['delivered'],
  delivered: [],
  voided: [],
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
 * One placed order. Delivery is free on every order, so there is deliberately no shippingCharge:
 * total is the sum of the lines.
 */
const orderSchema = new mongoose.Schema(
  {
    // What the customer and the shop quote, e.g. LB-20261003-7K3QX.
    orderNumber: { type: String, required: true, uppercase: true, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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

export const Order = mongoose.model('Order', orderSchema);

export default Order;