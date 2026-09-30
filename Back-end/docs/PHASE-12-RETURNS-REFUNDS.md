# Phase 12 — Returns & Refunds Implementation

## 1. Phase Status
- **Phase**: 12 — Returns & Refunds
- **Status**: COMPLETE
- **Architecture**: Modular Monolith, Express.js, TypeScript, MongoDB, Mongoose, REST `/api/v1`
- **Dependencies**: Integrated with Orders, Inventory, Payments (Configuration), Audit, and Outbox/Notification persistence abstraction.

---

## 2. Requirement Matrix

### Returns Requirements (RET-001 – RET-004)
| Requirement | Description | Status | Verification |
|-------------|-------------|--------|--------------|
| **RET-001** | Item-level customer return request submission with ownership and order eligibility validation | COMPLETE | `return-api.test.ts`, `returns-schema.test.ts` |
| **RET-002** | Configurable return eligibility evaluation preventing duplicate active returns and over-quantity requests | COMPLETE | `return-api.test.ts`, `returns-schema.test.ts`, `return-concurrency.test.ts` |
| **RET-003** | Admin return review workflow (approve/reject) with status transition guards and admin notes | COMPLETE | `return-api.test.ts`, `return-concurrency.test.ts` |
| **RET-004** | Atomic return approval, refund initiation, and inventory restoration in a single MongoDB transaction | COMPLETE | `return-api.test.ts`, `return-concurrency.test.ts` |

### Refunds Requirements (REF-001 – REF-003)
| Requirement | Description | Status | Verification |
|-------------|-------------|--------|--------------|
| **REF-001** | Authoritative manual refund records with integer minor units (`amountMinor`, currency: `"EGP"`) | COMPLETE | `return-api.test.ts`, `returns-schema.test.ts` |
| **REF-002** | Manual refund initiation linked strictly to approved return requests | COMPLETE | `return-api.test.ts`, `return-concurrency.test.ts` |
| **REF-003** | Admin manual refund completion with attempt reference, transition to `refund_completed`, and atomic commit | COMPLETE | `return-api.test.ts`, `return-concurrency.test.ts` |

---

## 3. Return Domain Model
The return aggregate follows the hierarchy:
```text
Order ──(1..*)──> Return Request ──(1..0..1)──> Refund
```
Collections:
- `returnRequests`
- `refunds`

### Return Request Entity (`returnRequests`)
- `reference`: Unique human-readable reference formatted as `RET-YYYYMMDD-XXXXXX`.
- `orderId`: Reference to the parent product order.
- `customerId`: Authenticated customer who placed the order.
- `items[]`: Array of item-level return requests:
  - `orderItemId`: Product ID / stock item key corresponding to the order item.
  - `quantity`: Positive integer count of items being returned.
  - `reason`: Reason string (e.g., `damaged_item`, `defective`, `wrong_item`, etc.).
  - `eligible`: Server-evaluated eligibility boolean.
  - `evidenceMetadata[]`: Optional structured evidence objects (e.g. URI, mimeType, description).
- `status`: Return status enum.
- `customerNote`: Optional customer remarks.
- `adminNote`: Optional administrator review notes.
- `reviewedBy`: Admin user ID who reviewed the request.
- `reviewedAt`: Timestamp of the admin review.
- `refundId`: Reference to the generated manual refund document (once approved).
- `version`: Optimistic locking version number.
- `createdAt` / `updatedAt`: UTC timestamps.

---

## 4. Refund Domain Model
- `orderId`: Reference to the parent order.
- `returnRequestId`: Reference to the approved return request.
- `customerId`: Customer receiving the refund.
- `amountMinor`: Non-negative integer minor units (EGP piasters). Calculated server-side from authoritative order line item unit price.
- `currency`: Snapshotted currency `"EGP"`.
- `methodKey`: Refund method resolved from approved configuration (e.g. `"manual_bank_transfer"`, `"instapay"`, `"cash_on_return"`).
- `status`: Refund status (`initiated`, `completed`, `failed`).
- `recordedBy`: Admin user ID initiating/recording the refund.
- `recordedAt`: Timestamp of refund record creation.
- `completedAt`: Timestamp when refund was marked completed.
- `note`: Operational/manual audit note.
- `attemptReference`: Internal manual attempt reference / transaction tracking identifier.
- `version`: Optimistic locking version number.
- `createdAt` / `updatedAt`: UTC timestamps.

