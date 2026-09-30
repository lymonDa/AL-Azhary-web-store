# Phase 11 — Services & Quotations

## 1. Phase Status
* **Status**: Complete
* **Target**: AL-AZHARI LIBRARY Backend Phase 11
* **Scope**: Services, Quotations, Configurable Service Forms, Service Request Lifecycle, Quotation Lifecycle, Customer Quotation Acceptance/Rejection, Service-Payment Gate, Strict Attachment Prohibition, Transactional Concurrency, Outbox/Audit Side Effects, Migration, Indexing, and End-to-End Tests.

---

## 2. Requirements Implemented & Verified

### Services (SRV-001 – SRV-008)
* **SRV-001**: Configuration-driven service catalog (`serviceCategories`) supporting the 6 confirmed categories: Printing, Photocopying, Binding, Applications and transfers, Research/formatting help, Other administrative services.
* **SRV-002**: Versioned dynamic form definitions stored directly within service categories with snapshotting upon request submission.
* **SRV-003**: Customer and Guest service request creation (`POST /api/v1/services/:slug/requests`) generating stable human-readable reference `SRV-YYYYMMDD-XXXX`.
* **SRV-004**: Strict dynamic form validation enforcing field definitions, types, enums, min/max values, and rejecting undeclared fields.
* **SRV-005**: Hard attachment rejection preventing file uploads, multipart payloads, Cloudinary public IDs, base64 data URIs, or file URLs (`ATTACHMENT_NOT_ALLOWED`).
* **SRV-006**: Service request retrieval (`GET /api/v1/service-requests/:reference`) with ownership isolation (customer auth and secure guest token hash matching).
* **SRV-007**: Explicit service request lifecycle transitions:
  `submitted` → `admin_review` → `quotation_sent` → `awaiting_payment` → `payment_verification` → `payment_confirmed` → `processing` → `completed` (or terminal `closed_not_proceeding` / `closed_declined`).
* **SRV-008**: Public service catalog endpoints (`GET /api/v1/services` and `GET /api/v1/services/:slug`) projecting safe localized metadata and active form schema without leaking internal audit/payment structures.

### Quotations (QUOTE-001 – QUOTE-005)
* **QUOTE-001**: Standalone quotation aggregate (`quotations`) linked to `serviceRequestId`, versioned with integer money in minor units (`amountMinor`, currency: `EGP`).
* **QUOTE-002**: Admin quotation creation (`POST /api/v1/admin/service-requests/:reference/quotes`) guarded by RBAC permission `services.quote`, updating service request to `quotation_sent`.
* **QUOTE-003**: Customer quotation acceptance (`POST /api/v1/service-requests/:reference/quotation/accept`) with optimistic locking version verification, atomically transitioning quotation `sent` → `accepted`, request `quotation_sent` → `awaiting_payment`, activating payment record, and persisting outbox/audit records.
* **QUOTE-004**: Customer quotation rejection (`POST /api/v1/service-requests/:reference/quotation/reject`) transitioning quotation `sent` → `rejected` and request → `closed_not_proceeding` without creating payment.
* **QUOTE-005**: Service Payment Gate: No payment record or payment submission is permitted prior to quotation acceptance. Rejection of unapproved COD requests under OD-14.

---

## 3. Domain Boundary
Services are **NOT** catalog products:
* Never enter shopping carts.
* Never become product order lines.
* Never reserve physical inventory stock.
* Do not participate in product checkout.
* Are quotation-based with customer acceptance gating payment creation.
* Preserved authoritative collections: `serviceCategories`, `serviceRequests`, `quotations`.

---

## 4. Service Category Architecture
Service categories are configuration-driven entities stored in `serviceCategories` collection:
* Stable public slug (`slug`).
* Localized name and description (`{ ar: string, en?: string }`).
* `isActive`: Filtered publicly to only display requestable categories.
* `formVersion`: Incremented when form definitions evolve.
* `fields`: Configurable form schema (`IServiceFormField`) supporting `text`, `textarea`, `number`, `select`, `boolean`, `date`.
* `pricingMode`: `'quotation'`.
* `codAllowed`: `null` (OD-14 pending).

