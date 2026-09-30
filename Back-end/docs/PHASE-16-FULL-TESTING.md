# Phase 16 — Full Testing

## Overview

Phase 16 delivers the comprehensive integration, concurrency, failure injection, and regression test suite for the **AL-AZHARI LIBRARY backend**. Built upon the modular monolith architecture (Node.js, Express, TypeScript, MongoDB Atlas, Mongoose), the test suite validates end-to-end multi-module customer journeys, high-concurrency race conditions with MongoDB transactions, granular RBAC gating, IDOR prevention across all domain resources, transaction rollback integrity, and chronological database migrations from an empty database.

---

## Requirements & Scope Matrix

Mapped directly to the Authoritative Backend Implementation Plan:

| Requirement Category | Acceptance Criteria | Implementation Status |
|----------------------|---------------------|-----------------------|
| **Cross-Module Workflows** | Complete End-to-End customer & admin journeys (Catalog -> Cart -> Checkout -> Payment -> Order Lifecycle -> Notifications) | `COMPLETE` |
| **High Concurrency & Races** | Race conditions with concurrent requests, inventory depletion atomicity, idempotency key deduplication, multi-worker lease competition | `COMPLETE` |
| **RBAC Authorization Matrix** | Complete role matrix (`customer`, `admin`, `owner`), route gating, permission enforcement, owner universal bypass (`*`) | `COMPLETE` |
| **IDOR Regression Suite** | Horizontal privilege escalation prevention across orders, addresses, carts, payment proofs, service requests, quotations, returns, notifications | `COMPLETE` |
| **Failure Injection & Rollbacks** | Multi-document transaction atomicity, mid-flight operation rollback, decoupled socket/email failure resilience, error sanitization | `COMPLETE` |
| **Migrations Regression** | Chronological execution of all 13 database migrations on clean database, idempotent re-runs, collection/index validation | `COMPLETE` |
| **Existing Suite Integrity** | Zero regression across all pre-existing Phase 0–15 test suites | `COMPLETE` |

---

## Test Architecture & Layering

The test architecture is structured in deterministic, isolated tiers using Jest, Supertest, and `mongodb-memory-server` configured with replica set transactions.

```
tests/
├── unit/                         # Unit tests for domain logic, validators, helpers, schemas
│   └── migrations-regression.test.ts # Chronological & idempotent migration verification
├── api/                          # HTTP route, schema validation & security tests
│   ├── rbac-matrix.test.ts       # Granular role & permission matrix validation
│   └── idor-regression.test.ts   # Horizontal privilege escalation & object ownership tests
├── integration/                  # Cross-boundary & failure testing
│   ├── concurrency-matrix.test.ts # High-concurrency races & distributed outbox lease claims
│   └── failure-injection.test.ts # Transaction rollback on mid-flight faults & decoupled resilience
└── workflows/                    # End-to-end multi-module state machine journeys
    └── cross-module-journeys.test.ts # Full customer & admin lifecycle workflows
```

---

## 1. Cross-Module Workflows (`tests/workflows/cross-module-journeys.test.ts`)

Covers complete end-to-end scenarios executing through the HTTP API and persisting authoritative state in MongoDB:

### Journey A: Full Standard Customer Order Lifecycle
1. Customer registers (`POST /api/v1/auth/register`) and creates a shipping address (`POST /api/v1/addresses`).
2. Customer adds catalog products to cart (`POST /api/v1/cart/items`), applies active discount coupon (`POST /api/v1/cart/coupon`).
3. Checkout executes with idempotency key (`POST /api/v1/checkout`) converting cart items into an authoritative order snapshot in `pending_review` status.
4. Customer uploads manual bank transfer proof (`POST /api/v1/payments/proof`).
5. Admin reviews payment proof and approves payment (`POST /api/v1/admin/payments/:id/approve`), transitioning order to `accepted`.
6. Admin updates fulfillment through `processing` -> `shipped` -> `delivered`.
7. Authoritative stock decreases, notifications are queued and dispatched via Outbox.

### Journey B: Guest Checkout & Order Tracking
1. Guest adds items to cart with guest token.
2. Guest executes checkout with email, phone, and delivery address (`POST /api/v1/checkout/guest`).
3. Guest looks up order using order reference and guest secret (`GET /api/v1/orders/guest/lookup`).

