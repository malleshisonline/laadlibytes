import { sendCreated, sendNoContent, sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

import { productService } from './product.service.js';

export const productController = {
  list: asyncHandler(async (req, res) => {
    const { items, meta } = await productService.list(req.validatedQuery ?? {}, req.user ?? null);
    sendResponse(res, { message: 'Products fetched successfully', data: items, meta });
  }),

  getByIdOrSlug: asyncHandler(async (req, res) => {
    const product = await productService.getByIdOrSlug(req.params.idOrSlug, req.user ?? null);
    sendResponse(res, { message: 'Product fetched successfully', data: product });
  }),

  /** Admin list. Same service call; the schema defaults includeInactive to true. */
  adminList: asyncHandler(async (req, res) => {
    const { items, meta } = await productService.list(req.validatedQuery ?? {}, req.user);
    sendResponse(res, { message: 'Products fetched successfully', data: items, meta });
  }),

  /** Admin detail. Same lookup, plus the audit fields the storefront never sees. */
  adminGetByIdOrSlug: asyncHandler(async (req, res) => {
    const product = await productService.getByIdOrSlug(req.params.idOrSlug, req.user, { withAudit: true });
    sendResponse(res, { message: 'Product fetched successfully', data: product });
  }),

  create: asyncHandler(async (req, res) => {
    // Files were already uploaded by uploadProductImagesToCloudinary; only their URLs travel on.
    const product = await productService.create(req.body, req.uploadedCloudinaryImages, req.user.id);
    sendCreated(res, product, 'Product created successfully');
  }),

  update: asyncHandler(async (req, res) => {
    const product = await productService.update(
      req.params.id,
      req.body,
      req.uploadedCloudinaryImages,
      req.user.id
    );
    sendResponse(res, { message: 'Product updated successfully', data: product });
  }),

  remove: asyncHandler(async (req, res) => {
    await productService.remove(req.params.id, req.user.id);
    sendNoContent(res);
  }),
};

export default productController;