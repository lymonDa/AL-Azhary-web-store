# AL-AZHARI LIBRARY — Architecture Overview

## 1. System Context & Overview

**AL-AZHARI LIBRARY** is an online platform for a physical library, stationery, gift store, and student services provider located in Qena, Egypt.

The backend is built as a **Modular Monolith** using **Node.js, Express, TypeScript (strict mode), and MongoDB Atlas via Mongoose**.

The system provides a versioned REST API mounted under:

```text
/api/v1
```

MongoDB is the authoritative source of truth for all business and financial state. External channels (Socket.IO, email/SMTP, WhatsApp) are secondary delivery mechanisms.

---

## 2. Layered Architecture

Within each domain module, code is structured strictly into clear responsibility layers:

```text
HTTP Client (Angular Frontend)
       │
       ▼
Express API Router (/api/v1)
       │
       ▼
Cross-Cutting Middleware (Helmet, CORS, Request ID, Rate Limiter, Parsers, Pino HTTP)
       │
       ▼
Controllers (HTTP transport, DTO parsing, parameter validation)
       │
       ▼
Application / Domain Services (Business logic, state machines, transactions)
       │
       ▼
Repositories (Mongoose ODM data access, session propagation)
       │
       ▼
Mongoose ODM & Schemas
       │
       ▼
MongoDB Atlas (Authoritative Data Store)
```

### Architectural Principles
1. **Controllers must NOT directly query MongoDB**: All data persistence and querying is mediated by repositories.
2. **Controllers must NOT contain business logic**: Controllers only handle HTTP parsing, delegating work to application services and returning standard envelopes.
3. **Business rules belong in Services**: State transitions, validations, and domain rules are enforced in domain services.
4. **Repositories own Mongoose persistence**: Repositories accept `ClientSession` for transactional consistency.
5. **Cross-module boundaries**: Cross-module operations must go through public application service or repository interfaces. Modules never modify another module's internal collections directly.
6. **Transactions**: Multi-document operations (orders, reservations, payments, refunds) execute inside MongoDB transactions via `withTransaction()`.
7. **Money representation**: All monetary amounts are stored as integer minor units (`amountMinor` in EGP piastres; 100 piastres = 1 EGP). Floating-point currency math is prohibited.
8. **Timezone & Dates**: All persisted dates are UTC BSON Dates. Presentation is formatted for `Africa/Cairo` on the client.
9. **Idempotency**: Critical mutation endpoints (checkout, payment uploads, refunds) support `Idempotency-Key` headers to prevent duplicate operations.
10. **Delivery is secondary**: Email, WhatsApp notifications, and Socket.IO messages are managed through the transactional Outbox pattern. A failure in external delivery never causes a rollback of a committed database transaction.

---

## 3. Directory Layout & Folder Responsibilities