---

## 5. Return Lifecycle State Machine
```text
                    ┌─────────────────┐
                    │ return_requested│
                    └────────┬────────┘
                             │ (Initial state on creation)
                             ▼
                    ┌─────────────────┐
                    │  return_review  │
                    └────┬───────┬────┘
                         │       │
       Admin Approves    │       │   Admin Rejects
                         ▼       ▼
       ┌──────────────────┐     ┌─────────────────┐
       │ return_approved  │     │ return_rejected │
       └────────┬─────────┘     └─────────────────┘
                │ (Atomic with refund record creation)
                ▼
       ┌──────────────────┐
       │ refund_initiated │
       └────────┬─────────┘
                │ (Admin completes manual refund)
                ▼
       ┌──────────────────┐
       │ refund_completed │
       └──────────────────┘
```

Guards:
- Client cannot specify target status directly.
- Customers can only initiate `return_requested` (which enters `return_review`).
- Only Admins with `returns:review` or `returns:manage` permissions can transition to `return_approved` or `return_rejected`.
- Return approval immediately transitions to `refund_initiated` in the same transaction that creates the `refunds` document.
- Only Admins with `refunds:manage` can complete a refund, moving return request to `refund_completed`.

---

## 6. Refund Lifecycle State Machine
```text
  [Approved Return]
         │
         ▼
    ┌───────────┐
    │ initiated │
    └─────┬─────┘
          │
     ┌────┴────┐
     ▼         ▼
┌───────────┐ ┌────────┐
│ completed │ │ failed │
└───────────┘ └────────┘
```
- A refund is created in `initiated` status upon return approval.
- An administrator executes the manual refund offline (cash, bank transfer, InstaPay) and marks the record `completed` providing an `attemptReference`.
- Transitioning to `completed` sets `completedAt` and updates the linked return request to `refund_completed`.
- A failed attempt sets `status: 'failed'` for historical tracking.

---

## 7. Return Eligibility Engine
Eligibility is always calculated strictly server-side:
1. **Order Existence & State**:
   - Order must exist.
   - Order fulfillment must be `delivered` (or order status `delivered` / `completed`).
2. **Ownership**:
   - Order `customerId` must match the authenticated user.
3. **Item Existence**:
   - Every returned item's `orderItemId` must match a product/item in the order.
4. **Quantity Validation**:
   - Requested quantity must be a positive integer $\ge 1$.
   - Must not exceed ordered quantity minus all quantities in active (`return_requested`, `return_review`, `return_approved`, `refund_initiated`, `refund_completed`) return requests for that item.
5. **No Parallel Conflicts**:
   - Submissions for already fully returned items are rejected with `RETURN_QUANTITY_INVALID` or `RETURN_ALREADY_EXISTS`.
6. **Optimistic Locking**:
   - Uses an optimistic version check on the order to prevent concurrent submissions from exceeding item limits.

---

## 8. Ownership & IDOR Protection
- Authenticated customer ID is extracted directly from the verified JWT / session (`req.user.userId`).
- Customers can only read return requests where `customerId == req.user.userId`.
- Attempts to query or request returns against another user's order fail with `RETURN_OWNERSHIP_DENIED` (403) or `NOT_FOUND` (404).
- Customer responses use sanitized projections: administrative audit notes, reviewer IDs, and internal operational data are stripped.
- Customer has zero access to manual refund administration endpoints (`/api/v1/admin/returns/*`, `/api/v1/admin/refunds/*`).

---

## 9. Admin Review Workflow
- Admin endpoints require `returns:review` or `returns:manage` permissions.
- **Admin Review Queue**:
  - `GET /api/v1/admin/returns`
  - Supports pagination (`page`, `limit`) and status filtering (`status=return_requested`, etc.).
- **Admin Approval**:
  - `POST /api/v1/admin/returns/:reference/approve`
  - Atomically validates return status, checks concurrency, transitions to `return_approved` -> `refund_initiated`, generates the `refunds` document, restores product stock in the inventory ledger, and logs audit events.
