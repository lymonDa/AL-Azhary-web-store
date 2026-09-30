# AL-AZHARI LIBRARY — Backend Architecture Documentation

This document describes the production backend architecture established for **AL-AZHARI LIBRARY**, a modular monolith REST API built with Node.js, Express, TypeScript, and MongoDB Atlas.

---

## 1. Backend Architecture

The backend follows a strict **Modular Monolith** pattern:

```text
Angular Frontend
       ↓
Express REST API (/api/v1)
       ↓
Middleware (Security, Request ID, CORS, Parsers, Rate Limiting)
       ↓
Controllers (HTTP transport only, no business logic)
       ↓
Application Services (Business rules, state transitions, transactions)
       ↓
Repositories (Database queries, session propagation)
       ↓
Mongoose ODM
       ↓
MongoDB Atlas
```

### Core Architectural Principles

1. **Controllers must NOT directly access MongoDB**: All data operations pass through application services and repositories.
2. **Controllers must NOT contain business logic**: Controllers only handle HTTP parsing, DTO validation, and response delivery.
3. **Repositories must NOT decide authorization**: Authorization logic resides in route middleware and domain services.
4. **Business rules and state transitions belong in Services**: Explicit state transition maps enforce domain rules.
5. **Cross-module direct model mutation is forbidden**: Cross-module operations occur via public application service interfaces within a database transaction.
6. **MongoDB is the source of truth**: External communication mechanisms (email, WhatsApp, Socket.IO) are secondary delivery mechanisms.
7. **Money stored in integer minor units**: All monetary values are integers representing EGP piastres (`amountMinor`). Floating-point arithmetic is forbidden.
8. **All dates use UTC**: Dates are persisted as BSON UTC timestamps. Client presentation localizes to `Africa/Cairo`.
9. **Financial snapshots are immutable**: Orders and payments snapshot product details, prices, customer contact, and addresses.
10. **Multi-document operations use MongoDB Transactions**: Handled via `withTransaction()` sessions.
11. **Idempotency support**: Checkout, payment proofs, and refunds are protected by idempotency keys to prevent duplicate records.
12. **Authorization requires permission + ownership**: RBAC verified before checking resource ownership.
13. **Delivery is secondary**: Failures in email, Socket.IO, or WhatsApp notifications never roll back committed database state.
14. **No invented policy**: Unresolved business rules (e.g., reservation expiry duration, specific service fields) remain configurable settings.

---

## 2. Folder Structure

The repository structure is organized as follows:

```text
Back-end/
├── .env
├── .env.example
├── .gitignore
├── .prettierrc.json
├── ARCHITECTURE.md
├── README.md
├── eslint.config.mjs
├── jest.config.js
├── package.json
├── tsconfig.json
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   ├── auth.ts
│   │   ├── cloudinary.ts
│   │   ├── cors.ts
│   │   ├── database.ts
│   │   ├── env.ts
│   │   ├── index.ts
│   │   ├── logger.ts
│   │   ├── openapi.ts
│   │   └── security.ts
│   ├── database/
│   │   ├── index.ts
│   │   ├── mongoose.ts
│   │   ├── transaction.ts
│   │   ├── migrations/
│   │   └── seed/
│   ├── common/
│   │   ├── index.ts
│   │   ├── constants/
│   │   │   ├── error-codes.ts
│   │   │   ├── index.ts
│   │   │   └── roles.ts
│   │   ├── errors/
│   │   │   ├── app-error.ts
│   │   │   └── index.ts
│   │   ├── middleware/
│   │   │   ├── error.middleware.ts
│   │   │   ├── index.ts
│   │   │   └── request-id.middleware.ts
│   │   ├── responses/
│   │   │   └── index.ts
│   │   ├── security/
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── money.ts
│   │   │   └── response.ts
│   │   ├── utils/
│   │   │   ├── index.ts
│   │   │   └── response.util.ts
│   │   └── validators/
│   │       └── index.ts
│   ├── integrations/
│   │   ├── index.ts
│   │   ├── cloudinary/
│   │   ├── email/
│   │   └── whatsapp/
│   ├── realtime/
│   │   ├── index.ts
│   │   ├── events/
│   │   └── socket/
│   ├── jobs/
│   │   ├── cron.ts
│   │   ├── index.ts
│   │   ├── outbox-worker.ts
│   │   ├── worker.ts
│   │   └── handlers/
│   └── modules/
│       ├── addresses/
│       ├── audit/
│       ├── auth/
│       ├── carts/
│       ├── categories/
│       ├── content/
│       ├── coupons/
│       ├── inventory/
│       ├── notifications/
│       ├── orders/
│       ├── payments/
│       ├── preorders/
│       ├── products/
│       ├── quotations/
│       ├── refunds/
│       ├── reports/
│       ├── returns/
│       ├── services/
│       ├── settings/
│       ├── shipping/
│       └── users/
└── tests/
    ├── app.test.ts
    ├── integration/
    └── unit/
```

