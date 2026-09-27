# AL-AZHARI LIBRARY — Phase 4: Users & Addresses

## 1. Executive Summary

Phase 4 implements the **Customer Identity / Profile** and **Saved Addresses** foundation for the AL-AZHARI LIBRARY backend. It extends the existing Phase 3 authentication infrastructure without creating competing user abstractions, establishes owner-scoped profile editing, enforces strict mass-assignment protection, provides comprehensive address CRUD operations, and guarantees transactional default-address management.

All database operations comply with the authoritative MongoDB Architecture Plan and Backend Implementation Plan:
* Customer profile operations are securely anchored to `/api/v1/me`.
* Address records reside in the `addresses` collection, strictly scoped by `userId`.
* Setting or changing a default address uses multi-document MongoDB transactions (`withTransaction()`).
* Database partial unique indexing guarantees at most one default address per customer while permitting unlimited non-default addresses.
* Sensitive fields (`passwordHash`, `refreshTokenVersion`, internal BSON metadata) are never exposed.
* In compliance with project privacy rules, full address text, recipient phones, and customer notes are never logged.
* In compliance with product specifications, no map pins, GPS coordinates, shipping rules, or order snapshots are implemented in this phase.

---

## 2. Architecture Overview

```text
                           AUTHENTICATED CUSTOMER
                                     │
                             Dual-Token JWT
                          (requireAuthentication)
                                     │
                   ┌─────────────────┴─────────────────┐
                   │                                   │
              USER PROFILE                         ADDRESSES
             (/api/v1/me)                    (/api/v1/addresses)
                   │                                   │
         ┌─────────┴─────────┐               ┌─────────┴─────────┐
         │                   │               │                   │
       READ                UPDATE          CREATE               LIST
    (Safe User)        (name, phone)    (201 Created)     (Default first)
                             │               │                   │
                        VALIDATION      TRANSACTION          READ/UPDATE
                       (Arabic/Latin,   (Default Unset     (Ownership Scoped
                        Phone Canon,     & Migration)       404 Enumeration
                        Strict Mass-                       Safe Isolation)
                        Assignment)                              │
                                                               DELETE
                                                           (204 No Content,
                                                            Physical Delete)
```

---

## 3. User Module & Profile Management

The `users` module owns customer profile information, account state, and safe profile projection. Authentication credentials, session rotation, verification tokens, and password reset remain strictly owned by `auth`.

### 3.1 Profile Read (`GET /api/v1/me`)
* **Route**: `GET /api/v1/me`
* **Authentication**: `requireAuthentication()`
* **Status**: `200 OK`
* **Response Envelope**:
  ```json
  {
    "success": true,
    "data": {
      "id": "672...39011",
      "name": "Rana Sameh",
      "email": "rana@example.com",
      "phone": "+201066554433",
      "role": "customer",
      "status": "active",
      "emailVerifiedAt": "2026-09-27T10:00:00.000Z",
      "createdAt": "2026-09-27T10:00:00.000Z",
      "updatedAt": "2026-09-27T10:00:00.000Z"
    },
    "requestId": "req_...",
    "meta": {
      "requestId": "req_...",
      "timestamp": "2026-09-27T10:00:00.000Z"
    }
  }
  ```

### 3.2 Profile Update (`PATCH /api/v1/me`)
* **Route**: `PATCH /api/v1/me`
* **Authentication**: `requireAuthentication()`
* **Status**: `200 OK`
* **Editable Fields**:
  - `name`: string, trimmed, 2 to 100 characters. Supports both Arabic and Latin scripts (e.g., "أحمد محمود", "Ahmed Mahmoud"). Whitespace is normalized.
  - `phone`: canonical Egyptian mobile (`+201[0125]XXXXXXXX`) or international E.164 (`+[country][number]`). Canonicalized via `canonicalizePhone()`. Uniqueness is verified against existing customer records; duplicate attempts return `409 RESOURCE_CONFLICT`.
* **Immutable Fields & Mass-Assignment Protection**:
  Clients cannot modify:
  - `id` / `_id`
  - `role`
  - `status`
  - `passwordHash`
  - `refreshTokenVersion`
  - `emailVerifiedAt`
  - `createdAt` / `updatedAt`
  Any attempt to inject these fields is strictly rejected at the Zod HTTP boundary (`.strict()`) with `400 VALIDATION_ERROR`.
* **Email Immutability**:
  Email changes represent a security-sensitive workflow requiring re-verification. In Phase 4, arbitrary email changes via `PATCH /me` are rejected with `400 VALIDATION_ERROR` ("Email cannot be modified through profile update. Email changes are not permitted").

---

## 4. Address Module & Data Contract

### 4.1 Address Schema Specification
Saved customer addresses reside in the `addresses` collection. All fields except `isDefault` and timestamps are stored as strings:

| Field | Type | Required | Constraints / Validation |
|:---|:---|:---:|:---|
| `userId` | `ObjectId` | Yes | Foreign key to `User`, assigned by server from JWT |
| `label` | `string \| null` | No | Optional label (e.g. "المنزل", "Home", "Work"), max 50 chars |
| `recipientName` | `string` | Yes | 2 to 100 characters, Arabic and Latin allowed |
| `recipientPhone` | `string` | Yes | Canonicalized Egyptian mobile / international E.164 |
| `governorate` | `string` | Yes | 1 to 100 characters, trimmed (e.g. "Qena", "قنا", "Cairo") |
| `city` | `string` | Yes | 1 to 100 characters, trimmed (e.g. "Qena", "Nasr City") |
| `area` | `string` | Yes | 1 to 100 characters, trimmed (e.g. "Omar Effendi", "Dandara") |
| `street` | `string` | Yes | 1 to 200 characters, trimmed |
| `buildingNumber` | `string` | Yes | 1 to 50 characters, trimmed (supports "12A", "3/4", "بدون رقم") |
| `floor` | `string \| null` | No | Free-text string, max 50 chars (supports "ground", "أرضي", "3") |
| `apartment` | `string \| null` | No | Free-text string, max 50 chars (supports "4", "شقة 2") |
| `landmark` | `string \| null` | No | Max 200 characters |
| `notes` | `string \| null` | No | Max 500 characters |
| `isDefault` | `boolean` | Yes | Defaults to `false`; at most one `true` per user |
| `createdAt` | `Date` | Yes | BSON UTC Date |
| `updatedAt` | `Date` | Yes | BSON UTC Date |

### 4.2 Prohibited Fields (Strict Schema & Zod Boundaries)
* **No Map Pins**: `latitude`, `longitude`, `coordinates`, `geoJSON`, `mapPin`, and `locationPoint` are strictly prohibited.
* **No Shipping / Carrier Fields**: `shippingCost`, `deliveryZone`, `carrier`, `serviceability`, and `ETA` are not address properties and remain out of scope for Phase 4.

### 4.3 Database Indexes
1. **Default Address Partial Unique Index**:
   ```javascript
   db.addresses.createIndex(
     { userId: 1, isDefault: 1 },
     { unique: true, partialFilterExpression: { isDefault: true }, name: "idx_addresses_user_default_unique" }
   )
   ```
   Enforces at the database engine level that no customer can have more than one default address, while allowing unlimited non-default addresses.
2. **Customer Address Listing Index**:
   ```javascript
   db.addresses.createIndex(
     { userId: 1, createdAt: -1 },
     { name: "idx_addresses_user_created" }
   )
   ```
   Optimizes customer address listing queries ordered by recency.

---

## 5. Address CRUD Operations & Endpoints

All address routes are mounted under `/api/v1/addresses` and protected by `requireAuthentication()`.

| Method | Endpoint | Auth | Success Code | Description |
|:---|:---|:---:|:---:|:---|
| `GET` | `/api/v1/addresses` | Required | `200 OK` | List customer's saved addresses (default first, then createdAt DESC) |
| `POST` | `/api/v1/addresses` | Required | `201 Created` | Create new saved address for authenticated customer |
| `GET` | `/api/v1/addresses/:id` | Required | `200 OK` | Get single saved address by ID (ownership verified) |
| `PATCH` | `/api/v1/addresses/:id` | Required | `200 OK` | Update saved address fields (ownership verified) |
| `DELETE` | `/api/v1/addresses/:id` | Required | `204 No Content` | Delete saved address physically (ownership verified) |

---

## 6. Multi-Document Transactions & Default Address Workflow

When an address is created or updated with `isDefault: true`, the system executes a managed transaction via `withTransaction()`:

1. **Transaction Start**: Session started with MongoDB replica set.
2. **Unset Existing Default**: `addressRepository.unsetOtherDefaults(userId, targetAddressId, { session })` updates all other customer addresses where `isDefault: true` to `isDefault: false`.
3. **Persist Target Default**: The target address is inserted or updated with `isDefault: true` using the active session.
4. **Commit**: If all operations succeed, the transaction commits atomically.
5. **Rollback**: If any failure occurs, the transaction automatically aborts cleanly; no partial or inconsistent state remains.

When an address is created or updated with `isDefault: false`, no multi-document transaction is necessary and a standard single-document operation is performed.

---

## 7. Security Architecture

### 7.1 Record Ownership Enforcement
* The authenticated customer's ID (`req.user.userId`) is derived directly from the verified JWT access token.
* All repository address queries are strictly scoped: `findByIdAndUserId(addressId, authenticatedUserId)`.
* Clients cannot pass `userId` in request bodies. Any attempt to supply `userId` or `_id` is rejected by Zod `.strict()` validation.

### 7.2 Safe Enumeration Protection (404 Not Found)
* If User A attempts to access (`GET`), modify (`PATCH`), or delete (`DELETE`) User B's address ID, the query returns `null` because the record is not owned by User A.
* The API returns `404 NOT_FOUND` rather than `403 FORBIDDEN`.
* This completely prevents address ID enumeration and never reveals whether an address belongs to another customer.

