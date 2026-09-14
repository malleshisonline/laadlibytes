import { ApiError } from '../utils/ApiError.js';

/**
 * Validates and REPLACES req.body / req.params with the parsed result, so
 * controllers only ever see coerced, stripped data.
 * req.query is read-only in Express 5, so its parsed value is exposed as req.validatedQuery.
 *
 *   router.post('/', validate({ body: createUserSchema }), controller.create)
 */
export const validate = (schemas) => (req, _res, next) => {
  const issues = [];

  for (const source of ['body', 'params', 'query']) {
    const schema = schemas[source];
    if (!schema) continue;

    const result = schema.safeParse(req[source]);

    if (!result.success) {
      issues.push(
        ...result.error.issues.map((i) => ({
          field: [source, ...i.path].join('.'),
          message: i.message,
        }))
      );
      continue;
    }

    if (source === 'query') req.validatedQuery = result.data;
    else req[source] = result.data;
  }

  if (issues.length) {
    return next(ApiError.badRequest('Validation failed', { code: 'VALIDATION_ERROR', details: issues }));
  }

  return next();
};

export default validate;
