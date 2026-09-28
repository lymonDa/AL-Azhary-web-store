# Phase 9 — Payments Implementation Documentation

## 1. Scope
Phase 9 establishes the authoritative **Payments** subsystem for the **AL-AZHARI LIBRARY** backend.
It covers:
- Configuration-driven payment methods (Cash on Delivery, InstaPay, Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay).
- Immutable payment method snapshots (`payments.methodSnapshot`) capturing customer-facing details and instructions at order creation time.
- Cash on Delivery (COD) handling where `proofRequired = false` (no proof upload allowed).
- Non-COD manual electronic transfer workflows where `proofRequired = true`.
- Constrained Cloudinary direct-upload signing scoped strictly to the payment-proof folder (`al-azhari/payment-proofs`) and image resource type.
- Strict upload metadata verification (format, file byte size, dimensions, resource type, folder ownership).
- Private payment proof storage (`paymentProofs` collection) with sequential integer `submissionNumber`.
- Customer and guest proof submission with idempotency protection and atomic multi-document transaction boundaries.
- Admin payment review workflows (`confirm`, `reject`, `request-new-proof`) protected by `payments.review` RBAC permission and optimistic concurrency versioning (`expectedVersion`).
- Explicit separation between Payment state machine and Order state machine.
- Short-lived signed URLs for authorized administrative proof inspection without storing permanent public URLs.
- Append-only audit logging and transactional outbox event creation (`payment_submitted`, `payment_verified`, `payment_rejected`, `payment_proof_requested`).
- Non-destructive database migration (`20260928_007_payments.migration.ts`) with blueprint indexes.

---

## 2. PAY-001 – PAY-008 Traceability

| ID | Requirement Statement | Implementation Mapping | Status |
| :--- | :--- | :--- | :--- |
| **PAY-001** | The system SHALL allow the customer to select InstaPay or an approved electronic wallet (Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay) as a payment method. | Configuration-driven registry in `payment-methods.config.ts`, validated during checkout and payment creation. | **CONFIRMED** |
| **PAY-002** | The system SHALL allow the customer to upload one or more payment screenshots as proof of payment. | `POST /api/v1/orders/:reference/payment-proofs` accepts 1 to 5 uploaded image metadata objects. | **CONFIRMED** |
| **PAY-003** | The system SHALL NOT integrate any external/automated payment gateway. | Zero gateway SDKs (no Stripe, PayPal, Fawry API). Zero customer transaction ID input fields. Fully manual review model. | **CONFIRMED** |
| **PAY-004** | The system SHALL allow Admin to Confirm Payment, Reject Payment, or Request New Proof for a submitted payment. | `POST /admin/payments/:id/confirm`, `POST /admin/payments/:id/reject`, `POST /admin/payments/:id/request-new-proof`. | **CONFIRMED** |
| **PAY-005** | If Admin rejects payment proof, the order SHALL move to Awaiting New Proof, and the customer SHALL be able to submit new screenshot(s). | Admin rejection/request-new-proof sets order status to `awaiting_new_proof`, payment to `rejected` or `new_proof_requested`, enabling subsequent proof upload with incremented `submissionNumber`. | **CONFIRMED** |
| **PAY-006** | The system SHALL store uploaded payment screenshots via the approved media storage provider (Cloudinary). | Cloudinary direct-upload with constrained signed policy. Stores only metadata in `paymentProofs.files[]`; private assets served via temporary signed URLs. | **CONFIRMED** |
| **PAY-007** | The system SHALL maintain an audit trail of payment-related actions: actor, action, timestamp, and resulting state transition. | Centralized `AuditService` records `payment.proof_submitted`, `payment.confirmed`, `payment.rejected`, and `payment.new_proof_requested`. | **CONFIRMED** |
| **PAY-008** | The system SHALL NOT expose internal audit-trail detail to the customer beyond what is necessary for their own order transparency. | Customer projection (`toSafeCustomerPaymentResponse`) returns safe submission status and notes; internal review detail, actor IDs, and audit records are excluded. | **CONFIRMED** |

---

## 3. Payment Model (`payments`)

Defined in `src/modules/payments/models/payment.model.ts` and mapped to collection `payments`:

```text
payments
├── _id: ObjectId
├── ownerType: 'order' | 'serviceQuotation'
├── ownerId: ObjectId (references orders or future service quotations)
├── customerId: ObjectId | null (references User, null for guest checkout)
├── methodKey: string ('cod' | 'instapay' | 'vodafone_cash' | ...)
├── methodSnapshot: Object (immutable snapshot of name, type, instructions, details)
├── amountDueMinor: Integer >= 0 (in EGP minor units/piastres, server-authoritative)
├── currency: 'EGP'
├── status: PaymentStatus ('not_submitted' | 'under_review' | 'confirmed' | 'rejected' | 'new_proof_requested')
├── proofRequired: Boolean (false for COD, true for electronic transfers)
├── proofSubmissionCount: Integer >= 0 (tracks total submissions)
├── confirmedAt: Date | null
├── rejectedAt: Date | null
├── metadata: Record<string, unknown> (excludes secrets and transaction IDs)
├── version: Integer >= 1 (optimistic locking counter)
├── createdAt: Date
└── updatedAt: Date
```

---

## 4. Payment State Machine

The payment lifecycle is separate from the order lifecycle:

```text
     ┌────────────────┐
     │ not_submitted  │ (Initial state after Order acceptance)
     └───────┬────────┘
             │ customer submits proof
             ▼
     ┌────────────────┐
     │  under_review  │
     └───┬───┬────┬───┘
         │   │    │
  Admin  │   │    │ Admin
 Confirm │   │    │ Reject
         │   │    ▼
         │   │   ┌───────────────┐
         │   │   │   rejected    │ (Terminal review result for submission;
         │   │   └───────┬───────┘  customer may re-upload per retry policy)
         │   │           │
         │   │ Admin     │ customer submits new proof
         │   │ Request   ▼
         │   │ New Proof ┌─────────────────────┐
         │   └──────────►│ new_proof_requested │
         │               └──────────┬──────────┘
         │                          │ customer submits new proof
         │                          ▼
         │               ┌─────────────────────┐
         │               │    under_review     │
         │               └─────────────────────┘
         ▼
 ┌───────────────┐
 │   confirmed   │ (Terminal financial state; further proofs strictly blocked)
 └───────────────┘
```

Valid transition table enforced by `validatePaymentTransition()`:
- `not_submitted` ──► `under_review`, `proof_uploaded`
- `under_review` ──► `confirmed`, `rejected`, `new_proof_requested`
- `new_proof_requested` ──► `under_review`, `proof_uploaded`
- `rejected` ──► `under_review`, `proof_uploaded`
- `confirmed` ──► `[]` (Terminal, no transitions permitted)

---

## 5. Payment Proof Model (`paymentProofs`)

Defined in `src/modules/payments/models/payment-proof.model.ts` and mapped to collection `paymentProofs`:

```text
paymentProofs
├── _id: ObjectId
├── paymentId: ObjectId (references payments)
├── ownerType: 'order' | 'serviceQuotation'
├── ownerId: ObjectId
├── customerId: ObjectId | null
├── submissionNumber: Integer >= 1 (sequential per payment)
├── files: Array of proof files:
│   ├── cloudinaryPublicId: string (e.g., 'al-azhari/payment-proofs/...')
│   ├── resourceType: 'image'
│   ├── format: 'png' | 'jpeg' | 'jpg' | 'webp'
│   ├── bytes: Integer (1 to 10MB)
│   ├── width: Integer | null
│   ├── height: Integer | null
│   └── sha256: string | null
├── status: 'uploaded' | 'under_review' | 'confirmed' | 'rejected' | 'new_proof_requested'
├── customerNote: string | null (max 500 chars)
├── reviewNote: string | null (admin review explanation)
├── reviewedBy: ObjectId | null (Admin User ID)
├── reviewedAt: Date | null
├── createdAt: Date
└── updatedAt: Date
```

---

## 6. Cloudinary Architecture & Flow

```text
[Customer / Client]              [Backend API]                    [Cloudinary CDN]
         │                              │                                 │
         │ 1. POST /payment-proof/upload-config                           │
         │─────────────────────────────►│                                 │
         │                              │ Generate constrained signature  │
         │ 2. Return signed policy      │ (scoped to folder & resource)   │
         │◄─────────────────────────────│                                 │
         │                              │                                 │
         │ 3. Direct upload screenshot with signed policy                 │
         │───────────────────────────────────────────────────────────────►│
         │ 4. Cloudinary upload response (publicId, bytes, format, etc.)  │
         │◄───────────────────────────────────────────────────────────────│
         │                              │                                 │
         │ 5. POST /payment-proofs (submit metadata)                      │
         │─────────────────────────────►│                                 │
         │                              │ Validate metadata & ownership   │
         │                              │ Open MongoDB transaction:       │
         │                              │   - Create paymentProof         │
         │                              │   - Update payment status       │
         │                              │   - Update order status         │
         │                              │   - Append AuditLog             │
         │                              │   - Create OutboxEvent          │
         │                              │ Commit transaction              │
         │ 6. 201 Created (safe status) │                                 │
         │◄─────────────────────────────│                                 │
```

---