---

## 5. Form Versioning
* Each service request snapshots the service category state at submission time:
  * Category identity (`serviceCategoryId`).
  * `serviceCategorySnapshot.slug`.
  * `serviceCategorySnapshot.name`.
  * `serviceCategorySnapshot.formVersion`.
* Historical service requests maintain integrity even if the category form is updated or deactivated in the future.

---

## 6. Service Request Lifecycle
```text
submitted / admin_review
         ↓
   quotation_sent
         ↓
  Customer Decision
   ├── accept → awaiting_payment → payment_verification → payment_confirmed → processing → completed
   └── reject → closed_not_proceeding

Admin review terminal branch:
   └── closed_declined
```

---

## 7. Quotation Lifecycle
```text
  sent (version: 1)
   ├── accepted (version: 2) ──► creates/activates Payment record
   └── rejected (version: 2) ──► NO payment record created
```
* Expiry, timeout, or validity periods are intentionally **not implemented** per prompt rules.

---

## 8. Service Payment Gate
* Payment records for services have `ownerType: 'serviceQuotation'` and `ownerId: quotation._id`.
* Payment creation is strictly gated: only triggered when a customer accepts a quotation.
* Any attempt to pay before quotation acceptance is rejected.

---

## 9. Authorization & RBAC
* Public routes (`/services`, `/services/:slug`) are openly accessible.
* Service request creation (`POST /services/:slug/requests`) accepts optional authentication (guest or logged-in customer).
* Service request retrieval and quotation decisions (`/service-requests/:reference/*`) enforce ownership.
* Admin quote creation requires `services.quote` permission (or wildcard `services.*` / `*` for Owner).

---

## 10. Ownership Enforcement
* Authenticated customers can only view and accept/reject quotations for service requests belonging to their `customerId`.
* Guest service requests are protected by a cryptographically secure 256-bit random token returned once at creation and verified via SHA-256 hash (`X-Guest-Token` header).
* Cross-customer access attempts fail with `SERVICE_OWNERSHIP_DENIED` (403) or `QUOTATION_OWNERSHIP_DENIED` (403).

---

## 11. Attachment Prohibition
* As files for printing/binding are handled out-of-band via WhatsApp/Telegram per business model, backend service endpoints strictly reject any attachments:
  * Top-level or nested keys: `attachments`, `file`, `files`, `fileUrl`, `fileUrls`, `cloudinaryPublicId`, `cloudinaryUrl`, `upload`, `uploads`, `document`, `documents`.
  * Base64 data strings: `data:*/*;base64,...`.
  * `multipart/form-data` request payloads.
* Violations return `ATTACHMENT_NOT_ALLOWED` (HTTP 400).

---

## 12. Audit & Outbox Side Effects
* Commits inside MongoDB sessions:
  * Outbox events: `service_request.created`, `quotation.sent`, `quotation.accepted`, `quotation.rejected`.
  * Audit logs: `service_request_created`, `quotation_sent`, `quotation_accepted`, `quotation_rejected`.
* Delivery workers and real-time sockets are deferred to Phase 13/14.

---

## 13. Database Schema
1. **`serviceCategories`**:
   `slug`, `name`, `description`, `kind`, `isActive`, `formVersion`, `fields`, `communicationChannels`, `pricingMode`, `codAllowed`, timestamps.
2. **`serviceRequests`**:
   `reference`, `customerId`, `guestAccessTokenHash`, `customerSnapshot`, `serviceCategoryId`, `serviceCategorySnapshot`, `submittedFields`, `description`, `status`, `quotationId`, `paymentId`, `statusHistory`, `version`, timestamps.