---

## 3. Module Boundaries

The backend consists of 21 bounded modules:

| Module            | Core Responsibility                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| `auth`          | User credentials, sessions, refresh tokens, email verification, password reset tokens.             |
| `users`         | Customer, Admin, and Owner profile state, account status, role management.                         |
| `addresses`     | Saved customer addresses (governorate, city, area, street, notes).                                 |
| `products`      | Books-first catalog, multi-attribute variants, inventory linkage, search texts, publication state. |
| `categories`    | Books-first taxonomy, hierarchical categories, display ordering.                                   |
| `carts`         | Persisted guest and authenticated customer carts; rejects service items.                           |
| `orders`        | Product order aggregate, lifecycle transitions, address and item snapshots.                        |
| `payments`      | Payment tracking for orders and accepted service quotes; manual proof workflow.                    |
| `inventory`     | Stock reservation tracking and immutable ledger (`inventoryTransactions`).                       |
| `services`      | Student service categories and requests (quotation-based, never carted).                           |
| `quotations`    | Versioned service quotations, customer decisions (accept/reject).                                  |
| `preorders`     | Customer pre-orders for out-of-stock items, admin availability review.                             |
| `returns`       | Item-level return requests and admin review.                                                       |
| `refunds`       | Manually processed refund records linked to orders or returns.                                     |
| `notifications` | In-app persisted notifications, delivery status.                                                   |
| `coupons`       | Promo codes, discount rules, immutable redemptions.                                                |
| `content`       | Merchandising banners, home seasonal collections, date-windowed modules.                           |
| `shipping`      | Governorate/city shipping estimate rules, provider tracking.                                       |
| `reports`       | Read-only business aggregations and management reports.                                            |
| `audit`         | Immutable audit log of critical mutations and administrative actions.                              |
| `settings`      | Configurable store policies, contact details, payment instructions.                                |

Each module maintains a standard structure:

```text
module/
├── controllers/
├── services/
├── repositories/
├── models/
├── schemas/
├── routes/
├── types/
└── index.ts
```

---

## 4. Dependency List

Production Dependencies:

- `express`: Core web application framework.
- `mongoose`: MongoDB ODM.
- `dotenv`: Environment variable loader.
- `zod`: Schema declaration and validation.
- `pino`, `pino-http`: High-performance structured JSON logging.
- `helmet`: Security HTTP response headers.
- `cors`: Strict CORS policy management.
- `express-rate-limit`: Layered API request throttling.
- `jsonwebtoken`: Access and token handling.
- `argon2`: Secure password hashing with Argon2id.
- `cookie-parser`: Secure parsing of HttpOnly refresh token cookies.
- `cloudinary`: Cloud media storage management.
- `socket.io`: Realtime WebSocket communication.
- `node-cron`: Background scheduled task processing.
- `nodemailer`: SMTP email transport adapter.

Development Dependencies:

- `typescript`: Strict type system compiler.
- `tsx`: Fast TypeScript execution and file watching in development.
- `jest`, `ts-jest`, `@types/jest`: Automated testing framework.
- `supertest`, `@types/supertest`: HTTP endpoint testing.
- `mongodb-memory-server`: In-memory isolated database for integration testing.
- `eslint`, `@typescript-eslint/*`: Code quality and linting.
- `prettier`: Code formatting.

---

## 5. Environment Variables

Managed through `.env` and typed/validated via Zod in `src/config/env.ts`:

| Variable                            | Description                                                     | Default / Example                               |
| ----------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- |
| `NODE_ENV`                        | Runtime environment (`development`, `test`, `production`) | `development`                                 |
| `PORT`                            | HTTP port                                                       | `3000`                                        |
| `API_BASE_PATH`                   | Versioned API base prefix                                       | `/api/v1`                                     |
| `PUBLIC_APP_ORIGIN`               | Angular frontend client URL                                     | `http://localhost:4200`                       |
| `ALLOWED_ORIGINS`                 | Permitted CORS origins                                          | `http://localhost:4200`                       |
| `MONGODB_URI`                     | MongoDB Atlas connection string                                 | `mongodb://localhost:27017/al_azhari_library` |
| `MONGODB_DB_NAME`                 | Database name                                                   | `al_azhari_library`                           |
| `JWT_ACCESS_SECRET`               | Secret for access tokens (min 32 chars)                         | Safe placeholder                                |
| `JWT_ACCESS_TTL`                  | Access token lifespan                                           | `15m`                                         |
| `JWT_REFRESH_SECRET`              | Secret for refresh tokens (min 32 chars)                        | Safe placeholder                                |
| `JWT_REFRESH_TTL`                 | Refresh token lifespan                                          | `7d`                                          |
| `JWT_ISSUER`                      | JWT Issuer claim                                                | `al-azhari-library`                           |
| `JWT_AUDIENCE`                    | JWT Audience claim                                              | `al-azhari-web`                               |
| `REFRESH_COOKIE_NAME`             | Name of refresh cookie                                          | `al_azhari_refresh`                           |
| `REFRESH_COOKIE_SECURE`           | Secure cookie flag (true in prod)                               | `false`                                       |
| `REFRESH_COOKIE_SAME_SITE`        | Cookie SameSite policy                                          | `lax`                                         |
| `ARGON2_MEMORY_COST`              | Argon2 memory cost                                              | `65536`                                       |
| `ARGON2_TIME_COST`                | Argon2 iterations                                               | `3`                                           |
| `ARGON2_PARALLELISM`              | Argon2 parallelism                                              | `4`                                           |
| `CLOUDINARY_CLOUD_NAME`           | Cloudinary account name                                         | (configured per env)                            |
| `CLOUDINARY_API_KEY`              | Cloudinary API key                                              | (configured per env)                            |
| `CLOUDINARY_API_SECRET`           | Cloudinary secret                                               | (configured per env)                            |
| `CLOUDINARY_PAYMENT_PROOF_FOLDER` | Folder for payment proof screenshots                            | `al-azhari/payment-proofs`                    |
| `CLOUDINARY_PRODUCT_FOLDER`       | Folder for product images                                       | `al-azhari/products`                          |
| `SMTP_HOST`                       | SMTP server host                                                | `smtp.example.com`                            |
| `SMTP_PORT`                       | SMTP port                                                       | `587`                                         |
| `SMTP_SECURE`                     | SMTP SSL flag                                                   | `false`                                       |
| `SMTP_USER`                       | SMTP username                                                   | (configured per env)                            |
| `SMTP_PASSWORD`                   | SMTP password                                                   | (configured per env)                            |
| `EMAIL_FROM`                      | Sender address                                                  | `no-reply@al-azhari.com`                      |
| `WHATSAPP_PHONE`                  | Customer service WhatsApp contact                               | (configured per env)                            |
| `SOCKET_PATH`                     | Socket.IO endpoint path                                         | `/socket.io`                                  |
| `RATE_LIMIT_PUBLIC_PER_MINUTE`    | Public rate limit window                                        | `100`                                         |
| `RATE_LIMIT_AUTH_PER_MINUTE`      | Auth route rate limit window                                    | `20`                                          |
| `OUTBOX_POLL_INTERVAL_MS`         | Outbox polling frequency                                        | `5000`                                        |
| `OUTBOX_MAX_ATTEMPTS`             | Maximum retry attempts for outbox                               | `5`                                           |

---

## 6. Database Connection Architecture

- Implemented in `src/database/mongoose.ts` and configured via `src/config/database.ts`.
- Manages connection lifecycle with event hooks (`connected`, `error`, `disconnected`).
- Supports graceful disconnection upon process termination (`SIGINT`, `SIGTERM`).
- Connection pooling with `maxPoolSize: 50` and `minPoolSize: 10`.
- Provides `isDatabaseConnected()` health check indicator.

---

## 7. Authentication Architecture

- **Dual-Token System**:
  - Short-lived Access Token (JWT, 15m lifetime) passed in the `Authorization: Bearer <token>` header.
  - Long-lived Refresh Token (7d lifetime) delivered exclusively via `HttpOnly`, `SameSite=lax` cookie.
- **Session Revocation**:
  - Refresh tokens are hashed before persisting in the `sessions` collection.
  - User accounts maintain `refreshTokenVersion` to enable instant global session revocation.
- **Password Security**:
  - Argon2id with memory cost 65536, time cost 3, parallelism 4.
  - Password hashes are marked `{ select: false }` in schemas to prevent accidental leakages.

---

## 8. Authorization / RBAC Architecture

- Core roles: `customer`, `admin`, `owner`.
- Roles map to granular `permissionKeys` in the `roles` collection.
- Route authorization verifies:
  1. Role permissions.
  2. Resource ownership (e.g., customer accessing their own order, cart, or address).
- Admins cannot bypass ownership constraints on customer accounts unless explicitly delegated.

---

## 9. Error Handling Architecture

