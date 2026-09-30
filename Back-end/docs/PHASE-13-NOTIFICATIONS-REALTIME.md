# Phase 13 — Notifications, Realtime & Email Delivery Contracts

## 1. Phase Status
- **Phase**: 13 — Notifications / Realtime / Email Delivery Contracts
- **Status**: COMPLETE
- **Architecture**: Modular Monolith, Express.js, TypeScript, MongoDB, Mongoose, Socket.IO, Nodemailer, REST `/api/v1`
- **Dependencies**: Integrated with Orders, Payments, Services, Pre-orders, Returns, Refunds, Users, Audit, Outbox persistence.
- **Strict Boundary**: Phase 13 establishes persisted notifications, customer APIs, Socket.IO handshake auth & room boundaries, email adapter contracts, and outbox event creation. No Phase 14 worker/retry/cron implementation was added.

---

## 2. Requirement Matrix

### Notifications Requirements (NOT-001 – NOT-004)
| Requirement | Description | Status | Verification |
|-------------|-------------|--------|--------------|
| **NOT-001** | In-app notifications for order, payment, service, pre-order, and return/refund lifecycle events (Section 11 Notification Matrix) | COMPLETE | `notification-api.test.ts`, `notification-transaction.test.ts`, `notification-schema.test.ts` |
| **NOT-002** | Transactional email delivery contract for account verification, password reset, and transactional communications | COMPLETE | `email-adapter.test.ts` |
| **NOT-003** | System does NOT rely on WhatsApp as automated notification channel (remains manual action only) | COMPLETE | Adhered to across all modules (no automated WhatsApp hooks) |
| **NOT-004** | Real-time-eligible events pushed via Socket.IO to relevant Admin/Owner operational sessions and affected customer sessions | COMPLETE | `realtime-socket.test.ts` |

### Real-Time Events Requirements (RT-001 – RT-003)
| Requirement | Description | Status | Verification |
|-------------|-------------|--------|--------------|
| **RT-001** | Push real-time updates for new orders, new service requests, payment proofs, status changes, and customer updates | COMPLETE | `realtime-socket.test.ts` |
| **RT-002** | MongoDB database remains authoritative source of truth; Socket.IO and email are delivery mechanisms only, not data stores | COMPLETE | `notification-transaction.test.ts`, `realtime-socket.test.ts` |
| **RT-003** | Delivery failure or disconnection does not roll back business operations; state changes persist and are retrievable on reconnect | COMPLETE | `notification-transaction.test.ts`, `realtime-socket.test.ts`, `email-adapter.test.ts` |

---

## 3. Architecture & Source-of-Truth Rules
1. **Authoritative Persistence**:
   - MongoDB is the single source of truth.
   - A notification is created when its MongoDB record is committed.
2. **Delivery Separation**:
   - Socket.IO and Email are delivery channels, not source-of-truth.
   - If Socket.IO is down or email fails, the underlying business mutation remains committed.
   - No external network calls (SMTP, Socket.IO) are performed inside MongoDB transactions.
3. **Transaction Lifecycle**:
   ```text
   Business Mutation
          ↓
   Notification Record
          ↓
   Outbox Event Record
          ↓
   COMMIT (Single MongoDB Transaction)
          ↓
   Out-of-transaction: Socket.IO emission / Future worker delivery
   ```

---

## 4. Notification Domain Model
Collection: `notifications`
Mongoose schema options: `{ strict: 'throw', timestamps: true }`.

### Fields:
- `_id`: ObjectId primary key.
- `recipientUserId`: ObjectId reference to recipient `users._id` (indexed).
- `type`: Enum of 16 authoritative lifecycle events:
  - `user_registered`, `email_verified`, `order_created`, `order_accepted`, `order_rejected`, `payment_proof_submitted`, `payment_verified`, `payment_new_proof_requested`, `order_confirmed`, `order_fulfillment_changed`, `service_requested`, `quotation_sent`, `quotation_decision_recorded`, `preorder_status_changed`, `return_status_changed`, `refund_completed`.
- `title`: String summary / heading.
- `message`: String message body / text.
- `channel`: Notification channel enum (`in_app`, `email`, `all`). Default: `in_app`.
- `relatedEntity`: Polymorphic entity reference:
  - `entityType`: `"order" | "payment" | "service" | "user" | "return"`
  - `entityId`: ObjectId reference to related document
- `metadata`: Flexible Record<string, unknown> for safe non-sensitive metadata.
- `readAt`: UTC Date when recipient marked notification as read (null when unread).
- `dedupeKey`: Deterministic unique deduplication string with partial index filter.
- `createdAt` / `updatedAt`: BSON UTC timestamps.

