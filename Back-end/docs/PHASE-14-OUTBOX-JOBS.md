# Phase 14 — Outbox, Background Jobs, Worker & Cron Implementation

## 1. Overview
Phase 14 implements the internal operational layer for processing asynchronous background events in the **AL-AZHARI LIBRARY** backend.
It connects to the outbox events persisted during transactional business operations (established in Phase 13) and provides:
- Atomic event claiming with mutual exclusion
- Worker lease system preventing concurrent duplicate processing
- Automated lease expiration recovery for crash resilience
- Bounded batch polling and controlled concurrency
- Transactional side-effect dispatching via Email and Socket.IO
- Exponential backoff retry with bounded random jitter
- Error classification (transient retryable vs. terminal failure)
- Replay tolerance adhering to at-least-once delivery semantics
- Multi-instance safety without external message brokers (Redis, BullMQ, Kafka, RabbitMQ)
- Scheduled background maintenance cron jobs
- Structured operational observability and backlog health reporting
- Graceful worker shutdown on process termination signals (`SIGTERM`, `SIGINT`)

---

## 2. Existing Outbox Connection
In Phase 13, state-changing application workflows record a persisted `INotification` and a corresponding `IOutboxEvent` in the `outboxEvents` collection within the **SAME** MongoDB transaction:
```text
Business Transaction (e.g. Order / Payment / Service mutation)
        ↓
Persist Notification (notifications collection)
        ↓
Persist Outbox Event (outboxEvents collection, status: 'pending')
        ↓
COMMIT Transaction
```
Phase 14's internal worker is the authoritative consumer of these `outboxEvents`:
```text
Pending Event in MongoDB
        ↓
Atomic Claim (findOneAndUpdate with leaseUntil & claimedBy)
        ↓
Dispatch Side Effects (Email + Socket.IO)
        ↓
Commit 'sent' or 'pending' (retry backoff) or 'failed' (terminal)
```

---

## 3. Worker Architecture
The worker runs strictly **inside the existing Node.js application process** (modular monolith architecture):
```text
Node.js Application Process
├── Express REST API (/api/v1)
├── Socket.IO Realtime Server
├── Notification Service
├── Email Service (Nodemailer adapter)
└── Internal Background Processing
      ├── OutboxWorker (Polling, Atomic Claiming, Controlled Concurrency)
      ├── OutboxDispatcher (Side effect routing & payload sanitization)
      └── CronScheduler (Lease Recovery, Guest Cart Maintenance, Health Metrics)
```
Key architectural boundaries:
- **No external queue infrastructure**: Uses atomic MongoDB `findOneAndUpdate` for coordination.
- **MongoDB remains authoritative**: Delivery failure never rolls back the committed business operation.
- **Out-of-transaction external delivery**: Network calls (SMTP, Socket.IO) never occur inside database transactions.

---

## 4. Outbox Event Lifecycle
The event transitions across explicit lifecycle states:
```text
                  ┌─────────┐
                  │ pending │
                  └────┬────┘
                       │ (Worker claims due event)
                       ▼
                 ┌────────────┐
                 │ processing │
                 └─────┬──────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
  (Delivery ok)  (Retryable err) (Terminal err / Max attempts)
         │             │             │
         ▼             ▼             ▼
      ┌──────┐    ┌─────────┐    ┌────────┐
      │ sent │    │ pending │    │ failed │
      └──────┘    └─────────┘    └────────┘
```
1. **`pending`**: Event is created or returned to queue after transient failure with `availableAt <= now`.
2. **`processing`**: Atomically claimed by a worker with an active lease (`leaseUntil > now`, `claimedBy: workerId`).
3. **`sent`**: Successfully delivered to all target delivery channels (`processedAt` recorded).
4. **`failed`**: Exceeded configured `OUTBOX_MAX_ATTEMPTS` or failed with a permanent non-retryable error (e.g. malformed recipient email, validation failure). Stored with sanitized `lastError`.

---

## 5. Atomic Claiming & Multi-Instance Safety
Claiming is implemented in `OutboxEventRepository.claimNext`:
```typescript
OutboxEventModel.findOneAndUpdate(
  {
    $or: [
      { status: 'pending', availableAt: { $lte: now } },
      { status: 'processing', leaseUntil: { $lt: now } },
    ],
  },
  {
    $set: {
      status: 'processing',
      leaseUntil: new Date(now.getTime() + leaseDurationMs),
      claimedBy: workerId,
    },
    $inc: { attempts: 1 },
  },
  {
    sort: { availableAt: 1 },
    new: true,
  },
);
```
Guarantees:
- **Race-condition free**: MongoDB document-level locking ensures that if Instance A and Instance B attempt to claim simultaneously, only one instance succeeds.
- **Batch claiming**: `claimBatch(batchSize)` iterates atomic claims sequentially, fetching up to `OUTBOX_BATCH_SIZE` items without locking whole collections.

