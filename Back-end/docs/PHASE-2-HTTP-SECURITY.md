# AL-AZHARI LIBRARY — Phase 2: Common Utilities, Security Middleware & HTTP Enhancements

## 1. Executive Summary

Phase 2 establishes the **common HTTP and security foundation** for the AL-AZHARI LIBRARY backend. It provides hardened middleware, reusable input parsers, robust query sanitizers, sensitive data redaction, pagination helpers, validation primitives, and standardized response envelopes that all future business modules (auth, users, products, orders, etc.) will consume.

All capabilities are designed with production-grade security defaults, strict TypeScript typings, zero external cloud dependencies for testing, and total isolation from real database mutations.

---

## 2. Request Lifecycle Pipeline

Every incoming HTTP request traverses the following standardized lifecycle:

```text
HTTP Request
    ↓
Reverse Proxy Trust (app.set('trust proxy', env.TRUST_PROXY))
    ↓
Security Headers (Helmet)
    ↓
CORS Validation (Strict origin check, credentials, preflight cache)
    ↓
Request Correlation (UUID / Sanitized X-Request-Id header injection)
    ↓
Body Size & Parsing Protection (JSON & URL-encoded 1MB caps)
    ↓
Structured HTTP Logging (Pino HTTP with sensitive field redaction)
    ↓
Rate Limiting (Public tier with Retry-After and standard envelope)
    ↓
Input & Query Safety (Validation schemas, query & sort parsers, filters, safe search)
    ↓
Controllers & Services (Business logic & repository operations)
    ↓
Response Envelopes (sendSuccess, sendCreated, sendNoContent, sendError)
    ↓
Centralized Error Handling (No stack leaks, safe error codes, request ID correlation)
```

---

## 3. Security Middleware & HTTP Protection

### 3.1 Helmet Security Headers
Configured via `src/config/security.ts` using `helmet(helmetOptions)`:
* **`X-Content-Type-Options: nosniff`**: Prevents MIME-type sniffing vulnerabilities.
* **`X-Frame-Options: SAMEORIGIN`**: Mitigates clickjacking attacks while allowing same-origin frame embedding if needed.
* **`X-DNS-Prefetch-Control: off`**: Disables DNS prefetching to avoid privacy leakage.
* **`X-Powered-By`**: Automatically removed by Express/Helmet to prevent server fingerprinting.
* **`Content-Security-Policy`**: Disabled in development to support Swagger and testing tools; strictly enforced in production.

### 3.2 Centralized CORS Configuration
Configured in `src/config/cors.ts`:
* **Origin Resolution**: Combines `ALLOWED_ORIGINS` and `PUBLIC_APP_ORIGIN` dynamically into a normalized whitelist.
* **Unauthorized Origins**: Rejects unknown origins with an explicit HTTP 403 `ForbiddenError` and standard error envelope.
* **Credentials Support**: `credentials: true` enables secure HTTP-only refresh cookies (`al_azhari_refresh`).
* **Preflight Requests**: Handles HTTP `OPTIONS` requests gracefully with 204 status, allowed headers, and 24-hour preflight caching (`maxAge: 86400`).
* **Exposed Headers**: Exposes `X-Request-Id` to client browsers for tracking.

### 3.3 Body Parsing & Size Limits
Enforced in `src/app.ts`:
* **JSON Body**: `express.json({ limit: '1mb' })`
* **URL-encoded Body**: `express.urlencoded({ extended: true, limit: '1mb' })`
* **Oversized Requests**: Intercepted by `errorHandlerMiddleware` as `entity.too.large` (HTTP 413), returning a structured `PAYLOAD_TOO_LARGE` envelope.

### 3.4 Rate Limiting Infrastructure
Configured in `src/config/security.ts`:
* Dependency-free in-memory rate limiting powered by `express-rate-limit`.
* Standardized error response using `createRateLimiter(options)` factory:
  ```json
  {
    "success": false,
    "error": {
      "code": "RATE_LIMITED",
      "message": "Too many requests, please try again later.",
      "details": null
    },
    "requestId": "req_...",
    "meta": {
      "requestId": "req_...",
      "timestamp": "2026-09-26T12:00:00.000Z"
    }
  }
  ```
