# Phase 15 — Reports & Audit Logging

## Overview

Phase 15 implements the authoritative administrative reporting and immutable audit logging system for the **AL-AZHARI LIBRARY backend**. The system maintains MongoDB Atlas as the single authoritative source of truth, employing native MongoDB aggregation pipelines for performant read-only reporting and an append-only audit trail with strict sensitive field redaction and transactional consistency.

---

## Requirements

Mapped directly to the Authoritative Backend Implementation Plan:

| Requirement Category | Acceptance Criteria | Implementation Status |
|----------------------|---------------------|-----------------------|
| **Reports & Analytics** | Native MongoDB aggregations, integer minor units, read-only | `COMPLETE` |
| **Orders Report** | Grouped by status, date filters, status filter | `COMPLETE` |
| **Revenue Report** | Server-side authoritative integer minor-unit aggregation, EGP semantics | `COMPLETE` |
| **Outside-Qena Report** | Non-Qena geographic filtering based on authoritative address snapshot | `COMPLETE` |
| **Payment Methods Report** | Distribution across configured payment method keys with exact counts | `COMPLETE` |
| **Service Conversion Report**| Lifecycle tracking from service request to quotation acceptance/rejection | `COMPLETE` |
| **Product Demand Report** | Aggregation of item quantities and line totals from order snapshots | `COMPLETE` |
| **Pre-order Demand Report** | Aggregation of pre-order records by product and status | `COMPLETE` |
| **Coupon Usage Report** | Total redemptions and discounts from `couponRedemptions` collection | `COMPLETE` |
| **Audit Logging** | Critical mutation tracking across modules | `COMPLETE` |
| **Audit Immutability** | Append-only with schema-level update and deletion prevention | `COMPLETE` |
| **Audit Redaction** | Deep sanitization of passwords, tokens, Cloudinary URLs, secrets | `COMPLETE` |
| **Audit Read API** | `GET /admin/audit-logs` with pagination, filters, and redaction | `COMPLETE` |
| **Report Permissions** | RBAC enforcement (`reports.read`, `audit.read`) | `COMPLETE` |

---

## Reports

All 8 reports are available via `GET /api/v1/admin/reports/:report`:

### 1. Orders Report (`orders`)
Aggregates total order counts and breakdown by order status (`pending_review`, `accepted`, `delivered`, `cancelled`, etc.).
- **Query Source**: `orders` collection
- **Metrics**: `totalOrders`, `byStatus: Array<{ status, count }>`
- **Filters**: `dateFrom`, `dateTo`, `status`

### 2. Revenue Report (`revenue`)
Aggregates recognized operational revenue in integer minor units (piastres, 1 EGP = 100 piastres) without floating-point conversion.
- **Query Source**: `orders` collection (defaulting to non-rejected and non-cancelled orders)
- **Metrics**: `totalRevenueMinor`, `currency: 'EGP'`, `orderCount`, `byPaymentMethod`, `byStatus`
- **Filters**: `dateFrom`, `dateTo`, `status`

### 3. Outside-Qena Report (`outside-qena`)
Identifies orders originating outside the local Qena governorate based strictly on authoritative address snapshots.
- **Query Source**: `orders` collection where `fulfillment.method === 'delivery'` and `fulfillment.addressSnapshot.governorate` not in `['Qena', 'قنا']`
- **Metrics**: `totalOutsideQenaOrders`, `totalAmountMinor`, `currency: 'EGP'`, `byGovernorate: Array<{ governorate, count, totalMinor }>`
- **Filters**: `dateFrom`, `dateTo`, `status`

### 4. Payment-Method Distribution (`payment-methods`)
Aggregates order volume and monetary totals grouped by configured payment method keys.
- **Query Source**: `orders` collection
- **Metrics**: `totalPayments`, `totalAmountMinor`, `currency: 'EGP'`, `distribution: Array<{ paymentMethodKey, count, totalAmountMinor }>`
- **Filters**: `dateFrom`, `dateTo`

### 5. Service Conversion Report (`service-conversion`)
Measures conversion from incoming custom student service requests to accepted customer quotations.
- **Query Source**: `serviceRequests` and `quotations` collections
- **Metrics**: `totalRequests`, `requestsByStatus`, `totalQuotations`, `quotationsByStatus`, `acceptedQuotations`, `rejectedQuotations`, `conversionRate`, `conversionFormula: 'acceptedQuotations / totalQuotations'`
- **Filters**: `dateFrom`, `dateTo`

### 6. Product / Category Demand Report (`product-demand`)
Aggregates demand based on authoritative order item snapshots.
- **Query Source**: Unwound `items` array in `orders`
- **Metrics**: `totalItemsSold`, `totalRevenueMinor`, `currency: 'EGP'`, `byProduct: Array<{ productId, nameSnapshot, quantity, revenueMinor }>`, `byCategory: Array<{ category, quantity, revenueMinor }>`
- **Filters**: `dateFrom`, `dateTo`

### 7. Pre-order Demand Report (`preorder-demand`)
Aggregates upcoming pre-order reservations and interest.
- **Query Source**: `preorders` collection
- **Metrics**: `totalPreorders`, `totalQuantity`, `byProduct: Array<{ productId, quantity, count }>`, `byStatus: Array<{ status, count }>`
- **Filters**: `dateFrom`, `dateTo`

### 8. Coupon Usage Report (`coupon-usage`)
Aggregates coupon redemption frequency and discount values.
- **Query Source**: `couponRedemptions` collection
- **Metrics**: `totalRedemptions`, `totalDiscountMinor`, `currency: 'EGP'`, `byCoupon: Array<{ couponId, codeSnapshot, count, totalDiscountMinor }>`
- **Filters**: `dateFrom`, `dateTo`