## 7. Upload Validation Policy
The backend strictly inspects uploaded file metadata before allowing database persistence:
- **Folder Validation**: `cloudinaryPublicId` MUST start with configured prefix `al-azhari/payment-proofs/`. Arbitrary folders (e.g. products, root, external) are rejected with `CLOUDINARY_METADATA_INVALID`.
- **Resource Type**: MUST be `'image'`. Raw, video, and audio assets are rejected.
- **Allowed Formats**: `png`, `jpeg`, `jpg`, `webp`. All executable or generic file formats (pdf, exe, svg, html) are rejected.
- **Size Bounds**: Integer bytes between `1` and `10,485,760` (10MB limit). Negative, zero, or oversized bytes are rejected.
- **No Credentials Leaked**: Backend signed configurations return only `apiKey`, `timestamp`, `folder`, `signature`, and `resourceType`. `CLOUDINARY_API_SECRET` is NEVER returned or logged.

---

## 8. Guest & Customer Authorization
All order payment routes verify ownership context:
- **Registered Customers**: Order `customerId` MUST match authenticated JWT `req.user.userId`. Other authenticated users receive `403 Forbidden`.
- **Guest Customers**: Requires matching `X-Guest-Token` header. The token is hashed with SHA-256 and compared against `order.guestAccessTokenHash`. Unauthorized guests receive `403 Forbidden`.
- **Cross-Access Protection**: Customer A cannot view or submit proof for Customer B's order. Guest A cannot access Guest B's payment.

---

## 9. Admin Review Workflows
Protected by `requirePermission('payments.review')`:
1. **Review Queue**: `GET /api/v1/admin/payments?status=under_review&page=1&limit=20` returns bounded paginated payments.
2. **Detail View**: `GET /api/v1/admin/payments/:paymentId` returns payment and complete proof submission history.
3. **Signed Inspection URL**: `GET /api/v1/admin/payments/:paymentId/proofs/:submissionNumber/signed-url` generates a short-lived (300-second expiry) Cloudinary signed URL on demand. Signed URLs are never saved in database, logs, or audit records.

---

## 10. Review Actions & Idempotency
All review actions require `expectedVersion` to enforce optimistic locking:
- **Confirm (`POST /admin/payments/:paymentId/confirm`)**:
  - Payment: `under_review` ──► `confirmed` (`confirmedAt` populated, version incremented).
  - Order: `payment_verification` ──► `payment_confirmed`.
  - Latest Proof: `under_review` ──► `confirmed` (`reviewedBy`, `reviewedAt`, `reviewNote` saved).
  - Audit: `payment.confirmed`.
  - Outbox: `payment_verified`.
- **Reject (`POST /admin/payments/:paymentId/reject`)**:
  - Requires mandatory `reason`.
  - Payment: `under_review` ──► `rejected` (`rejectedAt` populated, version incremented).
  - Order: `payment_verification` ──► `awaiting_new_proof`.
  - Latest Proof: `under_review` ──► `rejected` (proof document preserved as immutable evidence).
  - Audit: `payment.rejected`.
  - Outbox: `payment_rejected`.
- **Request New Proof (`POST /admin/payments/:paymentId/request-new-proof`)**:
  - Requires customer-facing `note`.
  - Payment: `under_review` ──► `new_proof_requested` (version incremented).
  - Order: `payment_verification` ──► `awaiting_new_proof`.
  - Latest Proof: `under_review` ──► `new_proof_requested`.
  - Audit: `payment.new_proof_requested`.
  - Outbox: `payment_proof_requested`.

Duplicate requests with the same version fail safely with `409 Conflict` (`PAYMENT_VERSION_CONFLICT`) or `422 BusinessRuleViolationError` (`PAYMENT_REVIEW_STATE_CONFLICT`).

---

## 11. Order-State Integration

| Operation | Previous Order Status | Resulting Order Status | Resulting Payment Status |
| :--- | :--- | :--- | :--- |
| **Order Acceptance (Non-COD)** | `pending_review` | `awaiting_payment` | `not_submitted` |
| **Customer Proof Upload** | `awaiting_payment` / `awaiting_new_proof` | `payment_verification` | `under_review` |
| **Admin Confirm Payment** | `payment_verification` | `payment_confirmed` | `confirmed` |
| **Admin Reject Proof** | `payment_verification` | `awaiting_new_proof` | `rejected` |
| **Admin Request New Proof** | `payment_verification` | `awaiting_new_proof` | `new_proof_requested` |

---

