# AL-AZHARI LIBRARY — Error Handling Architecture

## 1. Overview

The backend uses a **centralized error handling architecture**. All application errors, schema validation failures, HTTP parser syntax errors, and uncaught exceptions are intercepted and transformed into a standardized, predictable envelope.

The system ensures that **no stack traces, database credentials, server file paths, or internal implementation details** are ever exposed in HTTP responses.

---

## 2. Standard Error Response Envelope

Every failed HTTP response adheres to the following envelope:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_IDENTIFIER",
    "message": "Human-readable safe error message",
    "details": null,
    "fields": [
      {
        "path": "field.name",
        "code": "required",
        "message": "Field is required"
      }
    ]
  },
  "requestId": "req_550e8400-e29b-41d4-a716-446655440000",
  "meta": {
    "requestId": "req_550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-09-26T12:00:00.000Z"
  }
}
```

### Envelope Fields
* **`success`** (`false`): Clearly indicates an error condition.
* **`error.code`**: Machine-readable stable uppercase string identifier.
* **`error.message`**: Safe, human-readable description appropriate for client display.
* **`error.details`**: Optional structured object with additional error context (or `null`).
* **`error.fields`**: Optional array of field-level validation errors (present during schema validation failures).
* **`requestId`**: Unique request correlation identifier. Matches the `X-Request-Id` response header.
* **`meta`**: Metadata object containing `requestId` and ISO-8601 UTC `timestamp`.

---

## 3. Error Codes & HTTP Status Mapping

| Error Code | HTTP Status | Description / Scenario |
|:---|:---:|:---|
| `VALIDATION_ERROR` | `400` | Request body, query, or parameter failed schema validation (or JSON is malformed) |
| `BAD_REQUEST` | `400` | Malformed request or invalid parameters |
| `AUTH_REQUIRED` | `401` | Missing or invalid authentication token |
| `AUTH_INVALID_CREDENTIALS` | `401` | Invalid email or password during login |
| `FORBIDDEN` | `403` | User lacks the required role, permission, or resource ownership |
| `NOT_FOUND` | `404` | Requested route, product, order, or entity does not exist |
| `RESOURCE_CONFLICT` | `409` | Conflict with current state (e.g. duplicate email, unique constraint) |
| `ORDER_STATE_CONFLICT` | `409` | Requested order lifecycle transition is invalid from current state |
| `INSUFFICIENT_STOCK` | `409` | Requested quantity exceeds available inventory |
| `IDEMPOTENCY_KEY_REUSED` | `409` | Request attempted with a reused idempotency key and mismatched payload |
| `BUSINESS_RULE_VIOLATION` | `422` | Domain constraint violated (e.g. attempting to add a student service to the product cart) |
| `RATE_LIMITED` | `429` | Request limit exceeded for client IP or account tier |
| `INTERNAL_ERROR` | `500` | Unhandled internal exception; safe generic response returned |
| `DEPENDENCY_UNAVAILABLE` | `503` | External dependency (e.g. database, Cloudinary, SMTP) temporarily unavailable |

---

## 4. Class Hierarchy

All application errors inherit from the base `AppError` class:

```text
Error (native JS)
  └── AppError
        ├── ValidationError           (400, VALIDATION_ERROR)
        ├── BadRequestError            (400, BAD_REQUEST)
        ├── UnauthorizedError          (401, AUTH_REQUIRED)
        ├── ForbiddenError             (403, FORBIDDEN)
        ├── NotFoundError              (404, NOT_FOUND)
        ├── ConflictError              (409, RESOURCE_CONFLICT)
        ├── BusinessRuleViolationError (422, BUSINESS_RULE_VIOLATION)
        └── DependencyUnavailableError (503, DEPENDENCY_UNAVAILABLE, retryable=true)
```

### Base `AppError` Definition

```typescript
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode | string,
    message: string,
    public readonly status: number = 500,
    public readonly details?: unknown,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
```

---

## 5. Middleware Interception

The centralized `errorHandlerMiddleware` handles four distinct categories of errors:

1. **Known `AppError` instances**:
   * Logs a warning with request context (`requestId`, method, path, error code).
   * Emits the defined HTTP status code and custom message.
2. **`ZodError` schema validation failures**:
   * Formats each issue into `{ path, code, message }`.
   * Responds with HTTP `400 Bad Request` and `VALIDATION_ERROR` code.
3. **`SyntaxError` (Malformed JSON)**:
   * When `express.json()` fails to parse a request body, intercepts the error.
   * Responds with HTTP `400 Bad Request` and `VALIDATION_ERROR` with message `"Malformed JSON payload in request body"`.
4. **Unhandled / Unexpected Errors**:
   * Logs full error stack traces and internal diagnostics server-side with `logger.error`.
   * Responds to the client with HTTP `500 Internal Server Error`, code `INTERNAL_ERROR`, and generic message `"An unexpected internal error occurred."`.
