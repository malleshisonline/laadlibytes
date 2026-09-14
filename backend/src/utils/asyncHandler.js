/**
 * Wraps an async route handler so rejected promises reach the error middleware.
 * Express 5 forwards rejections on its own, but this keeps the behaviour explicit
 * and works the same for handlers mounted outside the router.
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