```text
Back-end/
├── src/
│   ├── config/              # Validated environment, security, database, logger, openapi
│   │   ├── env.ts           # Zod-validated environment schema & parser
│   │   ├── database.ts      # MongoDB connection pool & connection options
│   │   ├── logger.ts        # Pino logger configuration with sensitive data redaction
│   │   ├── cors.ts          # Strict CORS policy & allowed headers
│   │   ├── security.ts      # Helmet security headers & rate limiters
│   │   ├── openapi.ts       # Baseline OpenAPI 3.0 specification
│   │   └── index.ts         # Consolidated configuration exports
│   │
│   ├── database/            # Database initialization and connection management
│   │   ├── mongoose.ts      # Connection lifecycle and connection status checks
│   │   ├── transaction.ts   # withTransaction() wrapper for atomic sessions
│   │   ├── migrations/      # Future repeatable database migration scripts
│   │   ├── seed/            # Future baseline data seeds
│   │   └── index.ts         # Consolidated database exports
│   │
│   ├── common/              # Cross-cutting foundational infrastructure
│   │   ├── constants/       # Global constants, roles, and error codes
│   │   ├── errors/          # AppError hierarchy, status codes, and error definitions
│   │   ├── http/            # HTTP status codes and standard response envelopes
│   │   ├── middleware/      # Request ID, centralized error handler, rate limiters
│   │   ├── types/           # Global TypeScript interfaces, response envelopes, money types
│   │   ├── utils/           # Response formatters and common helpers
│   │   └── index.ts         # Consolidated common exports
│   │
│   ├── modules/             # Business modules (Domain-driven boundaries)
│   │   ├── auth/            # Authentication, session tokens, password reset
│   │   ├── users/           # User accounts and administrative profiles
│   │   ├── addresses/       # Customer shipping & billing addresses
│   │   ├── products/        # Product catalog, books, variants, specifications
│   │   ├── categories/      # Hierarchy of book and stationery categories
│   │   ├── carts/           # Guest and customer shopping carts
│   │   ├── orders/          # Product orders and fulfillment lifecycle
│   │   ├── payments/        # Manual payment records and verification
│   │   ├── inventory/       # Stock tracking and reservations
│   │   ├── services/        # Student services catalog (printing, binding, research)
│   │   ├── quotations/      # Custom service quotation requests
│   │   ├── preorders/       # Upcoming book preorders
│   │   ├── returns/         # Product return requests
│   │   ├── refunds/         # Admin-recorded manual refunds
│   │   ├── notifications/   # In-app notification records
│   │   ├── coupons/         # Discount coupons and validation
│   │   ├── content/         # Banners, announcements, CMS content
│   │   ├── shipping/        # Shipping zones, governorates, rates
│   │   ├── reports/         # Operational and sales reporting
│   │   ├── audit/           # Audit trail logs for administrative mutations
│   │   └── settings/        # System configuration and store operating parameters
│   │
│   ├── integrations/        # Third-party service adapters
│   │   ├── cloudinary/      # Cloudinary upload client (payment proofs, product images)
│   │   ├── email/           # Nodemailer SMTP transport adapter
│   │   └── whatsapp/        # WhatsApp notification link generator
│   │
│   ├── realtime/            # Real-time WebSocket infrastructure
│   │   └── socket/          # Socket.IO connection and room management
│   │
│   ├── jobs/                # Background processing and workers
│   │   ├── worker.ts        # In-process background job worker
│   │   ├── outbox-worker.ts # Outbox event poller and dispatcher
│   │   └── cron.ts          # Scheduled tasks (reservation expiry, reminders)
│   │
│   ├── app.ts               # Express application initialization and middleware pipeline
│   └── server.ts            # HTTP server startup, graceful shutdown, and signal traps
│
├── tests/
│   ├── unit/                # Unit tests for configuration, error handling, responses
│   ├── integration/         # Integration tests for health probes and bootstrap
│   ├── api/                 # End-to-end API route and middleware tests
│   └── workflows/           # Multi-step business workflow tests (future phases)
│
├── docs/                    # Architecture and operational documentation
│   ├── ARCHITECTURE.md
│   ├── ERROR-HANDLING.md
│   ├── ENVIRONMENT.md
│   └── PHASE-0-FOUNDATION.md
│
├── .env                     # Local environment secrets (ignored by Git)
├── .env.example             # Clean environment template with placeholders
├── .gitignore               # Ignored files (node_modules, dist, .env, logs)
├── package.json             # NPM package specification and scripts
├── tsconfig.json            # Strict TypeScript configuration
└── README.md                # Project quick start
```

---

## 4. Module Internal Structure

Every domain module under `src/modules/<name>/` conforms to a consistent structure:

```text
src/modules/<module-name>/
├── controllers/    # Express controllers (HTTP parameter extraction and response sending)
├── services/       # Domain and application services (Business rules and transactions)
├── repositories/   # Mongoose repository abstractions (Data access methods)
├── models/         # Mongoose schema and model definitions
├── schemas/        # Zod validation schemas for request bodies, queries, and params
├── routes/         # Express router definitions mounting controller actions
├── types/          # Module-specific TypeScript interfaces and types
└── index.ts        # Module public interface (exported services and routes)
```

In **Phase 0**, these files exist as clean placeholders ready for module implementation in future phases without introducing premature business logic.

---

## 5. Request Lifecycle

1. **Incoming Request**: Client issues an HTTP request to `http(s)://<host>/api/v1/<resource>`.
2. **Reverse Proxy Trust**: `trust proxy` is configured for deployment behind Hostinger/Nginx reverse proxy.
3. **Security Headers**: `helmet` enforces Content Security Policy (in production), frameguard, no-sniff, and XSS filtering.
4. **CORS Validation**: Origin is checked against `ALLOWED_ORIGINS`. Pre-flight `OPTIONS` requests are handled with standard allowed methods and headers.
5. **Request ID**: `requestIdMiddleware` checks for incoming `X-Request-Id` (sanitizing it) or generates a secure UUID via `crypto.randomUUID()`. Attached to `req.id` and emitted in response header `X-Request-Id`.
6. **Body Parsing**: `express.json({ limit: '1mb' })` and `express.urlencoded({ extended: true, limit: '1mb' })` parse request payloads with safe size limits.
7. **HTTP Logging**: `pinoHttp` logs request details, status, duration, and error codes with automatic redaction of sensitive credentials.
8. **Rate Limiting**: Public endpoints enforce rate limiting (`RATE_LIMIT_PUBLIC_PER_MINUTE`) using client IP.
9. **Routing**: Routes mounted on `/api/v1` handle valid requests.
10. **404 Handling**: Unmatched routes pass to the 404 handler, creating a `NotFoundError`.
11. **Central Error Handler**: `errorHandlerMiddleware` catches all synchronous and asynchronous errors, formats a standard error envelope, logs server-side, and guarantees no internal stack trace leaks.