3. **`quotations`**:
   `serviceRequestId`, `customerId`, `version`, `amountMinor`, `currency`, `status`, `sentBy`, `decisionNote`, `customerDecisionAt`, `acceptedAt`, `rejectedAt`, `paymentId`, timestamps.

---

## 14. Indexes
* `serviceCategories`: `idx_service_categories_slug` (unique), `idx_service_categories_active_order`.
* `serviceRequests`: `idx_service_requests_reference` (unique), `idx_service_requests_customer_created`, `idx_service_requests_status_created`, `idx_service_requests_category_created`, `idx_service_requests_quotation`.
* `quotations`: `idx_quotations_request_version` (unique compound), `idx_quotations_customer_status`, `idx_quotations_status_created`.

---

## 15. Migration
* **File**: `src/database/migrations/scripts/20260928_009_services_quotations.migration.ts`
* **Sequence**: Registered in `src/database/migrations/index.ts` as migration `009`.
* **Idempotent**: Creates collections, schemas, indexes, and seeds initial active service categories without overwriting existing data.
* **Down**: Drops custom indexes created without destructive collection drops.

---

## 16. API Routes
* `GET /api/v1/services` — Public active service catalog.
* `GET /api/v1/services/:slug` — Public service details and active form configuration.
* `POST /api/v1/services/:slug/requests` — Customer or Guest creates service request.
* `GET /api/v1/service-requests/:reference` — Customer or Guest retrieves service request.
* `POST /api/v1/service-requests/:reference/quotation/accept` — Customer accepts quotation.
* `POST /api/v1/service-requests/:reference/quotation/reject` — Customer rejects quotation.
* `POST /api/v1/admin/service-requests/:reference/quotes` — Admin issues quotation.

---

## 17. Error Codes
* `SERVICE_NOT_FOUND`
* `SERVICE_INACTIVE`
* `INVALID_SERVICE_FORM`
* `SERVICE_REQUEST_NOT_FOUND`
* `SERVICE_OWNERSHIP_DENIED`
* `INVALID_SERVICE_TRANSITION`
* `QUOTATION_NOT_FOUND`
* `QUOTE_STATE_CONFLICT`
* `QUOTATION_OWNERSHIP_DENIED`
* `QUOTATION_ALREADY_DECIDED`
* `PAYMENT_UNAVAILABLE_BEFORE_ACCEPTANCE`
* `UNSUPPORTED_SERVICE_PAYMENT_METHOD`
* `ATTACHMENT_NOT_ALLOWED`

---

## 18. Tests Added
* `tests/unit/services-quotations-migration.test.ts`: Migration execution, idempotency, rollbacks, and seeds.
* `tests/unit/service-schema.test.ts`: Zod schema validation, boundary limits, and attachment rejection.
* `tests/api/service-api.test.ts`: Service catalog, dynamic forms, request creation, guest tokens, ownership, and attachment prevention.
* `tests/api/quotation-api.test.ts`: Admin quote issuance, customer accept/reject, payment gate, version checks, and OD-14 rejection.
* `tests/integration/service-quotation-concurrency.test.ts`: Concurrent quote acceptance, race condition handling, optimistic locking, and audit/outbox side effects.

---

## 19. Open Decisions Preserved
* **OD-12**: Exact required service fields remain configuration-driven via `serviceCategory.fields` rather than hardcoded in application models.
* **OD-13**: Service turnaround commitments remain uncommitted (`turnaroundText: null`).
* **OD-14**: COD applicability for accepted service quotations remains pending/unapproved (`codAllowed: null`). Requests for COD payment method are rejected with `UNSUPPORTED_SERVICE_PAYMENT_METHOD`.

---

## 20. Scope Boundary
* Strictly implemented Phase 11 only.
* No Phase 12 Returns & Refunds work.
* No Phase 13 Notification delivery worker / realtime sockets.
* No Phase 14 Outbox workers / background jobs.
* No Phase 15 Reports.
* No pre-orders, cart integrations for services, or Cloudinary service uploads.
