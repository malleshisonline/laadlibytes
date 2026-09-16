# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layout

Only `backend/` exists so far — an Express 5 + MongoDB API. There is no root `package.json`; **run every command from `backend/`**. A React/Vite frontend is planned (hence the default `CORS_ORIGIN=http://localhost:5173`) but not yet created.

## Commands

```bash
cd backend
npm run dev          # nodemon, http://localhost:5000/api
npm start            # production
npm run seed         # upsert catalogue from scripts/data/*.json (idempotent)
npm run seed -- --dry-run   # validate the seed files, write nothing
npm run seed -- --fresh     # wipe products + categories first
npm test             # jest (ESM) + supertest, NODE_ENV=test, --runInBand
npm test -- tests/unit/foo.test.js     # single file
npm test -- -t "rejects expired token" # single test by name
```

Node ≥ 20 and `"type": "module"` — **relative imports need the explicit `.js` extension**.

`npm run lint` / `npm run format` are declared but currently fail: there is no `eslint.config.js` (ESLint 10 requires a flat config) and no Prettier config. Add them before relying on either script.

Tests live in `backend/tests/unit` and `backend/tests/integration`. `tests/setup.js` (jest `setupFiles`) sets test secrets and forces the console email/SMS drivers before `env.js` loads, so tests never need a `.env`. Integration tests run against `mongodb-memory-server` (the MongoDB binary downloads on first run) and `supertest(app)` — `app.js` exports the app without listening. Because this is ESM, mock modules with `jest.unstable_mockModule(...)` **before** `await import(...)`-ing the app; see `tests/integration/auth.flow.test.js`, which captures OTP codes that way.

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

Implemented modules: `auth`, `user`, `otp`, `category` and `product`. `otp` has just a model and service (no routes) and is used by `auth`. `category` and `product` are the catalogue pair: `category.service.js` refuses to delete a category that still has products (409 `CATEGORY_NOT_EMPTY`), and `product.service.js` owns the sort whitelist, the id-or-slug detail lookup and the soft delete. The remaining module directories (`cart`, `order`, …) are still empty `.gitkeep` placeholders, and `order.model.js` is a zero-byte stub.

External senders live in `src/integrations/` (`email/`, `sms/`), each choosing a driver from env; message templates live in `src/templates/`.

## Conventions

**Responses** — always via `src/utils/ApiResponse.js`: `sendResponse(res, { statusCode, message, data, meta })`, `sendCreated`, `sendNoContent`. Success is always `{ success, message, data, meta? }`; errors are always `{ success: false, message, code?, errors?, requestId }`.

**Errors** — throw `ApiError.notFound(...)` / `.conflict(...)` / `.unauthorized(...)` etc. from services. `errorHandler` normalizes Zod, Mongoose validation/cast, duplicate-key (11000), JWT, and body-parser errors into that shape. Anything that isn't an `ApiError` is treated as a bug: `isOperational = false`, message hidden in production, stack included outside it.

**Validation** — `validate({ body, params, query })` replaces `req.body` and `req.params` with the parsed result. Express 5 makes `req.query` read-only, so parsed query params land on **`req.validatedQuery`** — read that, not `req.query`, in list handlers. Query strings are also stripped of Mongo operators at parse time by `sanitizedQueryParser` (registered with `app.set('query parser', ...)`), and `sanitizeRequest` does the same for body/params.

**Config** — never read `process.env` directly. Import the frozen, zod-validated `env` from `src/config/env.js`; it loads `.env.<NODE_ENV>` then `.env`, and exits the process on invalid config. Adding a variable means adding it to the zod schema and to `.env.example`. Provider credentials are checked in the schema's `superRefine`: `EMAIL_PROVIDER=smtp` requires `SMTP_URL`/`EMAIL_FROM`, `SMS_PROVIDER=msg91` requires `MSG91_AUTH_KEY`/`MSG91_OTP_TEMPLATE_ID`, and `console` (logs codes instead of sending) is refused in production. `OTP_SECRET` is required.

**Logging** — `logger` from `src/config/logger.js` (winston; morgan bridged through `logger.stream`). Every request gets `req.id`, echoed as the `X-Request-Id` header and included in error responses and log lines. Console output and rate limiters are disabled when `NODE_ENV=test`.

**Pagination** — `getPagination(query)` and `buildMeta({ page, limit, total })` from `src/utils/pagination.js`; pass the result as the `meta` field.

**Models** — `{ timestamps: true }`; a `toJSON` transform maps `_id` → `id` and drops `__v` plus secrets. Sensitive fields use `select: false` (`password`, `refreshTokens`) and must be explicitly `.select('+password')`-ed when needed. Enum value arrays are exported as constants from the model and reused by Zod: `export const USER_ROLES = [...]` → `z.enum(USER_ROLES)`. Shared Zod primitives live in `src/utils/validators.js` — `objectIdSchema`, `idParamSchema` and `booleanQuerySchema` (query booleans need the last one: `z.coerce.boolean()` turns `'false'` into `true`). `user.validation.js` re-exports `objectIdSchema` for backwards compatibility. Mongoose 9 does not pass `next` to middleware — write hooks as `async function () { ... return; }`. Unique indexes on optional fields must be partial (`partialFilterExpression: { field: { $type: 'string' } }`), as `User.email`/`User.phone` are; `autoIndex` never drops an old index, so changing one means dropping it by hand.