---

## 6. Lease Mechanism & Crash Recovery
To prevent worker crashes from permanently stalling events:
- Every processing event holds a lease: `leaseUntil = now + OUTBOX_LEASE_MS` (default: 60 seconds).
- Active leases cannot be claimed by other workers (`leaseUntil >= now`).
- **Crash Recovery Case A (Worker dies before completing delivery)**:
  - The worker process terminates abruptly.
  - After `OUTBOX_LEASE_MS`, the lease expires.
  - Periodic `runLeaseRecoveryJob()` or eager claiming recovers the event back to `pending` with `availableAt = now`, preserving attempt history.
  - Another worker claims and completes delivery.
- **Crash Recovery Case B (Delivery succeeds but database status update fails)**:
  - The event is re-claimed on lease expiry.
  - The `OutboxDispatcher` is designed to be replay-tolerant (at-least-once delivery).
  - Subsequent delivery completes and updates status to `sent`.

---

## 7. Retry Policy, Exponential Backoff & Jitter
Managed in `src/jobs/retry.strategy.ts`:
- **Formula**:
  $$\text{Delay} = \min(\text{baseDelayMs} \times 2^{\text{attempts} - 1}, \text{maxDelayMs}) + \text{jitter}$$
- **Bounded Jitter**: Random positive jitter up to 20% of calculated delay avoids synchronized thundering-herd retries across multiple workers.
- **Error Classification**:
  - **Retryable Errors**:
    - Network drops (ECONNREFUSED, ETIMEDOUT, ENOTFOUND)
    - 5xx server / SMTP provider errors
    - 429 Too Many Requests (rate limiting)
    - Transient database lock contention
  - **Terminal Errors**:
    - 4xx client errors (VALIDATION_ERROR, NOT_FOUND, FORBIDDEN, UNAUTHORIZED)
    - Malformed payload or invalid recipient format
    - Unsupported event types
- **Sanitized Error Logging**:
  - `sanitizeError()` strips bearer tokens, passwords, secrets, and truncates long stack traces to prevent sensitive credential leaks into the database.

---

## 8. Delivery Dispatcher & Routing
Implemented in `src/jobs/handlers/outbox-dispatcher.ts`:
- **Realtime Channel (Socket.IO)**:
  - If recipient user exists: `realtimeService.emitToUser(userId, SocketEvents.NOTIFICATION_CREATED, sanitizedPayload)`
  - Order lifecycle: `realtimeService.emitToOrder(orderId, SocketEvents.ORDER_STATUS_CHANGED, sanitizedPayload)`
  - Service lifecycle: `realtimeService.emitToService(serviceId, SocketEvents.SERVICE_REQUEST_CREATED, sanitizedPayload)`
  - Operational admin queue: `realtimeService.emitToAdmin(SocketEvents.ADMIN_QUEUE_CHANGED, sanitizedPayload)`
- **Email Channel (Nodemailer)**:
  - Resolves template from authoritative lifecycle events:
    - `user_registered` / `verify_email` → `verify_email`
    - `password_reset` → `password_reset`
    - `order_created` / `order_confirmed` / `order_accepted` → `order_confirmation`
    - `payment_proof_submitted` / `payment_verified` / `payment_new_proof_requested` → `payment_update`
    - `service_requested` / `quotation_sent` / `quotation_decision_recorded` → `service_update`
  - Sends email with bilingual Arabic/English template, HTML-encoded variables, and deduplication tracking key `email:${dedupeKey}`.
- **Payload Sanitization**: Strips passwords, hashes, JWT tokens, Cloudinary signed URLs, and CVV before emission.

---

## 9. Scheduled Maintenance Jobs (Cron)
Implemented in `src/jobs/cron.ts` via `CronScheduler`:

| Job Name | Schedule | Purpose | Safety / Idempotency |
|----------|----------|---------|----------------------|
| `lease_recovery` | Every 1 min | Requeues expired processing outbox events (`leaseUntil < now`) | Safe updateMany, only touches expired leases |
| `guest_cart_cleanup` | Every 1 hour | Cleans up abandoned guest carts whose explicit `expiresAt` has elapsed | Strictly checks `ownerType: 'guest'` and non-null `expiresAt < now` |
| `auth_token_audit` | Every 2 hours | Audits user authentication statuses (active vs. suspended) | Read-only metric counting |
| `expired_content` | Every 30 mins | Deactivates promotional and announcement banners where `endsAt < now` | Sets `active: false` on expired windowed modules |
| `report_health` | Every 5 mins | Logs outbox backlog statistics and process memory consumption | Read-only metric aggregation |

