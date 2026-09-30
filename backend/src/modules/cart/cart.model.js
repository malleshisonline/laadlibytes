import mongoose from 'mongoose';

// _id: false — a line is identified by its product; one product never appears twice in a cart.
const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

/**
 * One cart per signed-in user, or per guest browser. A guest cart is found by the sha256 of its
 * `cartId` cookie and merged into the user's cart on sign-in. No price is stored: name, price,
 * image and stock are always read live from the product, so the cart can never show a stale price.
 */
const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    guestToken: { type: String, select: false },
    items: { type: [cartItemSchema], default: [] },
    // Guest carts only: pushed forward on every write, so an abandoned one is removed by the TTL index.
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.guestToken;
        return ret;
      },
    },
  }
);

// Partial, because a cart has either a user or a guest token, never both.
cartSchema.index({ user: 1 }, { unique: true, partialFilterExpression: { user: { $type: 'objectId' } } });
cartSchema.index({ guestToken: 1 }, { unique: true, partialFilterExpression: { guestToken: { $type: 'string' } } });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Cart = mongoose.model('Cart', cartSchema);

export default Cart;