### Database Indexes:
1. `{ recipientUserId: 1, createdAt: -1 }`: Fast customer timeline retrieval.
2. `{ recipientUserId: 1, readAt: 1, createdAt: -1 }`: Unread-first queries and unread counting.
3. `{ dedupeKey: 1 }` with `{ unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } }`: Guarantees idempotency and prevents duplicate notifications.

---

## 5. Deduplication Strategy
Deterministic dedupe keys prevent duplicate notifications when mutations are re-evaluated or retried:
- **Order lifecycle**: `order:<orderId>:status:<status>:<version>`
- **Payment lifecycle**: `payment:<paymentId>:status:<status>:<version>`
- **Service lifecycle**: `service:<serviceRequestId>:status:<status>:<version>`
- **Return lifecycle**: `return:<returnRequestId>:status:<status>:<version>`
- **Refund lifecycle**: `refund:<refundId>:status:completed:<version>`
- **User registration**: `user:<userId>:registered`
- **Email verification**: `user:<userId>:email_verified`

---

## 6. Socket.IO Realtime Integration
Implemented in `src/realtime/`:
- **Handshake Authentication** (`src/realtime/socket/socket.auth.ts`):
  - Extracts JWT token from `socket.handshake.auth.token` or `socket.handshake.headers.authorization`.
  - Verifies token signature and expiration via `jwtService.verifyAccessToken`.
  - Validates user account status (rejects `isSuspended: true`).
  - Validates session version (`tokenVersion === user.tokenVersion`) ensuring immediate revocation on password reset or token revocation.
  - Attaches user context to `socket.data.user`.

- **Room Authorization & Boundaries** (`src/realtime/socket/socket.rooms.ts`):
  - `user:{userId}`: Joined automatically upon authentication for personal notifications and updates.
  - `order:{orderId}`: Allowed only for the order customer owner or Admin/Owner with `orders.read` permission.
  - `service:{serviceId}`: Allowed only for the service request customer owner or Admin/Owner with `services.read` permission.
  - `admin:operational`: Restricted to Admin/Owner users with operational permissions (`orders.read`, `payments.verify`, or `services.read`).
  - **Zero Existence Leakage**: Unauthorized room join attempts return a generic forbidden response (`SOCKET_UNAUTHORIZED_ROOM`) without leaking whether the targeted entity exists.

- **Namespaced Event Contract** (`src/realtime/events/socket.events.ts`):
  - `notification.created`
  - `order.status_changed`
  - `payment.proof_submitted`
  - `service.request_created`
  - `service.quotation_sent`
  - `admin.queue_changed`

- **Payload Sanitization**:
  - Emitted payloads are stripped of passwords, tokens, payment proof URLs, sensitive account details, and private PII.

---

## 7. Email Integration Adapter
Implemented in `src/integrations/email/`:
- **Contract Interface** (`EmailService`):
  ```typescript
  interface EmailService {
    send(input: {
      to: string;
      template:
        | 'verify_email'
        | 'password_reset'
        | 'order_confirmation'
        | 'payment_update'
        | 'service_update';
      locale: 'ar' | 'en';
      variables: Record<string, string | number>;
      dedupeKey: string;
    }): Promise<{
      providerMessageId?: string;
    }>;
  }
  ```
- **Bilingual Templates** (`email.templates.ts`):
  - Arabic (`ar`) and English (`en`) support with HTML and plain-text fallback.
  - Variables are sanitized with HTML-encoding to prevent injection.
  - Strict exclusion of secrets, passwords, tokens, and proof URLs.
- **Provider Implementation** (`email.service.ts`):
  - Standard Nodemailer transporter configurable via SMTP / Gmail / private mail server.
  - In `test` environment, captures sent emails in memory (`sentEmails[]`) without requiring network calls.
  - Failure is handled without rolling back business operations.

---

## 8. Outbox Contract Integration
Collection: `outboxEvents`
Model: `src/modules/notifications/models/outbox-event.model.ts`
- **Fields**:
  - `eventType`: String event name.
  - `aggregateType`: `"order" | "payment" | "service" | "user" | "return"`.
  - `aggregateId`: ObjectId reference.
  - `payload`: Safe minimal payload.
  - `dedupeKey`: Deterministic deduplication key with unique partial index.
  - `status`: `"pending" | "processing" | "sent" | "failed"`. Initial status is `"pending"`.
  - `attempts`: Non-negative integer counter (starts at `0`).
  - `availableAt`: Date timestamp for polling eligibility.
  - `processedAt`: Optional date when worker completes delivery.
  - `lastError`: Optional error message.
