import { StatusCodes } from 'http-status-codes';

/**
 * Single success envelope so every endpoint answers in the same shape:
 * { success, message, data, meta? }
 */
export function sendResponse(res, { statusCode = StatusCodes.OK, message = 'Success', data = null, meta } = {}) {
  const body = { success: true, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

export const sendCreated = (res, data, message = 'Created successfully') =>
  sendResponse(res, { statusCode: StatusCodes.CREATED, message, data });

export const sendNoContent = (res) => res.status(StatusCodes.NO_CONTENT).send();

export default sendResponse;