- Implemented in `src/common/errors/app-error.ts` and `src/common/middleware/error.middleware.ts`.
- Error classes extend `AppError` with stable error codes and HTTP status codes:
  - `VALIDATION_ERROR` (400)
  - `AUTH_REQUIRED` (401)
  - `AUTH_INVALID_CREDENTIALS` (401)
  - `FORBIDDEN` (403)
  - `NOT_FOUND` (404)
  - `RESOURCE_CONFLICT` (409)
  - `ORDER_STATE_CONFLICT` (409)
  - `INSUFFICIENT_STOCK` (409)
  - `IDEMPOTENCY_KEY_REUSED` (409)
  - `PAYMENT_PROOF_REQUIRED` (422)
  - `SHIPPING_CONFIGURATION_UNAVAILABLE` (422)
  - `BUSINESS_RULE_VIOLATION` (422)
  - `RATE_LIMITED` (429)
  - `INTERNAL_ERROR` (500)
  - `DEPENDENCY_UNAVAILABLE` (503)
- Zod schema validation errors are caught and transformed into standard `VALIDATION_ERROR` payloads with field-level paths.
- Internal errors are masked to avoid leaking stack traces or credentials.

---

## 10. Validation Architecture

- All inputs are validated at route boundaries using Zod schemas (`src/modules/*/schemas/*.schema.ts`).
- Environment variables validated at application startup using Zod in `src/config/env.ts`.
- Mongoose schemas enforce domain types, `strict: "throw"`, and custom validators (e.g., non-negative integer money).

---

## 11. Logging Architecture

- High-performance asynchronous structured JSON logging with `pino` (`src/config/logger.ts`).
- Integrated HTTP request logging via `pino-http` in `src/app.ts`.
- Sensitive fields automatically redacted:
  - `req.headers.authorization`
  - `req.headers.cookie`
  - `password`, `passwordHash`
  - `token`, `refreshToken`, `tokenHash`, `guestAccessTokenHash`
  - `apiKey`, `apiSecret`
- Every request carries an `X-Request-Id` attached to all logs and response envelopes.

---

## 12. Security Architecture

- **Helmet**: Secures HTTP response headers.
- **CORS**: Strict allowlist based on `ALLOWED_ORIGINS`, credentials enabled, no wildcard origins in production.
- **Rate Limiting**: Layered rate limiters:
  - Public limiter: 100 req/min.
  - Auth limiter: 20 req/min.
- **Request Size Limits**: JSON and URL-encoded body limits capped at 1MB.
- **NoSQL Injection Prevention**: Mongoose strict schema enforcement and sanitization.

---

## 13. Integration Architecture

Infrastructure prepared under `src/integrations/`:

- `cloudinary/`: Media upload signing and asset management.
- `email/`: Nodemailer SMTP transport adapter for asynchronous notifications.
- `whatsapp/`: Deep-link generation and communication helpers (no direct automated gateway).

---

## 14. Realtime Architecture

- Prepared in `src/realtime/socket/` and attached to HTTP server in `src/server.ts`.
- Operates under `SOCKET_PATH` (default `/socket.io`).
- Authenticated via JWT access tokens.
- Socket delivery is secondary to committed database state.

---

## 15. Background Jobs Architecture

- Prepared under `src/jobs/`:
  - `cron.ts`: Scheduled tasks powered by `node-cron`.
  - `outbox-worker.ts`: Polling and dispatching committed `outboxEvents`.
  - `worker.ts`: Worker process management and recovery.
- Distributed lease locking prevents concurrent job executions across multiple instances.

---

## 16. Testing Architecture

- Unit and integration testing setup in `jest.config.js` and `tests/`.
- Supertest for end-to-end HTTP endpoint validation.
- MongoDB Memory Server configured for isolated database testing without external dependencies.
- Smoke tests verify health check endpoints, request ID propagation, and 404 error envelope compliance.

---

## 17. API Versioning

- All public endpoints are mounted under `/api/v1` via `env.API_BASE_PATH`.
- Responses follow uniform envelopes:
  - Success Envelope: `{ success: true, data: T, meta: { requestId, pagination, timestamp } }`
  - Error Envelope: `{ success: false, error: { code, message, fields }, meta: { requestId, timestamp } }`

---

## 18. Transaction Strategy

- Multi-document ACID transactions encapsulated in `src/database/transaction.ts`:
  ```ts
  await withTransaction(async (session) => {
    // 1. Authoritative operations within session
    // 2. Outbox event creation
  });
  ```
- Repositories accept `{ session }` in all mutating methods.

---

## 19. Idempotency Strategy

- Sensitive mutating operations (Order placement, payment proof submissions, refund processing) require client-provided `Idempotency-Key` headers or DTO fields.
- Reusing an existing idempotency key with conflicting payload returns `IDEMPOTENCY_KEY_REUSED` (409).
- Reusing an identical key returns the previous successful result without re-executing state transitions.

---

## 20. Outbox Architecture

- Relies on the `outboxEvents` collection to ensure reliable at-least-once message delivery.
- Events are committed within the same database transaction as the business operation.
- Asynchronous outbox worker picks up pending events, delivers via Email/Socket.IO, updates status (`sent` or `failed`), and tracks retry attempts up to `OUTBOX_MAX_ATTEMPTS`.
