import querystring from 'node:querystring';

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Strips keys that MongoDB treats as operators ($gt, $where) or as paths (a.b),
 * which is how NoSQL injection gets in through user-supplied objects.
 */
export function stripMongoOperators(value, depth = 0) {
  if (depth > 10 || value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) return value.map((item) => stripMongoOperators(item, depth + 1));

  const clean = {};
  for (const [key, val] of Object.entries(value)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    clean[key] = stripMongoOperators(val, depth + 1);
  }
  return clean;
}

/** Sanitises req.body and req.params in place. */
export const sanitizeRequest = (req, _res, next) => {
  if (isPlainObject(req.body) || Array.isArray(req.body)) req.body = stripMongoOperators(req.body);
  if (isPlainObject(req.params)) {
    for (const [key, val] of Object.entries(stripMongoOperators(req.params))) req.params[key] = val;
  }
  next();
};

/**
 * req.query is a lazily-parsed getter in Express 5 and cannot be reassigned,
 * so query strings are cleaned at parse time instead: app.set('query parser', sanitizedQueryParser)
 */
export const sanitizedQueryParser = (str) => stripMongoOperators(querystring.parse(str));

export default sanitizeRequest;