- **Admin Rejection**:
  - `POST /api/v1/admin/returns/:reference/reject`
  - Transitions to `return_rejected`, records `adminNote`, `reviewedBy`, `reviewedAt`, and emits audit & outbox records.

---

## 10. Transaction Boundaries
Phase 12 enforces strict MongoDB multi-document transactions with atomic rollback on any failure:

### A. Approve Return + Initiate Refund + Restock Inventory
- Single MongoDB transaction:
  1. Load return request and re-validate status (`return_requested` or `return_review`).
  2. Optimistic concurrency check: update status with version increment.
  3. Resolve item line prices from parent order to calculate `refundAmountMinor`.
  4. Create `refunds` document with `status: initiated` and `methodKey`.
  5. Update return request with `refundId` and `status: refund_initiated`.
  6. Call `inventoryService.restoreReturnedStock` to restore available stock for returned items and append an `ADJUSTMENT` ledger entry.
  7. Write audit log entries.
  8. Write outbox event records.
  9. Commit transaction.

### B. Complete Refund
- Single MongoDB transaction:
  1. Load refund document and verify `status === 'initiated'`.
  2. Perform optimistic update on refund: `status: 'completed'`, `completedAt: new Date()`, `attemptReference`, incrementing version.
  3. Update linked return request to `status: 'refund_completed'`.
  4. Check if all items in order are returned; if so, update order fulfillment/status to `returned`.
  5. Write audit log entries.
  6. Write outbox event records.
  7. Commit transaction.

---

## 11. Inventory Interaction
- Directly mutating raw product quantities from the Returns module is strictly forbidden.
- Returns interact with Inventory via `inventoryService.restoreReturnedStock(...)`.
- `restoreReturnedStock` increments `stockQuantity` on the product document and inserts an authoritative ledger record:
  - `type: 'ADJUSTMENT'`
  - `referenceType: 'RETURN'`
  - `referenceId: returnRequest.reference`
  - `reason: 'Customer return approved: <reference>'`
- Executed inside the active MongoDB session of the approval transaction.

---

## 12. Audit Logging
Every lifecycle event is recorded in the immutable audit log with:
- `actorId`, `actorRole`
- `action`:
  - `return.requested`
  - `return.approved`
  - `return.rejected`
  - `refund.initiated`
  - `refund.completed`
  - `refund.failed`
- `entityType`: `'return_request'` or `'refund'`
- `entityId`: Reference / ObjectId
- `previousState` and `newState`
- `metadata`: Items count, refund amount minor, currency, attempt reference.

---

## 13. Notification & Outbox Persistence
Lifecycle events are persisted to the `outbox` collection:
- `RETURN_REQUESTED`
- `RETURN_APPROVED`
- `RETURN_REJECTED`
- `REFUND_INITIATED`
- `REFUND_COMPLETED`
*(Note: As mandated by Phase 12 boundaries, actual Socket.IO/email delivery and outbox polling workers are deferred to Phases 13 and 14).*

---

## 14. Database Schemas & Indexes

### Collection: `returnRequests`
```typescript
{
  reference: string;           // Indexed (unique)
  orderId: Types.ObjectId;     // Indexed
  customerId: Types.ObjectId;  // Indexed
  items: Array<{
    orderItemId: string;
    quantity: number;
    reason: string;
    eligible: boolean;
    evidenceMetadata: Array<{ key: string; value: string }>;
  }>;
  status: ReturnStatus;        // Indexed
  customerNote?: string;
  adminNote?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  refundId?: Types.ObjectId;   // Reference to refunds
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```
Indexes:
- `{ reference: 1 }` (unique)
- `{ orderId: 1, createdAt: -1 }`
- `{ customerId: 1, createdAt: -1 }`
- `{ status: 1, createdAt: -1 }`

### Collection: `refunds`
```typescript
{
  orderId: Types.ObjectId;         // Indexed
  returnRequestId: Types.ObjectId; // Indexed (unique)
  customerId: Types.ObjectId;      // Indexed
  amountMinor: number;             // Non-negative integer
  currency: 'EGP';
  methodKey: string;
  status: RefundStatus;            // Indexed
  recordedBy: Types.ObjectId;
  recordedAt: Date;
  completedAt?: Date;
  note?: string;
  attemptReference?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```
