import { StatusCodes } from 'http-status-codes';

/**
 * Operational error: something we anticipated and can safely report to the client.
 * Anything thrown that is NOT an ApiError is treated as a bug and hidden in production.
 */
export class ApiError extends Error {
  constructor(statusCode, message, { details = null, code = null, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request', options) {
    return new ApiError(StatusCodes.BAD_REQUEST, message, options);
  }

  static unauthorized(message = 'Unauthorized', options) {
    return new ApiError(StatusCodes.UNAUTHORIZED, message, options);
  }

  static forbidden(message = 'Forbidden', options) {
    return new ApiError(StatusCodes.FORBIDDEN, message, options);
  }

  static notFound(message = 'Resource not found', options) {
    return new ApiError(StatusCodes.NOT_FOUND, message, options);
  }

  static conflict(message = 'Resource already exists', options) {
    return new ApiError(StatusCodes.CONFLICT, message, options);
  }

  static tooMany(message = 'Too many requests', options) {
    return new ApiError(StatusCodes.TOO_MANY_REQUESTS, message, options);
  }

  static internal(message = 'Internal server error', options) {
    return new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, message, options);
  }
}

export default ApiError;
