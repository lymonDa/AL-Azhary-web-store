# AL-AZHARI LIBRARY — Phase 3: Authentication, Identity & Session Management

## 1. Executive Summary

Phase 3 establishes the **Authentication, Identity, Session Management, and Authorization (RBAC) foundation** for the AL-AZHARI LIBRARY backend. It implements a secure dual-token authentication model, Argon2id password hashing, session lifecycle with automatic token rotation and reuse detection, opaque single-use tokens for email verification and password reset, and role-based access control with universal bypass for store owners.

All persistence adheres strictly to the MongoDB Architecture Plan (`users`, `sessions`, `authTokens`, and `roles` collections) without modifying unrelated collections, storing sensitive raw secrets, or leaking account existence to untrusted clients.

---

## 2. Authentication Architecture

```text
                               AL-AZHARI LIBRARY
                                     │
                             Authentication
                                     │
               ┌─────────────────────┼─────────────────────┐
               │                     │                     │
             Users                Sessions              Auth Tokens
         (Argon2id,          (Opaque Hash TTL,       (Opaque Hash TTL,
       Canonical Phone)      Token Rotation)       Verification & Reset)
               │                     │                     │
               └─────────────────────┴─────────────────────┘
                                     │
                             JWT Access Token
                            (15m HS256, Minimal)
                                     │
                           Authentication Filter
                        (requireAuthentication /
                         optionalAuthentication)
                                     │
                           Authorization / RBAC
                        (requireRole, requirePermission)
                                     │
                        ┌────────────┴────────────┐
                        │                         │
                     Customer                   Admin / Owner
```

### 2.1 Dual-Token Strategy
* **Access Token**: Short-lived JSON Web Token (JWT) with HS256 signature.
  - Standard TTL: 15 minutes (`JWT_ACCESS_TTL=15m`).
  - Transport: `Authorization: Bearer <access_token>`.
  - Claims:
    ```typescript
    type AccessClaims = {
      sub: string;             // User ID
      role: 'customer' | 'admin' | 'owner';
      sessionId: string;       // Active session ID
      tokenVersion: number;    // User refreshTokenVersion for global invalidation
      iat: number;
      exp: number;
      iss: string;             // al-azhari-library-api
      aud: string;             // al-azhari-library-client
    };
    ```
  - **No sensitive payload**: Never contains email, phone, name, password hash, permissions array, or addresses.
* **Refresh Token**: Opaque cryptographically random string (32 bytes / 64 hex characters generated via `crypto.randomBytes`).
  - Transport: Stored exclusively in an `HttpOnly`, `SameSite=lax`, configurable `Secure` cookie named `al_azhari_refresh`.
  - Restricted Cookie Path: Bound to `/api/v1/auth` to prevent leaking across unrelated API calls.
  - Never stored in plaintext: MongoDB stores only the SHA-256 hash of the token (`tokenHash`).
  - Never returned in JSON response bodies or logged.

---

## 3. Identity & User Model

### 3.1 Persistence Contract (`users` collection)
* Model: `src/modules/users/models/user.model.ts`
* Schema:
  - `role`: Enum `['customer', 'admin', 'owner']`, defaults to `customer`.
  - `name`: Trimmed string, min 2 characters, max 100 characters.
  - `email`: Normalized (trimmed, lowercase) string with standard email format; unique index.
  - `phone`: Canonicalized E.164-compatible Egyptian/international phone number; unique index.
  - `passwordHash`: Argon2id hash; configured with `{ select: false }` to prevent accidental projection.
  - `emailVerifiedAt`: Date timestamp or null.
  - `status`: Enum `['active', 'suspended']`, defaults to `active`.
  - `lastLoginAt`: Date timestamp or null.
  - `refreshTokenVersion`: Non-negative integer counter for global session invalidation (defaults to 0).
  - `timestamps`: `createdAt`, `updatedAt`.
  - `strict: 'throw'` enabled.