Indexes:
- `{ returnRequestId: 1 }` (unique)
- `{ orderId: 1, createdAt: -1 }`
- `{ customerId: 1, createdAt: -1 }`
- `{ status: 1, createdAt: -1 }`

---

## 15. Migration
- **Script**: `20260928_010_returns_refunds.migration.ts`
- **Identifier**: `20260928_010_returns_refunds`
- **Actions**:
  - `up()`: Ensures `returnRequests` and `refunds` collections exist and idempotently builds required indexes.
  - `down()`: Safely drops indexes without dropping collections or deleting business data.

---

## 16. API Routes
All routes prefixed with `/api/v1`:

### Customer Routes
- `POST /orders/:orderReference/returns`: Submit item-level return request for an order.
- `GET /returns`: List current customer's return requests (paginated).
- `GET /returns/:reference`: Get detail of customer's return request.

### Admin Routes
- `GET /admin/returns`: List all return requests (paginated, filterable by status).
- `GET /admin/returns/:reference`: Get complete detail of a return request.
- `POST /admin/returns/:reference/approve`: Approve return, initiate manual refund, and restore stock.
- `POST /admin/returns/:reference/reject`: Reject return request with reason.
- `GET /admin/refunds`: List all manual refund records (paginated, filterable by status).
- `GET /admin/refunds/:id`: Get refund record detail.
- `POST /admin/refunds/:id/complete`: Complete a manual refund with attempt reference.

---

## 17. Error Codes
Registered in `ErrorCodes`:
- `RETURN_NOT_FOUND`
- `RETURN_OWNERSHIP_DENIED`
- `RETURN_NOT_ELIGIBLE`
- `RETURN_ITEM_NOT_FOUND`
- `RETURN_QUANTITY_INVALID`
- `RETURN_STATE_CONFLICT`
- `RETURN_ALREADY_EXISTS`
- `RETURN_POLICY_UNAVAILABLE`
- `REFUND_NOT_FOUND`
- `REFUND_STATE_CONFLICT`
- `REFUND_ALREADY_COMPLETED`
- `REFUND_METHOD_UNAVAILABLE`
- `REFUND_AMOUNT_UNAVAILABLE`

---

## 18. Testing & Verification

### Test Coverage
- **Unit Tests**:
  - `tests/unit/returns-schema.test.ts`: Zod schema validation, quantity checks, injection protection (8 tests).
  - `tests/unit/returns-refunds-migration.test.ts`: Migration idempotency, up/down non-destructive operations (3 tests).
- **API Tests**:
  - `tests/api/return-api.test.ts`: Full customer creation, admin approve/reject, IDOR tests, manual refund completion, safe customer projections (9 tests).
- **Integration & Concurrency Tests**:
  - `tests/integration/return-concurrency.test.ts`:
    - `RETURN-RACE-01`: Concurrent return approvals prevent duplicate refunds and double restocking.
    - `REFUND-RACE-01`: Concurrent refund completions result in exactly one successful completion.
    - `RETURN-RACE-02`: Concurrent return submissions for the same order item prevent double return requests.

---

## 19. Open Decisions Preserved
- **OD-15: Return Policy Window**: Category-specific return periods and non-returnable categories remain configuration-driven. No arbitrary hardcoded days (7/14/30) were introduced.
- **OD-16: Refund Processing SLA**: Refund turnaround SLA remains uncommitted. Manual refund states are tracked accurately without artificial timeouts or fake SLA promises.

---

## 20. Absolute Scope Boundary
- Phase 12 strictly implemented Returns & Refunds.
- No Phase 13 Notifications & Realtime delivery was implemented.
- No Phase 14 Outbox worker/jobs/cron was implemented.
- No Phase 15 Reports were implemented.
- No Phase 16 Full Testing was implemented.
- No Phase 17 Security Hardening was implemented.
- No Phase 18 Deployment was implemented.
- No automated payment gateway refund APIs (Stripe, PayPal, InstaPay API) were implemented.
- Manual refunds represent verified operational financial records.