### Journey C: Student Services Workflow
1. Student submits custom printing/binding service request (`POST /api/v1/services/requests`) with requirements and specs.
2. Admin reviews request and issues itemized quotation (`POST /api/v1/admin/services/quotations`).
3. Student accepts quotation (`POST /api/v1/services/quotations/:id/accept`), creating an authoritative service order.
4. Admin completes service and delivers files/order.

### Journey D: Returns & Refunds Lifecycle
1. Customer initiates return request (`POST /api/v1/returns`) on delivered order with reason and proof.
2. Admin approves return request (`POST /api/v1/admin/returns/:id/approve`).
3. Admin records item receipt and completes refund (`POST /api/v1/admin/returns/:id/complete-refund`).
4. Authoritative order refund status updates, inventory is restocked, and audit log entries are generated.

### Journey E: Outbox Worker & Email Adapter Resilience
1. Mutation creates outbox messages for email and notifications.
2. Worker claims pending outbox messages, executes simulated send with mock adapters.
3. Outbox status transitions reliably from `pending` -> `processing` -> `completed` without data loss.

---

## 2. Concurrency & Race Conditions (`tests/integration/concurrency-matrix.test.ts`)

Simulates simultaneous real-world operations using `Promise.all` across concurrent requests:

1. **Last-Stock Race Condition**:
   - 2 concurrent checkout requests compete for the 1 remaining unit in stock (`stock = 1`).
   - Outcome: Exactly 1 checkout succeeds (`201 Created`); the other fails with stock exhaustion error (`400 Bad Request` / `409 Conflict`). Inventory ends at exactly `stock = 0`, never negative.
2. **Checkout Idempotency Key Deduplication**:
   - 2 simultaneous checkout requests submitted with identical `Idempotency-Key` headers.
   - Outcome: Exactly 1 order is created; both requests resolve with consistent order references without double-charging or duplicate order creation.
3. **Cart Price & Stock Revalidation Race**:
   - Cart created when item is priced at 100 EGP. Product price is updated concurrently to 150 EGP before checkout.
   - Outcome: Checkout detects price drift during transaction revalidation and rejects stale price, enforcing catalog truth.
4. **Concurrent Quotation Decision**:
   - Simultaneous accept and reject requests on the same pending quotation.
   - Outcome: Exactly one transition succeeds; subsequent transition fails with invalid state transition error.
5. **Concurrent Duplicate Refund**:
   - Simultaneous refund completion calls on the same approved return.
   - Outcome: Exactly one refund records successfully; second call is rejected without double-crediting.
6. **Multi-Worker Outbox Claim Competition**:
   - Multiple background worker processes execute `claimPendingMessages()` simultaneously on 5 pending outbox jobs with batch size 2.
   - Outcome: Zero duplicate claims; every message is claimed by exactly one worker using atomic `findOneAndUpdate` with lease timestamps.

---

## 3. RBAC Matrix Verification (`tests/api/rbac-matrix.test.ts`)

Systematically verifies role and permission gating across all protected resources:

| Role / Actor | Endpoint Under Test | Expected Status | Enforcement Mechanism |
|--------------|---------------------|-----------------|-----------------------|
| Anonymous | Protected Customer Endpoints | `401 Unauthorized` | `requireAuth` |
| Customer | Admin Product Write (`POST /admin/products`) | `403 Forbidden` | `requireRole(['admin', 'owner'])` |
| Customer | Admin Orders List (`GET /admin/orders`) | `403 Forbidden` | `requirePermission('orders.read')` |
| Customer | Admin Reports (`GET /admin/reports/revenue`) | `403 Forbidden` | `requirePermission('reports.read')` |
| Customer | Admin Audit Logs (`GET /admin/audit-logs`) | `403 Forbidden` | `requirePermission('audit.read')` |
| Admin without `audit.read` | `GET /admin/audit-logs` | `403 Forbidden` | `requirePermission('audit.read')` |
| Admin with `orders.read` | `GET /admin/orders` | `200 OK` | Granular permission check |
| Owner | Any Admin Endpoint | `200 OK` | Universal permission bypass (`*`) |