* Standard headers emitted: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After`.

---

## 4. Reusable HTTP & Query Utilities

### 4.1 Request Correlation (`requestIdMiddleware`)
Located in `src/common/middleware/request-id.middleware.ts`:
* Validates incoming `X-Request-Id` strictly against `/^[a-zA-Z0-9_-]{1,128}$/`.
* Untrusted or malformed IDs are safely discarded and replaced with a cryptographic UUID (`req_<uuid>`).
* Emits `X-Request-Id` in response headers and embeds it in `req.id`, logs, and response envelopes.

### 4.2 Safe Request Metadata (`getRequestMetadata`)
Located in `src/common/http/request-metadata.ts`:
* Safely extracts `{ requestId, method, path, originalUrl, ip, userAgent, origin, referrer, timestamp }`.
* Respects `trust proxy` configuration via Express's `req.ip`.
* Never exposes authorization headers, session cookies, passwords, or secrets.

### 4.3 Pagination Utilities
Located in `src/common/http/pagination.ts`:
* `parsePagination(query, options)`: Extracts `{ page, limit, skip }`. Rejects non-integer, negative, or excessive limits (> 100).
* `createPaginationMeta({ page, limit, total, nextCursor })`: Generates standard metadata:
  ```typescript
  {
    page: 1,
    limit: 20,
    total: 100,
    totalPages: 5,
    hasNextPage: true,
    hasPreviousPage: false,
    nextCursor?: string | null
  }
  ```

### 4.4 Safe Sorting (`parseSort`)
Located in `src/common/http/query.ts`:
* Whitelist-enforced sorting parsing.
* Supports `?sort=createdAt` (asc), `?sort=-price` (desc), `?sort=rating,-createdAt`, or `?sort=price&order=desc`.
* Rejects unallowed sort fields and raw MongoDB operator injection attempts with `ValidationError`.

### 4.5 Safe Filtering (`parseFilters`)
Located in `src/common/http/query.ts`:
* Strictly prevents NoSQL operator injection (`$where`, `$regex`, `$gt`, `$expr`, etc.).
* Enforces typed parsing and validation: `boolean`, `number`, `objectId` (24-hex), `date`, `enum`, or custom validate/transform functions.
* Rejects raw nested query objects from untrusted HTTP parameters.

### 4.6 Safe Search (`sanitizeSearchString`, `buildSafeRegexSearch`, `escapeRegex`)
Located in `src/common/http/query.ts`:
* Trims whitespace and normalizes empty inputs to `null`.
* Enforces maximum character length (default 100).
* Automatically escapes all regex metacharacters (`[-[\]{}()*+?.,\\^$|#\s]`).
* Generates safe `$or` queries across whitelisted fields with case-insensitivity (`$options: 'i'`).

### 4.7 Sensitive Data Redaction (`redactSensitiveData`)
Located in `src/common/security/redact.ts`:
* Deeply traverses objects, arrays, and errors.
* Case-insensitive matching for sensitive keys: `password`, `token`, `secret`, `apiKey`, `cookie`, `authorization`, `cvv`, `cardNumber`, `paymentProof`, `smtpPassword`, `cloudinaryApiSecret`, `mongoUri`, etc.
* Safe handling of circular references (`[Circular]`).
* Strictly immutable (preserves input object without side-effects).

### 4.8 Zod Validation Helpers (`validateRequest`)
Located in `src/common/validators/common.validators.ts`:
* Primitives: `requiredString`, `optionalString`, `positiveInteger`, `nonNegativeInteger`, `booleanCoerce`, `objectIdSchema`, `emailSchema`, `enumSchema`, `paginationQuerySchema`.
* `validateRequest({ body, query, params })`: Express middleware factory that validates and strongly types request parameters.

### 4.9 Standard Response Envelopes
Located in `src/common/http/envelope.ts` and `src/common/utils/response.util.ts`:
* `sendSuccess(req, res, data, 200, pagination)`
* `sendCreated(req, res, data, pagination)` (HTTP 201)
* `sendNoContent(res)` (HTTP 204)
* `sendError(req, res, errorPayload, 500)`

---

## 5. Usage Examples for Future Modules

### Example: Controller Using Utilities

```typescript
import { Request, Response, NextFunction } from 'express';
import {
  parsePagination,
  createPaginationMeta,
  parseSort,
  parseFilters,
  sanitizeSearchString,
  buildSafeRegexSearch,
  sendSuccess,
  sendCreated,
} from '../../common';

export async function listProductsController(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Pagination
    const { page, limit, skip } = parsePagination(req.query);

    // 2. Sorting (whitelisted)
    const sort = parseSort(req.query, {
      allowedFields: ['createdAt', 'price', 'title', 'rating'],
      defaultSort: { createdAt: -1 },
    });

    // 3. Filtering (whitelisted and typed)
    const filters = parseFilters(req.query, {
      allowed: {
        categoryId: { type: 'objectId' },
        isActive: { type: 'boolean' },
        status: { type: 'enum', enumValues: ['draft', 'published', 'archived'] },
      },
    });

    // 4. Safe Search
    const search = sanitizeSearchString(req.query.search);
    const searchQuery = buildSafeRegexSearch(search, ['title', 'description']);

    const query = {
      ...filters,
      ...(searchQuery || {}),
    };

    // Execute via repository (pseudo-code)
    const [items, total] = await Promise.all([
      productRepository.find(query, { skip, limit, sort }),
      productRepository.count(query),
    ]);

    const pagination = createPaginationMeta({ page, limit, total });
    return sendSuccess(req, res, items, 200, pagination);
  } catch (error) {
    next(error);
  }
}
```

---

## 6. Environment Variables Reference

Phase 2 introduces two new configuration variables with safe production and development defaults:

| Variable | Type | Default | Description |
|:---|:---:|:---:|:---|
| `TRUST_PROXY` | `boolean/number/string` | `1` | Configures Express reverse proxy trust level (for Hostinger/Nginx) |
| `RATE_LIMIT_WINDOW_MS` | `number` | `60000` | Rate limiting evaluation window in milliseconds (1 minute) |

---

## 7. Verification Results

All quality commands run and verified clean:

```bash
npm run typecheck   # 0 errors
npm run lint        # 0 errors, 0 warnings
npm run build       # Successful compilation to dist/
npm test            # 17 test suites passed, 147 total tests passed (100%)
```