**Strict Policy Boundary**:
- No reservation expiry periods were invented.
- No notification retention deletion policies were invented.
- No user carts or customer records are deleted.

---

## 10. Environment Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `OUTBOX_POLL_INTERVAL_MS` | number | `5000` | Poller delay between batch runs (in ms) |
| `OUTBOX_MAX_ATTEMPTS` | number | `5` | Maximum delivery attempts before terminal failure |
| `OUTBOX_BATCH_SIZE` | number | `20` | Maximum events claimed per poll cycle |
| `OUTBOX_CONCURRENCY` | number | `5` | Maximum concurrent delivery dispatchers |
| `OUTBOX_LEASE_MS` | number | `60000` | Processing lease duration (in ms) |
| `OUTBOX_SHUTDOWN_TIMEOUT_MS` | number | `10000` | Maximum time to await in-flight jobs on shutdown |
| `CRON_ENABLED` | boolean | `true` | Enables/disables scheduled maintenance jobs |

---

## 11. Database Migration
- **Script**: `src/database/migrations/scripts/20260928_012_outbox_jobs.migration.ts`
- **Migration ID**: `20260928_012_outbox_jobs`
- **Collection**: `outboxEvents`
- **Indexes Created**:
  1. `{ status: 1, availableAt: 1 }` (name: `idx_outbox_events_status_available`)
  2. `{ status: 1, leaseUntil: 1 }` (name: `idx_outbox_events_status_lease`)
  3. `{ status: 1, createdAt: -1 }` (name: `idx_outbox_events_status_created`)
- **Idempotency & Safety**:
  - `up()` checks collection existence and adds named indexes safely.
  - `down()` drops specific indexes non-destructively without dropping collections or deleting records.
  - Registered in `src/database/migrations/index.ts`.

---

## 12. Observability & Backlog Visibility
- `OutboxEventRepository.getBacklogStats()` provides operational metrics:
  ```typescript
  {
    pending: number;
    processing: number;
    failed: number;
    sent: number;
    oldestPendingAgeMs: number | null;
  }
  ```
- Structured logging records:
  - Worker start / stop
  - Events claimed and batch size
  - Successful deliveries with processing durations
  - Retries scheduled with next backoff timestamp
  - Terminal failures with sanitized error code and message
  - Expired leases recovered

---

## 13. Graceful Shutdown Lifecycle
1. On `SIGTERM` / `SIGINT` (or explicit `stop()`):
2. Worker sets `isShuttingDown = true` and `isRunning = false`.
3. Polling timers and cron intervals are cancelled.
4. Active in-flight event dispatches are permitted to complete up to `OUTBOX_SHUTDOWN_TIMEOUT_MS`.
5. Socket.IO and MongoDB connections close cleanly.

---

## 14. Testing Summary
Phase 14 contains 5 dedicated test suites (35 tests, all passing):
1. `tests/unit/outbox-retry-strategy.test.ts` (7 tests) — Exponential backoff calculations, bounded jitter, error classification, redaction of sensitive credentials.
2. `tests/unit/outbox-jobs-migration.test.ts` (3 tests) — Index creation, migration idempotency, safe non-destructive rollback.
3. `tests/integration/outbox-claiming-concurrency.test.ts` (7 tests) — Atomic claiming, lease protection, expired lease reclamation, multi-worker concurrency without duplicate claims.
4. `tests/integration/outbox-worker-lifecycle.test.ts` (7 tests) — Successful delivery, retry scheduling, terminal failure, max attempts handling, Crash Recovery Case A (worker crash) and Case B (interrupted commit replay).
5. `tests/integration/outbox-scheduler-cron.test.ts` (11 tests) — Worker poller start/stop, overlapping poll protection, maintenance cron jobs (`lease_recovery`, `guest_cart_cleanup`, `expired_content`, `auth_token_audit`, `report_health`), CronScheduler lifecycle.

**Full Regression Baseline**:
- Total Test Suites: **105 passed / 105 total**
- Total Tests: **764 passed / 764 total**
- Failures: **0**

---

## 15. Open Decisions Preserved
- **OD-19 (Operational notification/email policy details)**: Preserved. No marketing campaigns, arbitrary SLAs, or unconfirmed delivery triggers were introduced.
- **Reservation Expiry Duration**: Preserved as open decision. The cron runner does not invent unapproved inventory reservation cancellation periods.
- **Notification Retention Policy**: Preserved. Outbox records and notification records remain intact without speculative pruning.

---

## 16. Scope Boundary
```text
Phase 14 complete.
Only Outbox / Jobs functionality was implemented.
Phase 15 Reports / Audit was NOT implemented.
Phase 16 Full Testing was NOT implemented.
Phase 17 Security Hardening was NOT implemented.
Phase 18 Deployment was NOT implemented.
```