## 12. Audit Logging
Every payment state change creates an append-only entry in `auditLogs`:
- `payment.proof_submitted`: records actor (customer/guest), order reference, submission number, files count.
- `payment.confirmed`: records admin ID, role, order reference, confirmation note.
- `payment.rejected`: records admin ID, role, order reference, rejection reason.
- `payment.new_proof_requested`: records admin ID, role, order reference, instructions note.
- Secrets, private signed URLs, and authentication tokens are strictly excluded from audit records.

---

## 13. Notification & Outbox Integration
Persisted atomically in collection `outboxEvents` inside the transaction boundary:
- `payment_submitted` (aggregate: `Payment`, payload includes `orderReference`, `amountDueMinor`, `submissionNumber`).
- `payment_verified` (payload includes `confirmedAt`, `orderReference`).
- `payment_rejected` (payload includes `reason`, `orderReference`).
- `payment_proof_requested` (payload includes `note`, `orderReference`).
- Dedicated `dedupeKey` prevents duplicate events on retry.
- In-transaction creation ensures 100% rollback consistency if the transaction fails. No external delivery calls are made inside the transaction.

---

## 14. Transactions & Rollback Model
Payment proof submission and admin review actions use `withTransaction()`:
1. Load and verify payment state and version.
2. Load and verify order state and version.
3. Perform database operations (create proof, update payment, update order).
4. Record audit log.
5. Record outbox event.
6. Commit transaction atomically.

If any failure occurs before commit:
- Payment status remains unchanged.
- Order status remains unchanged.
- No paymentProof is committed.
- No AuditLog entry is committed.
- No OutboxEvent entry is committed.

---

## 15. Concurrency
- **Concurrent Submissions**: Handled via compound unique index on `{ paymentId: 1, submissionNumber: 1 }` and optimistic locking on payment version. Two simultaneous submissions will either be ordered sequentially or the conflicting submission fails cleanly without corrupting `proofSubmissionCount`.
- **Concurrent Reviews**: Race between confirm and reject on the same payment version guarantees that exactly one transition succeeds and the second fails with `PAYMENT_VERSION_CONFLICT` or `PAYMENT_REVIEW_STATE_CONFLICT`.

---

## 16. Database Indexes

### `payments` collection:
- `idx_payments_owner_unique`: `{ ownerType: 1, ownerId: 1 }` (unique)
- `idx_payments_status_updated`: `{ status: 1, updatedAt: 1 }`
- `idx_payments_customer_created`: `{ customerId: 1, createdAt: -1 }`

### `paymentProofs` collection:
- `idx_payment_proofs_submission_unique`: `{ paymentId: 1, submissionNumber: 1 }` (unique)
- `idx_payment_proofs_status_created`: `{ status: 1, createdAt: 1 }`
- `idx_payment_proofs_owner_created`: `{ ownerType: 1, ownerId: 1, createdAt: -1 }`

### `outboxEvents` collection:
- `idx_outbox_status_available`: `{ status: 1, availableAt: 1 }`
- `idx_outbox_dedupe`: `{ dedupeKey: 1 }` (unique, sparse)

---

## 17. Database Migration
Migration `20260928_007_payments.migration.ts` establishes:
- Non-destructive creation of `payments` and `paymentProofs` collections.
- Idempotent index creation with background builds.
- Down migration safely drops indexes without dropping collections or deleting business data.
- Fully registered in the migration pipeline.

---

## 18. Security Checklist
- [x] Authorization: Customer order isolation enforced via JWT and guest token.
- [x] RBAC: Admin review routes protected by `payments.review`.
- [x] Private Media: Payment proofs are stored as private Cloudinary assets; public unsigned delivery URLs are prohibited.
- [x] Signed URL Expiration: Admin inspect URLs expire after 300 seconds and are never persisted.
- [x] Upload Policy Constraints: Direct upload signer strictly bounds folder, timestamp, formats, and resource type.
- [x] Secret Leak Prevention: Zero leakage of `CLOUDINARY_API_SECRET`, API keys, signatures, or guest token hashes in responses.
- [x] Immutable History: Proof documents are never overwritten or deleted upon re-upload or rejection.

---

## 19. Open Decisions (OD) Compliance
- **OD-20 (Payment Methods List)**: Implemented as configuration-driven via `settings.payment.methods`. No hard-coded final list forced into code.
- **OD-22 (Payment Proof Retention)**: No automatic deletion policy invented. Old and rejected proofs are retained as immutable audit evidence.

---

## 20. Phase Boundary
Phase 9 is strictly limited to payments, manual payment proofs, Cloudinary direct upload signing, and admin review workflows.
- NOT implemented: Phase 10 Shipping & Coupons.
- NOT implemented: Phase 11 Services & Quotations.
- NOT implemented: Phase 12 Returns & Refunds.
- NOT implemented: Automated payment gateways (Stripe, PayPal, Fawry, webhooks).