- **Transactional Atomicity**:
  - `recordLifecycleNotification` commits the `INotification` and the `IOutboxEvent` within the originating MongoDB transaction.

---

## 9. Customer Notification REST APIs
Base Route: `/api/v1/notifications` (Protected: `authenticate`)

| Method | Endpoint | Description | Validation |
|--------|----------|-------------|------------|
| `GET` | `/api/v1/notifications` | List current user's notifications (paginated, unread-first) | `listNotificationsQuerySchema` |
| `GET` | `/api/v1/notifications/unread-count` | Get total unread notifications count | None |
| `GET` | `/api/v1/notifications/:id` | Get single notification with ownership enforcement | `notificationIdParamSchema` |
| `PATCH`| `/api/v1/notifications/:id/read` | Mark specific notification as read | `notificationIdParamSchema` |
| `POST` | `/api/v1/notifications/mark-all-read` | Mark all unread notifications of user as read | None |

### Security & Isolation:
- Ownership isolation: Customers can only query, read, or mark their own notifications (`recipientUserId === req.user._id`).
- Safe customer projection: Internal audit metadata, provider delivery keys, and dedupe hashes are stripped.

---

## 10. Database Migration
- **Script**: `src/database/migrations/scripts/20260928_011_notifications.migration.ts`
- **Migration ID**: `20260928_011_notifications`
- **Collection**: `notifications`
- **Indexes Created**:
  1. `{ recipientUserId: 1, createdAt: -1 }`
  2. `{ recipientUserId: 1, readAt: 1, createdAt: -1 }`
  3. `{ dedupeKey: 1 }` with `{ unique: true, partialFilterExpression: { dedupeKey: { $type: "string" } } }`
- **Idempotency & Safety**:
  - `up()` checks for collection existence and applies indexes idempotently.
  - `down()` drops custom indexes non-destructively without dropping collections or deleting business data.
  - Fully registered in `src/database/migrations/index.ts`.

---

## 11. Environment Configuration
Environment variables used:
- `SMTP_HOST`: Host of the SMTP server.
- `SMTP_PORT`: Port for SMTP connection (e.g., 587, 465).
- `SMTP_SECURE`: Boolean `"true"` or `"false"` (TLS).
- `SMTP_USER`: Authentication username.
- `SMTP_PASS`: Authentication password.
- `EMAIL_FROM`: Default sender address (e.g. `no-reply@al-azhari.com`).
- `JWT_ACCESS_SECRET`: Secret key used for verifying Socket.IO handshake JWT tokens.

---

## 12. Verification & Test Suite Summary
Phase 13 includes 6 dedicated test suites across unit, integration, and API layers:
1. `tests/unit/notification-schema.test.ts` (4 tests) — Zod query schemas, pagination limits, ObjectId validation.
2. `tests/unit/email-adapter.test.ts` (4 tests) — Email service contract, bilingual rendering, secret omission, dedupe handling.
3. `tests/unit/notifications-migration.test.ts` (3 tests) — Migration idempotency, non-destructive rollback, partial index verification.
4. `tests/api/notification-api.test.ts` (9 tests) — Authenticated customer endpoints, pagination, unread ordering, ownership isolation, mark-as-read.
5. `tests/integration/realtime-socket.test.ts` (15 tests) — Socket.IO handshake JWT auth, session revocation, room boundaries, permission gating, payload sanitization.
6. `tests/integration/notification-transaction.test.ts` (5 tests) — Atomic business mutation + notification + outbox commit, rollback guarantees, deduplication enforcement.

**Phase 13 Test Suite Total**: 40 passed / 40 total
**Entire Backend Suite Total**: 100 passed / 100 total (729 tests, 0 failures)

---

## 13. Open Decisions Preserved
- **OD-19 (Operational notification and email policy details)**:
  - Preserved strictly.
  - No arbitrary recipient rules, retention policies, marketing emails, or invented delivery SLAs were introduced.
  - Notification and email dispatch remains driven by configuration and authoritative lifecycle triggers.

---

## 14. Explicit Scope Boundary
- No Phase 14 Outbox worker polling, retry scheduler, lease recovery worker, or cron jobs were implemented.
- No Phase 15 Reports work was implemented.
- No Phase 16 Full Testing work was implemented.
- No Phase 17 Security Hardening work was implemented.
- No Phase 18 Deployment work was implemented.