---

## Filters

Report and audit query parameters are validated with strict Zod schemas (`reportQuerySchema` and `listAuditLogsQuerySchema`):
- `dateFrom`: ISO-8601 date string (UTC boundary)
- `dateTo`: ISO-8601 date string (UTC boundary)
- `status`: String matching status enum
- `geography`: String governorate filter
- Range Rule: `dateFrom <= dateTo` enforced server-side
- Injection Prevention: All raw MongoDB operator tokens (`$`, `$$`, `.` in keys) are strictly rejected.

---

## Permissions

Integrated with the established RBAC middleware:
- `reports.read`: Required for all report endpoints under `GET /api/v1/admin/reports/:report`. Granted by default to `admin` and `owner`.
- `audit.read`: Required for `GET /api/v1/admin/audit-logs`. Granted to `owner` (universal wildcard `*`) and administrators explicitly granted `audit.read`.
- Customer role (`customer`): Denied with `403 Forbidden` on all admin endpoints.
- Unauthenticated requests: Denied with `401 Unauthorized`.

---

## Audit

### Audited Actions & Record Structure
Audit logs capture:
- `actorId`: User ObjectId or null for system
- `actorRole`: 'admin' | 'owner' | 'customer' | 'system'
- `action`: Stable action identifier
- `entityType`: Target entity class ('Order', 'Payment', 'InventoryItem', 'ShippingRule', 'Role', 'Setting', etc.)
- `entityId`: Unique reference or identifier
- `previousState`: Sanitized snapshot before mutation
- `newState`: Sanitized snapshot after mutation
- `reason`: Operational note or transition reason
- `requestId`: Request correlation ID
- `ipHash`: SHA-256 hashed client IP
- `dedupeKey`: Idempotent mutation fingerprint
- `createdAt`: UTC timestamp

### Audited Critical Mutations Across Modules
- **Orders**: `order.created`, `order.accepted`, `order.rejected`, `order.status_updated`, `order.cancelled`, `order.cod_confirmed`, `order.shipping_updated`
- **Payments**: `payment.proof_submitted`, `payment.confirmed`, `payment.rejected`, `payment.new_proof_requested`
- **Inventory**: `inventory.adjusted`, `inventory.stock_deducted`
- **Shipping**: `shipping.rule_created`, `shipping.rule_changed`, `shipping.rule_deactivated`
- **Quotations**: `quotation_sent`, `quotation_accepted`, `quotation_rejected`
- **Returns & Refunds**: `return_approved_and_refund_initiated`, `return_rejected`, `refund_completed`, `refund_failed`
- **RBAC**: `role.permissions_updated`
- **Settings**: `settings.updated`
- **Products**: `product.create`, `product.update.price`, `product.update.availability`, `product.update.publication`
- **Coupons**: `coupon.created`, `coupon.updated`, `coupon.activated`, `coupon.deactivated`

---

## Redaction

Deep redaction utility `redactSensitiveData` sanitizes previous and new states both at ingestion time and read time.
Excluded from storage and API responses:
- `password`, `passwordHash`
- `token`, `accessToken`, `refreshToken`, `resetToken`
- `cloudinaryApiSecret`, `cloudinarySignature`
- Raw proof URLs and signed Cloudinary download URLs
- Payment card numbers, CVVs, and raw payment details
- Unnecessary PII and database connection URIs

---

## Transactions

Audit records for critical operations participate in the same MongoDB transaction session as the business mutation.
If the transaction is aborted or rolls back:
- The business mutation does not persist
- The corresponding audit record does not persist
- External services (Email, Socket.IO) are never invoked inside transactions.

---

## Database

### Collections
- `auditLogs`: Append-only audit records
- `preorders`: Customer pre-order requests

### Indexes (Migration `20260928_013_audit_reports`)
- `idx_audit_logs_entity_created`: `{ entityType: 1, entityId: 1, createdAt: -1 }`
- `idx_audit_logs_actor_created`: `{ actorId: 1, createdAt: -1 }`
- `idx_audit_logs_action_created`: `{ action: 1, createdAt: -1 }`
- `idx_audit_logs_created`: `{ createdAt: -1 }`
- `idx_audit_logs_dedupe`: `{ dedupeKey: 1 }` (unique, sparse)
- `idx_preorders_status_created`: `{ status: 1, createdAt: -1 }`

---

## API Endpoints

### 1. `GET /api/v1/admin/reports/:report`
- **Auth**: Bearer JWT (`reports.read`)
- **Path Param**: `report` (one of `orders`, `revenue`, `outside-qena`, `payment-methods`, `service-conversion`, `product-demand`, `preorder-demand`, `coupon-usage`)
- **Query Params**: `dateFrom`, `dateTo`, `status`, `geography`
- **Response**: Envelope containing `data`, `meta.requestId`, `meta.timestamp`

### 2. `GET /api/v1/admin/audit-logs`
- **Auth**: Bearer JWT (`audit.read`)
- **Query Params**: `entityType`, `entityId`, `action`, `actorId`, `actorRole`, `dateFrom`, `dateTo`, `page`, `limit`, `sort`
- **Response**: Envelope containing `data: IAuditLog[]`, `meta.pagination`, `meta.requestId`

---

## Open Decisions

1. **KPI Targets**: Intentionally left uninvented per requirement.
2. **Audit Retention Policy**: Left unspecified per requirement; logs are append-only and immutable.
3. **Daily Aggregates**: Postponed until production query evidence proves necessary.

---

## Scope Boundary

Phase 15 complete. No Phase 16 (Full Testing Overhaul), Phase 17 (Security Hardening), or Phase 18 (Deployment) implementation included.