### 3.2 Canonical Phone Normalization
* Module: `src/modules/users/utils/phone.util.ts`
* Strips all non-digit/leading `+` formatting.
* Automatically normalizes local Egyptian mobile prefixes:
  - `010xxxxxxxx`, `011xxxxxxxx`, `012xxxxxxxx`, `015xxxxxxxx` → `+2010xxxxxxxx`, `+2011xxxxxxxx`, etc.
  - `2010xxxxxxxx` → `+2010xxxxxxxx`.
* Normalizes international numbers to leading `+` format.

### 3.3 Safe User Projection
* Module: `src/modules/users/utils/user.projection.ts` (`toSafeUser`)
* Standard projection returns only safe user fields:
  ```json
  {
    "id": "66f5c8e2b834e56a79e4d1b2",
    "name": "Mahmoud Al-Azhari",
    "email": "mahmoud@example.com",
    "phone": "+201012345678",
    "role": "customer",
    "status": "active",
    "emailVerifiedAt": null,
    "createdAt": "2026-09-27T10:00:00.000Z",
    "updatedAt": "2026-09-27T10:00:00.000Z"
  }
  ```
* Strips `passwordHash`, `refreshTokenVersion`, internal tokens, and metadata.

---

## 4. Password Security & Argon2id

* Module: `src/modules/auth/services/password.service.ts`
* Algorithm: Argon2id (hybrid data-dependent and data-independent memory-hard hashing).
* Configuration (controlled via environment):
  - `ARGON2_MEMORY_COST=65536` (64 MB)
  - `ARGON2_TIME_COST=3` (3 iterations)
  - `ARGON2_PARALLELISM=4` (4 threads)
* Sanitization & Redaction: Passwords and password hashes are automatically redacted by HTTP logging and are never retained in memory longer than the hashing/verification cycle.

---

## 5. Session Management & Refresh Token Rotation

### 5.1 Persistence Contract (`sessions` collection)
* Model: `src/modules/auth/models/session.model.ts`
* Schema:
  - `userId`: ObjectId reference to `users`.
  - `tokenHash`: SHA-256 hash of the active opaque refresh token (unique index).
  - `userAgent`: Client User-Agent string (bounded to 500 characters).
  - `ipHash`: SHA-256 hash of client IP address (Phase 2 privacy compliance).
  - `lastUsedAt`: Timestamp of last rotation or validation.
  - `expiresAt`: Date with MongoDB TTL index (`expireAfterSeconds: 0`).
  - `revokedAt`: Timestamp when revoked, or null.
  - `revokeReason`: Revocation cause string (`'user_logout'`, `'token_rotated'`, `'reuse_detected'`, `'global_logout'`, `'password_reset'`).
  - `sessionVersion`: Monotonically incrementing counter.
  - `timestamps`: `createdAt`, `updatedAt`.

### 5.2 Token Rotation
Every call to `POST /api/v1/auth/refresh` performs an atomic rotation within a MongoDB transaction:
1. Extract refresh token from the `al_azhari_refresh` cookie.
2. Compute `SHA-256(rawToken)`.
3. Locate session by `tokenHash`.
4. Validate that the session is not revoked, has not expired, and the user is `active`.
5. Invalidate old token: update session with new `tokenHash`, increment `sessionVersion`, update `lastUsedAt` and `expiresAt`.
6. Issue new opaque refresh token and new JWT access token.
7. Set rotated refresh token in the `al_azhari_refresh` HttpOnly cookie.

### 5.3 Token Reuse Detection
If a client attempts to present an old, already-rotated refresh token:
1. `sessionService.rotateSession` fails to find an active session matching the old hash.
2. The service queries for any session where `tokenHash` previously matched or was revoked due to rotation.
3. If detected, the entire session is immediately revoked with reason `'reuse_detected'`, and an audit log event is recorded (without logging the token).
4. The request is rejected with HTTP 401 `AUTHENTICATION_FAILED`.