**Style** — every module has a named export *plus* a matching `export default` of the same binding. Imports are grouped node builtins (`node:` prefix) → third-party → local, blank-line separated. Routes mount under `env.API_PREFIX` with **no version segment** — there is no `/api/v1`.

## Auth

Access token is returned in the JSON body (client holds it in memory); the refresh token goes in an httpOnly `refreshToken` cookie. Refresh tokens are stored as sha256 hashes on the user document, rotated on every refresh, and capped at 5 concurrent sessions (`MAX_SESSIONS` in `auth.service.js`). Both tokens carry `issuer: 'laadlibytes-api'`.

Users sign in with one `identifier` that is either an email or an Indian mobile number. `parseIdentifier` (`src/utils/identifier.js`, libphonenumber-js) turns it into `{ channel: 'email' | 'phone', value }`, with emails lowercased and phones in E.164. `identifierSchema` in `auth.validation.js` applies it, so services receive that object, not the raw string. A user has `email` or `phone` (or both), plus `emailVerifiedAt`/`phoneVerifiedAt`. `isActive` is only the admin deactivation switch, not verification.

Flow (all `POST /auth/...`):

- `identify` returns `exists`. This deliberately reveals whether an account exists (the product choice), rate-limited per IP.
- **Existing account:** `login { identifier, password }`, or `login/otp { identifier }`.
- **No account:** `register { identifier, name, password, confirmPassword }`. This creates **no User**: the bcrypt hash waits in the `OtpChallenge.pendingUser`.
- **Finishing either:** `otp/verify { verificationId, otp }` (201 when it creates the account, 200 for a login). `otp/resend { verificationId }` sends a new code.

Every send returns a random `verificationId` that verify requires. Without it, whoever re-submits a sign-up for the same number last could set the password. The challenge's stored `purpose` decides what verify does, never the client.

OTP rules are constants in `otp.service.js`: 6 digits, 10 min expiry, 5 wrong attempts, 60 s resend cooldown, 5 sends per challenge, one live challenge per identifier and purpose. Codes are stored as an HMAC keyed by `OTP_SECRET`. Limiters: `identifyLimiter` and `otpSendLimiter` count every request; `otpVerifyLimiter` counts only failures. The "return to the page they were on" behaviour belongs to the frontend. The API has no redirect parameter.

Route guards from `src/middlewares/authenticate.js`: `authenticate` (required), `optionalAuth` (attaches `req.user` if present), `authorize('admin')` (role gate, use after `authenticate`). `req.user` is `{ id, role }`.



## Product decisions

- **Guest cart:** guests can browse and add to cart without an account. Sign-in is required only at checkout, so the future cart module must support a guest cart (and merge it into the user's cart on sign-in); `optionalAuth` is the guard for cart routes, `authenticate` only for checkout/orders.
- **Checkout contact details:** phone-only users have no email and email-only users have no phone, so checkout must collect whichever is missing.
- **Catalogue shape:** 56 products, one pack size each, **no variants** — do not build a variant system. Delivery is free on every order with no minimum, so there is no shipping charge anywhere; the order module should have *no* `shippingCharge` field rather than one permanently set to `0`.
- **Categories:** six, fixed names and fixed display order — Women Wellness, Peanut Chikki, Nuts n Seeds, Millets n Nuts, Kids Wellness, Fruit Variant. "Nuts n Seeds" and "Millets n Nuts" are deliberately separate; do not merge them. SKU prefixes derive from these names but drift once a category is renamed, so never parse a category out of an SKU.
- **Payment (not yet built):** Razorpay with **UPI and QR only** — no cards, no netbanking, no wallets. Prices are stored as whole-rupee Numbers, so the payment module multiplies by 100 at the Razorpay boundary.
- **Images (upload not yet built):** an **admin-only** Cloudinary upload endpoint is needed after launch so the client can attach images to new products himself. Customers never upload. Until then images are uploaded by hand in the Cloudinary dashboard and the URLs are pasted into `scripts/data/products.json`. `Product.images` is deliberately uncapped; `images[0]` is the front of pack, and ordering alone decides the primary.
- **Stock:** a plain `stock` number on the product, no inventory module — 56 SKUs, no warehouses, no reservations. `Product.isActive` is both the publish switch and the soft-delete target.

## Working rules

- IMPORTANT: never commit .env. Only variable names go in .env.example.
- Do not create new top-level folders without asking me first.
- Do not run git add, git commit or git push. I handle git myself.
- Never start with new feature implementation untill the previous is commited and tree is clean
- Show me a plan before changing more than one file.