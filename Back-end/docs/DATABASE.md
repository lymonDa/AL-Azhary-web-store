# AL-AZHARI LIBRARY — Database Architecture & Operations

## 1. Authoritative Store & Architecture Overview

**MongoDB Atlas** is the persisted, authoritative source of truth for all business and financial state across the AL-AZHARI LIBRARY platform. External communication channels (email/SMTP, Socket.IO, WhatsApp) are secondary delivery mechanisms and never supersede committed database state.

### Core Conventions
* **Replica Set & Multi-Document Transactions**: MongoDB Atlas runs as a replica set supporting multi-document transactions via `withTransaction()`.
* **Internal Identifiers**: Domain aggregates use MongoDB `ObjectId` internally for primary keys and relations.
* **Public References**: External references use stable business strings (`ORD-YYYYMMDD-XXXX`, `SRV-XXXX`, `PRE-XXXX`, `RET-XXXX`).
* **Monetary Values**: All money amounts are stored as non-negative integer minor units (`amountMinor` in EGP piastres; 100 piastres = 1 EGP). Floating-point currency math is prohibited.
* **Timestamps & Dates**: All persisted dates are BSON UTC `Date` objects. Display localization to `Africa/Cairo` occurs on the client.
* **Audit & Lifecycle**: Every collection includes `createdAt` and `updatedAt`. State-machine entities maintain embedded transition histories and emit audit records.

---

## 2. Mongoose Configuration & Connection Lifecycle

Configuration resides in `src/config/database.ts` and connection management in `src/database/mongoose.ts`.

### Connection Configuration Options
* **`maxPoolSize`**: 50 connections.
* **`minPoolSize`**: 10 connections.
* **`serverSelectionTimeoutMS`**: 10,000 ms.
* **`socketTimeoutMS`**: 45,000 ms.
* **`connectTimeoutMS`**: 10,000 ms.
* **`heartbeatFrequencyMS`**: 10,000 ms.
* **`autoIndex`**: Disabled in production (`NODE_ENV === 'production'`) to prevent blocking index creation at startup.
* **`retryWrites` / `retryReads`**: Enabled.

### Connection State Machine
The database abstraction exposes a safe, non-sensitive state representation:

```typescript
export type DatabaseState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'error';
```

### Connection Management API
```typescript
import {
  connectDatabase,
  disconnectDatabase,
  isDatabaseReady,
  getDatabaseState,
} from './database';

// Establish connection (re-entrant safe; prevents duplicate in-flight attempts)
await connectDatabase();

// Check if ready to receive queries (readyState === 1)
const isReady = isDatabaseReady();

// Inspect safe string state ('connected', 'disconnected', etc.)
const state = getDatabaseState();

// Gracefully close connection during shutdown
await disconnectDatabase();
```

---

## 3. Readiness vs. Liveness Probe Behavior

* **`/health/live` (Process Liveness)**:
  * Verifies process responsiveness only.
  * Does **not** query or require MongoDB connectivity.
  * Returns HTTP `200` with `{ status: "ok" }`.
* **`/health/ready` (Dependency Readiness)**:
  * Queries actual Mongoose connection state via `isDatabaseReady()`.
  * **When Connected**: Returns HTTP `200` with `{"success": true, "data": {"status": "ready", "database": "connected"}}`.
  * **When Unavailable**: Returns HTTP `503` with `{"success": false, "error": {"code": "DEPENDENCY_UNAVAILABLE", "message": "Required dependency is unavailable", "details": null}}`.
  * **Credential Safety**: Never exposes database connection URIs, credentials, usernames, or internal topologies in response payloads.

---

## 4. Multi-Document Transactions

Authoritative mutations involving multiple collections (e.g. order placement + inventory reservation + outbox event) must execute within a MongoDB transaction.

```typescript
import { withTransaction } from './database';

const result = await withTransaction(async (session) => {
  // Pass session to all repository queries participating in this transaction
  const order = await orderRepository.create(orderData, { session });
  await inventoryRepository.reserveStock(items, { session });
  await outboxRepository.recordEvent(eventData, { session });

  return order;
});
```

### Transaction Rules
1. Never wrap simple read-only queries in transactions.
2. Sessions are committed automatically upon callback resolution.
3. If an error occurs, the transaction is aborted automatically and the session is guaranteed to end cleanly.
4. If an `existingSession` is supplied via options, `withTransaction` joins the outer transaction rather than creating a nested session.

---

## 5. Migration Strategy

The migration runner in `src/database/migrations/runner.ts` tracks applied migrations in the `__migrations` metadata collection.

### Migration Definition
```typescript
export interface Migration {
  id: string; // Lexicographically sortable identifier (e.g. '20260926_001_description')
  description: string;
  up: (context: MigrationContext) => Promise<void>;
  down?: (context: MigrationContext) => Promise<void>;
}
```

### Execution Properties
* **Ordered**: Migrations are strictly executed in lexicographical order by `id`.
* **Idempotent**: Re-running migrations inspects `__migrations` and skips already applied steps.
* **Atomic Batching**: Migrations are assigned batch numbers for rollback support.
* **Scope Restriction**: Phase 1 establishes the migration engine only. Business schema migrations are executed only in their respective domain phases.

---

## 6. Seed Infrastructure

Seed runner architecture is established in `src/database/seed/runner.ts`.

### Seeder Definition
```typescript
export interface Seeder {
  id: string; // e.g. '001_roles', '002_store_settings'
  description: string;
  run: (context: SeedContext) => Promise<void>;
}
```

### Execution Rules
* Seed runner supports executing all registered seeders or filtering by `seedIds`.
* In Phase 1, the seed registry contains no business seeders; no fake users, products, or orders are seeded.

---

## 7. Error Normalization

Database errors are intercepted and normalized via `src/database/errors.ts`:

| Raw MongoDB Error | Mapped AppError | HTTP Code | Public Message |
|:---|:---|:---:|:---|
| Duplicate key (`E11000`) | `ConflictError` (`RESOURCE_CONFLICT`) | `409` | `"A <field> with this value already exists"` |
| Mongoose `ValidationError` | `ValidationError` (`VALIDATION_ERROR`) | `400` | `"Database validation failed"` (with fields) |
| Mongoose `CastError` (invalid ID) | `BadRequestError` (`VALIDATION_ERROR`) | `400` | `"Invalid identifier format for <field>"` |
| Network / Timeout / Server selection | `DependencyUnavailableError` (`DEPENDENCY_UNAVAILABLE`) | `503` | `"Database service is currently unavailable"` |
| Unhandled database error | `AppError` (`INTERNAL_ERROR`) | `500` | `"A database operation could not be completed"` |

Internal collection names, raw BSON details, and index names are scrubbed before returning responses to clients.

---

## 8. Test Database Strategy

Automated unit and integration tests run hermetically using **`mongodb-memory-server`**:
* Unit and integration test suites boot an ephemeral in-memory MongoDB instance.
* Tests **never** connect to, read from, or modify the production `al_azhari_library` database.
* The test suite remains fast, self-contained, and runnable offline without external services.
