import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/token.js';

import { User } from '../modules/user/user.model.js';

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return req.cookies?.accessToken ?? null;
};

/** Rejects the request unless a valid access token is present. */
export const authenticate = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next(ApiError.unauthorized('Authentication token missing'));

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    return next(err); // errorHandler maps JWT errors to 401
  }

  if (!(await User.exists({ _id: payload.sub }))) {
    return next(ApiError.unauthorized('Authentication token is no longer valid'));
  }
  req.user = { id: payload.sub, role: payload.role };
  return next();
};

/** Attaches req.user when a token is present, but never blocks the request. */
export const optionalAuth = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    // ignore: the route is public
    return next();
  }
  if (await User.exists({ _id: payload.sub })) req.user = { id: payload.sub, role: payload.role };
  return next();
};

/**
 * Like optionalAuth, but a token that is present and fails (usually expired) is a 401 instead of being
 * ignored. For routes whose answer depends on who is asking, such as the cart: ignoring an expired
 * token would quietly serve a signed-in user the guest cart, whereas the 401 makes the client refresh and retry.
 */
export const optionalAuthStrict = async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    return next(err); // errorHandler maps JWT errors to 401
  }

  if (!(await User.exists({ _id: payload.sub }))) {
    return next(ApiError.unauthorized('Authentication token is no longer valid'));
  }
  req.user = { id: payload.sub, role: payload.role };
  return next();
};

/** Role gate. Use after authenticate: authorize('admin') */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required'));
    if (roles.length && !roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    return next();
  };

export default authenticate;
