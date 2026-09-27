# AL-AZHARI LIBRARY — Environment Configuration

## 1. Overview

Environment variables are loaded via `dotenv` and validated at application startup using a strict **Zod** schema (`src/config/env.ts`).

If any required variable is missing or fails validation:
1. Application startup halts immediately with a clear error summary.
2. Sensitive secret values are never printed in error logs or output.

---

## 2. Configuration Reference

| Variable | Type | Default | Description |
|:---|:---:|:---:|:---|
| `NODE_ENV` | `enum` | `development` | Environment mode (`development`, `test`, `production`) |
| `PORT` | `number` | `3000` | Port for the HTTP server |
| `API_BASE_PATH` | `string` | `/api/v1` | Base route prefix for all API routes |
| `PUBLIC_APP_ORIGIN` | `string` | `http://localhost:4200` | Primary frontend web client URL |
| `ALLOWED_ORIGINS` | `string` | `http://localhost:4200` | Comma-separated list of allowed CORS origins |
| `MONGODB_URI` | `string` | *(Atlas URI)* | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | `string` | `al_azhari_library` | Database name |
| `JWT_ACCESS_SECRET` | `string` | *(32+ char secret)* | Secret for signing JWT access tokens (min 32 chars) |
| `JWT_ACCESS_TTL` | `string` | `15m` | Lifetime of access tokens |
| `JWT_REFRESH_SECRET` | `string` | *(32+ char secret)* | Secret for signing refresh tokens (min 32 chars) |
| `JWT_REFRESH_TTL` | `string` | `7d` | Lifetime of refresh tokens |
| `JWT_ISSUER` | `string` | `al-azhari-library` | JWT issuer claim (`iss`) |
| `JWT_AUDIENCE` | `string` | `al-azhari-web` | JWT audience claim (`aud`) |
| `REFRESH_COOKIE_NAME` | `string` | `al_azhari_refresh` | Cookie name for the refresh token |
| `REFRESH_COOKIE_SECURE`| `boolean`| `false` | Enable `Secure` flag for cookies (required in production) |
| `REFRESH_COOKIE_SAME_SITE`| `enum`| `lax` | Cookie `SameSite` policy (`lax`, `strict`, `none`) |
| `ARGON2_MEMORY_COST` | `number` | `65536` | Argon2id memory cost in KiB |
| `ARGON2_TIME_COST` | `number` | `3` | Argon2id iteration count |
| `ARGON2_PARALLELISM` | `number` | `4` | Argon2id thread count |
| `CLOUDINARY_CLOUD_NAME` | `string` | *(optional)* | Cloudinary cloud account name |
| `CLOUDINARY_API_KEY` | `string` | *(optional)* | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `string` | *(optional)* | Cloudinary API secret |
| `CLOUDINARY_PAYMENT_PROOF_FOLDER` | `string` | `al-azhari/payment-proofs` | Folder path for payment receipts |
| `CLOUDINARY_PRODUCT_FOLDER` | `string` | `al-azhari/products` | Folder path for product catalog media |
| `SMTP_HOST` | `string` | `smtp.example.com` | SMTP email server hostname |
| `SMTP_PORT` | `number` | `587` | SMTP port |
| `SMTP_SECURE` | `boolean` | `false` | Use TLS directly (port 465) or STARTTLS (port 587) |
| `SMTP_USER` | `string` | *(optional)* | SMTP username |
| `SMTP_PASSWORD` | `string` | *(optional)* | SMTP password |
| `EMAIL_FROM` | `string` | `no-reply@al-azhari.com`| Sender address on outgoing notification emails |
| `WHATSAPP_PHONE` | `string` | *(optional)* | Store WhatsApp phone number for customer queries |
| `SOCKET_PATH` | `string` | `/socket.io` | WebSocket path for Socket.IO |
| `TRUST_PROXY` | `boolean/number/string` | `1` | Reverse proxy trust configuration for Express |
| `RATE_LIMIT_WINDOW_MS` | `number` | `60000` | Rate limiting calculation window in milliseconds |
| `RATE_LIMIT_PUBLIC_PER_MINUTE` | `number`| `100` | Maximum requests per minute per IP on public routes |
| `RATE_LIMIT_AUTH_PER_MINUTE` | `number`| `20` | Maximum requests per minute per IP on auth routes |
| `OUTBOX_POLL_INTERVAL_MS` | `number`| `5000` | In-process Outbox polling interval in milliseconds |
| `OUTBOX_MAX_ATTEMPTS` | `number` | `5` | Maximum retry attempts before marking an outbox event failed |

---

## 3. Production Safety Constraints

When `NODE_ENV=production`, the schema automatically enforces the following invariants:

1. **`MONGODB_URI`**: Must be a valid remote URI (cannot point to `localhost` or `127.0.0.1`).
2. **`JWT_ACCESS_SECRET`**: Must be at least 32 characters and cannot equal the default development secret.
3. **`JWT_REFRESH_SECRET`**: Must be at least 32 characters and cannot equal the default development secret.
4. **`REFRESH_COOKIE_SECURE`**: Must be set to `true` to ensure authentication cookies are transmitted exclusively over HTTPS.

---

## 4. Secret Protection & Logging Rules

1. `.env` is listed in `.gitignore` and must **never** be checked into version control.
2. `.env.example` contains only structure and variable placeholders, never actual production secrets.
3. Pino logger automatically redacts sensitive paths (`authorization`, `cookie`, `password`, `token`, `secret`, `apiKey`, `paymentProofUrl`, etc.).
4. Validation error summaries print only the offending field paths and descriptions, never the values.
