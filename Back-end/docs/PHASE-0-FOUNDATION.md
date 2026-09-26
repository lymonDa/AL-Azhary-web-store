# AL-AZHARI LIBRARY — Phase 0: Foundation

## 1. Phase Objective

Phase 0 establishes the **foundational infrastructure** for the AL-AZHARI LIBRARY backend. Its sole purpose is to provide a clean, secure, strictly typed, tested, and operational application platform that subsequent business modules will build upon.

---

## 2. Implemented Capabilities in Phase 0

### TypeScript & Strict Build Setup
* Node.js + Express setup written entirely in TypeScript with `.ts` files.
* Strict mode enabled in `tsconfig.json` (`noImplicitAny`, `strictNullChecks`, `noImplicitReturns`).
* Compilation to `dist/` with source maps enabled via `npm run build`.
* Type checking without emitting output via `npm run typecheck`.
* ESLint and Prettier configured and integrated via `npm run lint`.

### Application Bootstrap & Request Lifecycle
* Clean separation of concerns between `src/app.ts` (Express setup & middleware configuration) and `src/server.ts` (HTTP server lifecycle & graceful shutdown).
* Versioned REST API routing mounted under `/api/v1`.
* Custom routes registration hook in `createApp(routesCallback)` for testing and module extension.
* Graceful termination handling for `SIGTERM` and `SIGINT`, ensuring HTTP server, WebSocket server, and database connections close cleanly.

### Security Foundation
* **Helmet**: Configured with security headers (`x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN`, `x-dns-prefetch-control`).
* **CORS**: Strict CORS origin verification with support for credentials, custom headers (`X-Request-Id`, `X-Guest-Token`, `Idempotency-Key`), and preflight caching.
* **Rate Limiting**: Public tier (`RATE_LIMIT_PUBLIC_PER_MINUTE`) using `express-rate-limit` with `trust proxy` enabled for reverse proxy environments.
* **Payload Limits**: 1MB maximum body limit on JSON and URL-encoded requests to prevent resource exhaustion.

### Request Correlation & Logging
* **Request ID Middleware**: Injects a cryptographically secure, unpredictable UUID (`req_<uuid>`) via `crypto.randomUUID()` or sanitizes an incoming `X-Request-Id`.
* `X-Request-Id` is returned in HTTP response headers and included in all log entries and response envelopes.
* **Pino Structured Logger**: Configured with automatic redaction of sensitive credentials (passwords, tokens, payment proofs, API keys) and pretty printing in development. Logger is silenced during automated Jest test runs.

### Standard Response Envelopes & Error Handling
* Consistent HTTP response envelopes for success (`success: true`, `data`, `requestId`, `meta`) and errors (`success: false`, `error: { code, message, details, fields }`, `requestId`, `meta`).
* Comprehensive `AppError` class hierarchy and standard error codes (`VALIDATION_ERROR`, `AUTH_REQUIRED`, `FORBIDDEN`, `NOT_FOUND`, `RESOURCE_CONFLICT`, `ORDER_STATE_CONFLICT`, `INTERNAL_ERROR`, `DEPENDENCY_UNAVAILABLE`, etc.).
* Interception of Zod validation failures, malformed JSON bodies, and unhandled server errors without exposing internal stack traces.

### Health Probes
* `GET /health/live`: Liveness check verifying process availability. Does **not** require MongoDB connection. Returns 200 `{ status: "ok" }`.
* `GET /health/ready`: Readiness check verifying dependency availability. Explicitly reports whether MongoDB is connected (returns 200 if connected, 503 if disconnected).
* `GET /health` and `GET /api/v1/health`: Overall health summary with API version.

### Database Foundation
* Mongoose connection lifecycle management with pool configuration (`minPoolSize: 10`, `maxPoolSize: 50`).
* Safe connection state check (`isDatabaseConnected()`).
* Transaction abstraction helper (`withTransaction()`) for atomic multi-document operations.
* Structure prepared for database migrations (`src/database/migrations/`) and seed scripts (`src/database/seed/`).

### Module Scaffolding
* All 21 business modules scaffolded with empty placeholder structures:
  `auth`, `users`, `addresses`, `products`, `categories`, `carts`, `orders`, `payments`, `inventory`, `services`, `quotations`, `preorders`, `returns`, `refunds`, `notifications`, `coupons`, `content`, `shipping`, `reports`, `audit`, `settings`.
* Each module contains placeholder folders: `controllers`, `services`, `repositories`, `models`, `schemas`, `routes`, `types`, and `index.ts`.

---

## 3. Explicitly Out of Scope for Phase 0

The following domain features belong to subsequent implementation phases and are **intentionally NOT implemented**:

* User registration, login, logout, refresh tokens, password reset, email verification
* Role-based access control (RBAC) and authorization checks
* Product and category creation, catalog browsing, or inventory stock mutation
* Shopping cart operations for guest or registered users
* Order placement, checkout workflows, or shipping cost calculations
* Manual payment proof submission or Admin verification workflows
* Student services catalog or custom quotation workflows
* Preorders, returns, refunds, or coupon validation
* Realtime Socket.IO events or business room joins
* Cloudinary image or document uploads
* SMTP email dispatch or templating
* WhatsApp link generation
* In-process Outbox event poller or cron jobs
* Financial reporting or operational audit logging

---

## 4. How to Run the Backend

### Prerequisites
* Node.js >= 20.0.0
* npm >= 10.0.0

### Development Mode
```bash
# Start with hot reload via tsx watch
npm run dev
```

### Production Build & Run
```bash
# Compile TypeScript to dist/
npm run build

# Start production server from compiled output
npm start
```

### Verification & Testing
```bash
# Run TypeScript typecheck (no emit)
npm run typecheck

# Run ESLint across code and tests
npm run lint

# Run all unit, integration, and API tests
npm test

# Run tests in watch mode
npm run test:watch
```
