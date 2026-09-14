import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';

/** Maps known third-party errors onto our ApiError shape. */
function normalizeError(err) {
  if (err instanceof ApiError) return err;

  if (err instanceof ZodError) {
    return ApiError.badRequest('Validation failed', {
      code: 'VALIDATION_ERROR',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      cause: err,
    });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return ApiError.badRequest('Validation failed', {
      code: 'VALIDATION_ERROR',
      details: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
      cause: err,
    });
  }

  if (err instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for "${err.path}"`, { code: 'INVALID_ID', cause: err });
  }

  // Duplicate key
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern ?? err.keyValue ?? {})[0] ?? 'field';
    return ApiError.conflict(`${field} already exists`, { code: 'DUPLICATE_KEY', cause: err });
  }

  if (err?.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Token expired', { code: 'TOKEN_EXPIRED', cause: err });
  }

  if (err?.name === 'JsonWebTokenError') {
    return ApiError.unauthorized('Invalid token', { code: 'INVALID_TOKEN', cause: err });
  }

  // Bad JSON body from express.json()
  if (err?.type === 'entity.parse.failed') {
    return ApiError.badRequest('Malformed JSON payload', { code: 'INVALID_JSON', cause: err });
  }

  if (err?.type === 'entity.too.large') {
    return new ApiError(StatusCodes.REQUEST_TOO_LONG, 'Payload too large', { code: 'PAYLOAD_TOO_LARGE', cause: err });
  }

  const unknown = ApiError.internal(err?.message || 'Internal server error', { cause: err });
  unknown.isOperational = false;
  unknown.stack = err?.stack ?? unknown.stack;
  return unknown;
}

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity (4 args).
export const errorHandler = (err, req, res, next) => {
  const error = normalizeError(err);
  const isServerError = error.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR;

  const logMeta = {
    method: req.method,
    url: req.originalUrl,
    statusCode: error.statusCode,
    requestId: req.id,
    userId: req.user?.id,
  };

  if (isServerError) logger.error(error.message, { ...logMeta, stack: error.stack });
  else logger.warn(error.message, logMeta);

  const body = {
    success: false,
    message: isServerError && env.isProd ? 'Internal server error' : error.message,
    ...(error.code ? { code: error.code } : {}),
    ...(error.details ? { errors: error.details } : {}),
    requestId: req.id,
  };

  if (!env.isProd && isServerError) body.stack = error.stack;

  res.status(error.statusCode).json(body);
};

export default errorHandler;
