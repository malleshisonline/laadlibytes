import { sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { newGuestToken, readGuestToken, setCartCookie } from '../../utils/cartCookie.js';

import { cartService } from './cart.service.js';

/** A signed-in caller always uses their own cart; a guest uses the cart named by the `cartId` cookie. */
const readOwner = (req) => (req.user ? { userId: req.user.id } : { guestToken: readGuestToken(req) });

/** Like readOwner, but gives a guest a cart cookie when they have none, and extends it on every write. */
const writeOwner = (req, res) => {
  if (req.user) return { userId: req.user.id };

  const guestToken = readGuestToken(req) ?? newGuestToken();
  setCartCookie(res, guestToken);
  return { guestToken };
};

export const cartController = {
  get: asyncHandler(async (req, res) => {
    const cart = await cartService.getCart(readOwner(req));
    sendResponse(res, { message: 'Cart fetched successfully', data: cart });
  }),

  addItem: asyncHandler(async (req, res) => {
    const cart = await cartService.addItem(writeOwner(req, res), req.body.productId, req.body.quantity);
    sendResponse(res, { message: 'Added to cart', data: cart });
  }),

  updateItem: asyncHandler(async (req, res) => {
    const cart = await cartService.setItemQuantity(writeOwner(req, res), req.params.productId, req.body.quantity);
    sendResponse(res, { message: 'Cart updated', data: cart });
  }),

  removeItem: asyncHandler(async (req, res) => {
    const cart = await cartService.removeItem(readOwner(req), req.params.productId);
    sendResponse(res, { message: 'Removed from cart', data: cart });
  }),

  clear: asyncHandler(async (req, res) => {
    const cart = await cartService.clear(readOwner(req));
    sendResponse(res, { message: 'Cart cleared', data: cart });
  }),
};

export default cartController;