---

## 4. IDOR & Data Isolation Regression (`tests/api/idor-regression.test.ts`)

Validates horizontal authorization and customer boundary enforcement:

1. **Orders**: Customer B cannot read or modify Customer A's order (`GET /api/v1/orders/:id` returns `404 Not Found` / `403 Forbidden`).
2. **Addresses**: Customer B cannot update or delete Customer A's address (`PUT /api/v1/addresses/:id` returns `404 Not Found`).
3. **Carts**: Customer B cannot access or clear Customer A's active shopping cart.
4. **Payment Proofs**: Customer B cannot inspect Customer A's submitted payment proofs.
5. **Service Requests**: Customer B cannot view Customer A's custom service requests or attachments.
6. **Quotations**: Customer B cannot accept or reject Customer A's quotation.
7. **Return Requests**: Customer B cannot read or modify Customer A's return requests.
8. **Notifications**: Customer B cannot mark Customer A's notifications as read or list them.

---

## 5. Failure Injection & Transaction Rollbacks (`tests/integration/failure-injection.test.ts`)

Tests system fault tolerance and atomic consistency under catastrophic failures:

1. **Mid-Flight Checkout Abort**:
   - Injected failure during checkout order item creation.
   - Outcome: Multi-document transaction aborts completely; 0 orders created, cart remains fully intact, 0 stock deducted.
2. **Order Acceptance Stock Reservation Failure**:
   - Injected failure during stock reservation step within order acceptance transaction.
   - Outcome: Entire transaction aborts; order status remains `pending_review`, no partial reservation leakage.
3. **Return Approval & Refund Abort**:
   - Injected failure during refund record generation.
   - Outcome: Return status remains pending, no balance or inventory drift.
4. **Decoupled Realtime Socket Failure**:
   - Socket emitter forcibly throws during order status update.
   - Outcome: Database transaction commits successfully; HTTP API returns `200 OK`; order status is updated authoritatively despite realtime transport glitch.
5. **Error Envelope Sanitization**:
   - Malformed queries, database connectivity errors, and unexpected exceptions.
   - Outcome: Returns clean JSON error envelope (`{ success: false, error: { message, code } }`); zero leaked database connection URIs, credentials, or internal Mongoose stack traces.

---

## 6. Chronological Migrations Regression (`tests/unit/migrations-regression.test.ts`)

Validates database schema and migration infrastructure:

1. **Chronological Sequence**:
   - All 13 migrations (`20260927_001` through `20260928_013`) are strictly ordered chronologically by filename and registered identifier.
2. **Clean State Execution**:
   - Runs `MigrationRunner.up()` against an empty test database; successfully executes all 13 migrations in sequence.
3. **Idempotency**:
   - Subsequent execution of `MigrationRunner.up()` detects all migrations already applied; executes 0 migrations cleanly without errors.
4. **Index & Collection Verification**:
   - Verifies all required collections exist (`users`, `products`, `orders`, `auditLogs`, `outboxMessages`, `returns`, etc.) and critical indexes (compound unique indexes, TTL indexes, sparse indexes) are active.

---

## Open Decisions & Invariant Status

Per project guidelines, all open architectural decisions remain unmutated:
- **OD-03 (Return Shipping Label Generation)**: Remains manual triage by admin; no third-party courier label generation invented.
- **OD-04 (Guest Checkout Lookup Rate Limiting)**: Rate limiter thresholds preserved per Phase 2 & 8 specifications.
- **OD-05 (External Payment Webhook Signature Scheme)**: Preserved manual bank transfer / receipt upload workflow; no unverified third-party payment gateway callbacks introduced.
- **OD-06 (Outbox Change Streams vs Polling)**: Preserved atomic MongoDB polling and lease recovery worker architecture.
- **OD-17 (Audit Log Retention Policy)**: Append-only immutable retention preserved with no destructive automated purge jobs.

---

## Explicit Scope Boundary Statement

- **Phase 16 ONLY**: All deliverables and test suites strictly fulfill Phase 16 requirements.
- **Phase 17 (Security Hardening)**: Formally deferred to Phase 17.
- **Phase 18 (Deployment & Production Configuration)**: Formally deferred to Phase 18.
