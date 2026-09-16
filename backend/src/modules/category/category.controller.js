import { sendCreated, sendNoContent, sendResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

import { categoryService } from './category.service.js';

export const categoryController = {
  list: asyncHandler(async (req, res) => {
    const categories = await categoryService.list(req.validatedQuery ?? {}, req.user ?? null);
    sendResponse(res, { message: 'Categories fetched successfully', data: categories });
  }),

  create: asyncHandler(async (req, res) => {
    const category = await categoryService.create(req.body);
    sendCreated(res, category, 'Category created successfully');
  }),

  update: asyncHandler(async (req, res) => {
    const category = await categoryService.update(req.params.id, req.body);
    sendResponse(res, { message: 'Category updated successfully', data: category });
  }),

  remove: asyncHandler(async (req, res) => {
    await categoryService.remove(req.params.id);
    sendNoContent(res);
  }),
};

export default categoryController;