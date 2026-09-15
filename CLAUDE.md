# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layout

Only `backend/` exists so far — an Express 5 + MongoDB API. There is no root `package.json`; **run every command from `backend/`**. A React/Vite frontend is planned (hence the default `CORS_ORIGIN=http://localhost:5173`) but not yet created.

## Commands

```bash
cd backend
npm run dev          # nodemon, http://localhost:5000/api
npm start            # production
npm test             # jest (ESM) + supertest, NODE_ENV=test, --runInBand
npm test -- tests/unit/foo.test.js     # single file
npm test -- -t "rejects expired token" # single test by name
```

Node ≥ 20 and `"type": "module"` — **relative imports need the explicit `.js` extension**.

`npm run lint` / `npm run format` are declared but currently fail: there is no `eslint.config.js` (ESLint 10 requires a flat config) and no Prettier config. Add them before relying on either script.

`backend/tests/{unit,integration,fixtures}/` are empty scaffolding. `app.js` exports the app without listening, so integration tests can `supertest(app)` directly.

## Request lifecycle

`src/server.js` (connect DB, listen, graceful shutdown on SIGTERM/SIGINT/unhandled rejection) → `src/app.js` (helmet, cors, body parsers, hpp, sanitize, compression, requestId, morgan) → `app.use(env.API_PREFIX, apiLimiter, apiRoutes)` → `src/routes/index.js` → a feature module. `notFound` and `errorHandler` must stay last in `app.js`.

## Adding a feature module

Each feature is one directory under `src/modules/<name>/` with up to five files:

| File | Role |
| --- | --- |
| `<name>.routes.js` | Router; composes `authenticate` / `authorize(...)` / `validate({...})` per route |
| `<name>.controller.js` | Exported object of `asyncHandler`-wrapped handlers; formats the response only |
| `<name>.service.js` | All Mongoose access and business rules; throws `ApiError` |
| `<name>.model.js` | Mongoose schema |
| `<name>.validation.js` | Zod schemas |

Then add one line to the `routes` array in `src/routes/index.js`. **Controllers never touch Mongoose** — see `src/modules/user/` for the reference implementation.

Most module directories (`product`, `cart`, `order`, …) are empty `.gitkeep` placeholders; `product.model.js`, `category.model.js` and `order.model.js` exist but are zero-byte stubs. Only `auth` and `user` are implemented.

## Conventions

**Responses** — always via `src/utils/ApiResponse.js`: `sendResponse(res, { statusCode, message, data, meta })`, `sendCreated`, `sendNoContent`. Success is always `{ success, message, data, meta? }`; errors are always `{ success: false, message, code?, errors?, requestId }`.

**Errors** — throw `ApiError.notFound(...)` / `.conflict(...)` / `.unauthorized(...)` etc. from services. `errorHandler` normalizes Zod, Mongoose validation/cast, duplicate-key (11000), JWT, and body-parser errors into that shape. Anything that isn't an `ApiError` is treated as a bug: `isOperational = false`, message hidden in production, stack included outside it.

**Validation** — `validate({ body, params, query })` replaces `req.body` and `req.params` with the parsed result. Express 5 makes `req.query` read-only, so parsed query params land on **`req.validatedQuery`** — read that, not `req.query`, in list handlers. Query strings are also stripped of Mongo operators at parse time by `sanitizedQueryParser` (registered with `app.set('query parser', ...)`), and `sanitizeRequest` does the same for body/params.

**Config** — never read `process.env` directly. Import the frozen, zod-validated `env` from `src/config/env.js`; it loads `.env.<NODE_ENV>` then `.env`, and exits the process on invalid config. Adding a variable means adding it to the zod schema and to `.env.example`.

**Logging** — `logger` from `src/config/logger.js` (winston; morgan bridged through `logger.stream`). Every request gets `req.id`, echoed as the `X-Request-Id` header and included in error responses and log lines. Console output and rate limiters are disabled when `NODE_ENV=test`.

**Pagination** — `getPagination(query)` and `buildMeta({ page, limit, total })` from `src/utils/pagination.js`; pass the result as the `meta` field.

**Models** — `{ timestamps: true }`; a `toJSON` transform maps `_id` → `id` and drops `__v` plus secrets. Sensitive fields use `select: false` (`password`, `refreshTokens`) and must be explicitly `.select('+password')`-ed when needed. Enum value arrays are exported as constants from the model and reused by Zod: `export const USER_ROLES = [...]` → `z.enum(USER_ROLES)`. The shared `objectIdSchema` currently lives in `user.validation.js`.

**Style** — every module has a named export *plus* a matching `export default` of the same binding. Imports are grouped node builtins (`node:` prefix) → third-party → local, blank-line separated. Routes mount under `env.API_PREFIX` with **no version segment** — there is no `/api/v1`.

## Auth

Access token is returned in the JSON body (client holds it in memory); the refresh token goes in an httpOnly `refreshToken` cookie. Refresh tokens are stored as sha256 hashes on the user document, rotated on every refresh, and capped at 5 concurrent sessions (`MAX_SESSIONS` in `auth.service.js`). Both tokens carry `issuer: 'laadlibytes-api'`.

Route guards from `src/middlewares/authenticate.js`: `authenticate` (required), `optionalAuth` (attaches `req.user` if present), `authorize('admin')` (role gate, use after `authenticate`). `req.user` is `{ id, role }`.



## Working rules

- IMPORTANT: never commit .env. Only variable names go in .env.example.
- Do not create new top-level folders without asking me first.
- Do not run git add, git commit or git push. I handle git myself.
- Never start with new feature implementation untill the previous is commited and tree is clean
- Show me a plan before changing more than one file.