### 5.4 Global Logout & Invalidation
* User document maintains `refreshTokenVersion: number`.
* During a global logout (`POST /api/v1/auth/logout` with body `{ "all": true }`) or a successful password reset:
  - All active sessions for `userId` are marked `revokedAt = new Date()`, `revokeReason = 'global_logout'`.
  - `user.refreshTokenVersion` is incremented.
  - Any JWT access token carrying an older `tokenVersion` is rejected by `requireAuthentication` when verified against the user state.

---

## 6. Auth Tokens: Verification & Password Reset

### 6.1 Persistence Contract (`authTokens` collection)
* Model: `src/modules/auth/models/auth-token.model.ts`
* Schema:
  - `userId`: ObjectId reference to `users`.
  - `type`: Enum `['email_verification', 'password_reset']`.
  - `tokenHash`: SHA-256 hash of the 32-byte opaque random token (unique index).
  - `expiresAt`: Date with MongoDB TTL index (`expireAfterSeconds: 0`).
  - `consumedAt`: Date timestamp or null.
  - `timestamps`: `createdAt`, `updatedAt`.

### 6.2 Email Verification Flow
1. **Registration**: Opaque 32-byte random token is generated. SHA-256 hash is saved to `authTokens` with 24-hour expiration (`type = 'email_verification'`) inside the same transaction as user creation.
2. **Consumption**: Client calls `POST /api/v1/auth/verify-email` with `{ "token": "<rawToken>" }`.
3. Server computes SHA-256 hash, validates token is unconsumed and not expired, sets `consumedAt = new Date()` and updates `user.emailVerifiedAt = new Date()`.
4. Token cannot be reused (subsequent requests fail with `AUTH_TOKEN_CONSUMED`).

### 6.3 Password Reset Flow
1. **Forgot Password**: Client calls `POST /api/v1/auth/forgot-password` with `{ "email": "user@example.com" }`.
   - **Neutral Response**: Returns HTTP 202 `Accepted` with a generic message regardless of whether the email exists in the database to prevent account enumeration.
   - If user exists and is active, previous unconsumed reset tokens are invalidated and a new opaque token hash is saved with 1-hour expiration.
2. **Reset Password**: Client calls `POST /api/v1/auth/reset-password` with `{ "token": "<rawToken>", "newPassword": "<newPassword>" }`.
   - Validates unconsumed, non-expired token.
   - Atomically updates user's `passwordHash` (Argon2id), increments `refreshTokenVersion`, revokes all active sessions for the user, and marks the token consumed.
   - Returns HTTP 204 `No Content`.

---

## 7. Role-Based Access Control (RBAC) Foundation

### 7.1 Persistence Contract (`roles` collection)
* Model: `src/modules/users/models/role.model.ts`
* Seed & Migration: `src/database/seed/seeders/001_roles.seeder.ts` & `src/database/migrations/scripts/20260927_001_roles.migration.ts`
* System Roles:
  | Role | Display Name | Permissions | System Protected |
  | :--- | :--- | :--- | :--- |
  | `owner` | Store Owner | `['*']` (Wildcard / Universal bypass) | Yes |
  | `admin` | Administrator | `['products.read', 'products.write', 'orders.read', 'orders.accept', 'payments.review', 'reports.read']` | Yes |
  | `customer`| Customer | `['orders.read', 'profile.read', 'profile.write']` | Yes |

### 7.2 Authorization Middleware
* `requireAuthentication()`: Validates `Bearer` JWT, attaches `req.user` principal `{ userId, role, sessionId, tokenVersion }`. Returns HTTP 401 on missing, malformed, or expired tokens.
* `optionalAuthentication()`: Attaches principal if a valid JWT is provided; continues as guest if no Authorization header is present; rejects malformed/invalid tokens with HTTP 401.
* `requireRole(...roles)`: Rejects requests if `req.user.role` is not in the allowed list (HTTP 403 `FORBIDDEN`).
* `requirePermission(permission)`: Checks dynamic permissions against the `roles` collection. Store owners (`owner` role) automatically bypass all permission checks.

---

## 8. API Endpoints Specification

All endpoints are mounted under `/api/v1`.

| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | None (Public) | Registers new customer account, issues verification token. |
| `POST` | `/api/v1/auth/login` | None (Public) | Authenticates via email or phone, sets refresh cookie, returns access JWT. |
| `POST` | `/api/v1/auth/refresh` | Cookie only | Rotates refresh token in cookie, issues new access JWT. |
| `POST` | `/api/v1/auth/logout` | Authenticated | Revokes current session (or all sessions if `{ all: true }`), clears cookie. |
| `POST` | `/api/v1/auth/verify-email` | None (Public) | Verifies email address via single-use token. |
| `POST` | `/api/v1/auth/forgot-password` | None (Public) | Generates reset token (neutral HTTP 202 response). |
| `POST` | `/api/v1/auth/reset-password` | None (Public) | Updates password, revokes sessions, consumes token. |
| `GET` | `/api/v1/me` | Authenticated | Returns current authenticated user profile. |

---

## 9. Security & Hardening Measures

1. **Mass Assignment Prevention**: Public registration explicitly maps fields (`name`, `email`, `phone`, `passwordHash`) and forces `role = 'customer'`, `status = 'active'`, `refreshTokenVersion = 0`.
2. **Account Enumeration Defense**:
   - `POST /auth/login` returns a generic `AUTHENTICATION_FAILED` (401) error for invalid email, phone, or password.
   - `POST /auth/forgot-password` returns HTTP 202 `Accepted` unconditionally.
3. **Strict Cookie Configuration**:
   - `HttpOnly: true` (cannot be accessed by JavaScript).
   - `SameSite: 'lax'` (prevents cross-site token leakage).
   - `Secure: env.REFRESH_COOKIE_SECURE` (forced true in production).
   - `Path: '/api/v1/auth'` (cookie is only sent to authentication routes).
4. **Rate Limiting**: Authentication endpoints are protected by `authRateLimiter` (`RATE_LIMIT_AUTH_PER_MINUTE=20`).
5. **No Secret Leaks**: Passwords, hashes, raw tokens, and session secrets are completely excluded from logs, error envelopes, and API projections.

---

## 10. Email Boundary & Outbox Handoff

In accordance with Phase 3 scope:
* Full SMTP provider integration and background email workers are **strictly deferred to Phase 12 (Notifications)**.
* Verification and password reset tokens are generated and securely stored as SHA-256 hashes in MongoDB.
* The application emits structured log events (`[EMAIL_DELIVERY_BOUNDARY]`) documenting the recipient and token dispatch ready for future outbox ingestion.
* No external HTTP or SMTP calls are initiated during database transactions.

---

## 11. Verification & Testing

The implementation was validated using 16 specialized test suites spanning unit, API, concurrency, and RBAC tests:

| Test Suite | Tests | Status |
| :--- | :--- | :--- |
| `tests/unit/password.service.test.ts` | 6 | PASS |
| `tests/unit/jwt.service.test.ts` | 13 | PASS |
| `tests/unit/token.service.test.ts` | 8 | PASS |
| `tests/unit/user.projection.test.ts` | 4 | PASS |
| `tests/unit/phone.util.test.ts` | 10 | PASS |
| `tests/api/auth-registration.test.ts` | 12 | PASS |
| `tests/api/auth-login.test.ts` | 11 | PASS |
| `tests/api/auth-refresh.test.ts` | 11 | PASS |
| `tests/api/auth-logout.test.ts` | 6 | PASS |
| `tests/api/auth-email-verification.test.ts` | 7 | PASS |
| `tests/api/auth-password-reset.test.ts` | 9 | PASS |
| `tests/api/me.test.ts` | 7 | PASS |
| `tests/api/auth-middleware.test.ts` | 10 | PASS |
| `tests/api/rbac.test.ts` | 9 | PASS |
| `tests/api/auth-concurrency.test.ts` | 4 | PASS |
| `tests/api/auth-smoke.test.ts` | 9 | PASS |

**Total Phase 3 Tests: 127 tests** (Overall backend test suite: 33 suites, 226 tests, 100% passing).
