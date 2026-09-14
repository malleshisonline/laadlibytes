import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/token.js';

const extractToken = (req) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  return req.cookies?.accessToken ?? null;
};

/** Rejects the request unless a valid access token is present. */
export const authenticate = (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next(ApiError.unauthorized('Authentication token missing'));

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    return next(err); // errorHandler maps JWT errors to 401
  }
};

/** Attaches req.user when a token is present, but never blocks the request. */
export const optionalAuth = (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // ignore: the route is public
  }
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