### 7.3 Admin Isolation
* Admin roles do NOT automatically gain access to customer addresses through customer endpoints.
* Admin address management belongs to dedicated back-office administrative phases. Customer endpoints remain strictly customer-isolated.

### 7.4 Safe Response Projections
* `toSafeUser`: Returns only `id, name, email, phone, role, status, emailVerifiedAt, createdAt, updatedAt`.
* `toSafeAddress`: Returns only `id, label, recipientName, recipientPhone, governorate, city, area, street, buildingNumber, floor, apartment, landmark, notes, isDefault, createdAt, updatedAt`.
* Never exposes `passwordHash`, `refreshTokenVersion`, internal MongoDB `__v`, or session secrets.

### 7.5 Privacy & Logging Rules
In accordance with Section 54 of the project specifications and the Backend Implementation Plan:
* **Prohibited in logs**: Full address text, recipient phone number, customer street/building details, and raw customer delivery notes are NEVER logged.
* **Safe structured logging**: Only non-sensitive operational telemetry is emitted:
  ```json
  {
    "requestId": "req_...",
    "userId": "672...",
    "addressId": "672...",
    "operation": "address_create",
    "level": "info",
    "msg": "Customer address created successfully"
  }
  ```

---

## 8. Inter-Module Boundary & Checkout Preparation

To support future Phase 8 (Checkout & Orders) without coupling or direct model mutation:
1. **`toAddressSnapshot(address)`**:
   Pure, deterministic utility that transforms a saved address into an immutable delivery snapshot (`governorate, city, area, street, buildingNumber, floor, apartment, landmark, recipientName, recipientPhone, notes`). It does NOT write to MongoDB or create orders.
2. **`addressService.getOwnedAddress(userId, addressId)`**:
   Public application service method that validates ownership and returns the authoritative address document for checkout snapshot creation. Future checkout modules interact exclusively through this service contract.

---

## 9. Database Migrations

Phase 4 introduces migration `20260927_002_addresses`:
* **File**: `src/database/migrations/scripts/20260927_002_addresses.migration.ts`
* **Idempotent**: Checks collection existence and creates indexes without dropping data.
* **Non-destructive**: Uses background index creation where applicable.
* **Reversible**: Defines `down()` to safely drop the created indexes if rolled back.

---

## 10. Open & Deferred Items

The following items are deliberately omitted or deferred in accordance with project boundaries:
1. **Email Change Flow**: Deferred; requires email re-verification workflow. Attempts to update email return `400`.
2. **Phone OTP Verification**: Deferred / not required per PRD AUTH-006.
3. **Customer Account Self-Deletion**: Deferred to future account lifecycle specifications.
4. **Checkout Address Snapshotting**: Deferred to Phase 8 (Orders & Checkout).
5. **Shipping Cost & Serviceability Calculation**: Deferred to Phase 10 (Shipping & Coupons).

---

## 11. Verification Matrix

| Category | Suite / Check | Result |
|:---|:---|:---:|
| TypeScript Compilation | `npm run typecheck` | **PASS** (0 errors) |
| Code Quality & Linter | `npm run lint` | **PASS** (0 errors, 0 warnings) |
| Production Build | `npm run build` | **PASS** (clean `dist/`) |
| Liveness Probe | `GET /health/live` | **PASS** (`200 OK`) |
| Readiness Probe | `GET /health/ready` | **PASS** (`200 OK`) |
| Phase 0 Foundation Tests | `app.test.ts`, `env.test.ts`, `response.test.ts` | **PASS** |
| Phase 1 Database Tests | `db-connection.test.ts`, `db-errors.test.ts`, `migrations.test.ts` | **PASS** |
| Phase 2 Security & HTTP Tests | `security-middleware.test.ts`, `validators.test.ts`, `query.test.ts` | **PASS** |
| Phase 3 Authentication Tests | `auth-*.test.ts`, `rbac.test.ts`, `jwt.test.ts` | **PASS** |
| Phase 4 Profile Tests | `tests/api/me.test.ts` (19 tests) | **PASS** |
| Phase 4 Address CRUD Tests | `tests/api/address-crud.test.ts` (15 tests) | **PASS** |
| Phase 4 Ownership Tests | `tests/api/address-ownership.test.ts` (12 tests) | **PASS** |
| Phase 4 Default Address Tests | `tests/api/address-default.test.ts` (6 tests) | **PASS** |
| Phase 4 Migration Tests | `tests/unit/addresses-migration.test.ts` (2 tests) | **PASS** |
| Phase 4 Schema & Projection Tests | `tests/unit/address-schema.test.ts`, `address-projection.test.ts` (17 tests) | **PASS** |
| **Total Test Suites** | **39 test suites** | **PASS (39 / 39)** |
| **Total Tests** | **297 automated tests** | **PASS (297 / 297)** |
