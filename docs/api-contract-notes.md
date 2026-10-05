# AL-AZHARI LIBRARY — Frontend API Contract Notes

> **Authority**: Verified directly against backend source code in `Back-end/src/` and Postman collection `Back-end/postman/al-azhari-library.postman_collection.json`.
> **Scope**: Gating items for Phase 2–5 and all Gap B items from the Frontend Implementation Plan.

---

## 1. Authentication & Session Model (§10)

| Concern | Verified Backend Contract | Frontend Architectural Impact |
| :--- | :--- | :--- |
| **Token Transport** | Access Token: returned in response body `{ data: { accessToken, user } }`. Refresh Token: stored in HTTP-only cookie `refreshToken` (`/api/v1/auth/refresh`). | Memory-only access token in `AuthStore`. Never stored in `localStorage` or `sessionStorage`. |
| **Session Restore** | `POST /api/v1/auth/refresh` without body. If 200, returns `{ accessToken, user }`. If 401, returns `AUTH_REQUIRED`. | `AuthService.restore()` calls `POST /auth/refresh` once on app bootstrap. If 401, sets `anonymous` state silently. |
| **User Profile & Roles** | `GET /api/v1/me` returns current user record including `id`, `email`, `role`, `status`, `name`, `phone`, and `permissions: string[]`. | RBAC guards check `permissions.includes(...)` or `role === 'admin'`. |
| **Logout** | `POST /api/v1/auth/logout` clears HTTP-only cookie and blacklists active session. | `AuthStore.logout()` calls endpoint, resets auth state to `anonymous`, clears user cart. |

---

## 2. Cart & Guest Session Transport (§4.3, §23)

| Concern | Verified Backend Contract | Frontend Architectural Impact |
| :--- | :--- | :--- |
| **Guest Session Resolution** | Handled by `cart-owner.middleware.ts`. Checks header `x-guest-session-id` (or `x-session-id`), then cookie `al_azhari_guest_session`. If missing, server generates UUID. | Server response returns header `x-guest-session-id` and sets cookie. Frontend stores session ID in memory/sessionStorage and attaches `x-guest-session-id` on cart calls. |
| **Cart Ownership** | Authenticated requests use `req.user.userId`. Unauthenticated requests use `req.cartOwner.sessionId`. | Cart API service uses standard HTTP interceptors; session header attached automatically for guest users. |
| **Cart Merge Trigger** | `POST /api/v1/cart/merge` accepts `{ sessionId?: string, expectedUserCartVersion?: number }`. | Called explicitly upon successful login when a guest session exists. |
| **Concurrency Control** | Optimistic concurrency using `expectedVersion: number` on item mutations. | `CartStore` tracks and increments version, handles 409 conflict by refetching `GET /cart`. |

---

## 3. Checkout & Orders Contract (§4.3, §24)

| Concern | Verified Backend Contract | Frontend Architectural Impact |
| :--- | :--- | :--- |
| **Guest Order Token** | Created order response returns `{ order: { reference, guestAccessToken, ... } }`. | Guest token held in `GuestOrderTokenStore` (memory + `sessionStorage` keyed by reference). |
| **Guest Order Access** | `GET /api/v1/orders/:reference` accepts `x-guest-token` header OR query parameter `?token=...`. | `OrdersApi.getByReference(reference, guestToken)` sends `x-guest-token`. |
| **COD Confirmation** | Endpoint exists: `POST /api/v1/orders/:reference/confirm-cod`. | COD orders can be confirmed directly from tracking/order detail page. |
| **Shipping Estimate** | `POST /api/v1/checkout/shipping-estimate` with `{ governorate, items }`. | Used by checkout step 1 to calculate accurate shipping fees before order creation. |
| **Coupon Validation** | `POST /api/v1/checkout/validate-coupon` (mounted under `/checkout`). | Used in checkout summary to validate discount codes. |

---

## 4. Payment Proof Workflow (§4.3, §25)

| Concern | Verified Backend Contract | Frontend Architectural Impact |
| :--- | :--- | :--- |
| **Payment Status Query** | `GET /api/v1/orders/:reference/payment`. | Retrieves current payment state (`pending_proof`, `reviewing`, `paid`, `rejected`). |
| **Upload Configuration** | `POST /api/v1/orders/:reference/payment-proof/upload-config`. Returns signed Cloudinary parameters (`timestamp`, `signature`, `apiKey`, `cloudName`, `folder`). | Frontend uploads directly to Cloudinary using signed payload, avoiding large file uploads through application server. |
| **Proof Submission** | `POST /api/v1/orders/:reference/payment-proofs` with `{ publicId, secureUrl, format, bytes, note? }`. | Submits uploaded image metadata to backend to transition order to `reviewing`. |
| **Admin Signed URL** | `GET /api/v1/admin/payments/:paymentId/proofs/:submissionNumber/signed-url`. | Admin retrieves short-lived signed URL for secure proof inspection. |

---

## 5. Catalog, Search & Pagination (§11, §22)

| Concern | Verified Backend Contract | Frontend Architectural Impact |
| :--- | :--- | :--- |
| **Pagination Shape** | Query params: `page` (default 1), `limit` (default 20, max 100). | `PaginationMeta` interface: `{ page, limit, total, totalPages, hasNextPage, hasPrevPage }`. |
| **Product Sorting** | Allowed values: `newest`, `price_asc`, `price_desc`, `popular`, `title_asc`. | Typed sort dropdown in catalog and search screens. |
| **Search Endpoint** | `GET /api/v1/search?q=...&category=...&minPrice=...&maxPrice=...&sort=...`. | Unified search query builder in `CatalogApi`. |

---

## 6. Realtime & Notifications (§20)

| Concern | Verified Backend Contract | Frontend Architectural Impact |
| :--- | :--- | :--- |
| **Realtime Protocol** | Socket.IO server at `/socket.io`. | Handled by `RealtimeService` (foundation interface in Phase 0; live connection in Phase 8). |
| **Room Subscriptions** | Rooms: `user:${userId}` for customers, `admin` for admin notifications, `order:${reference}` for order status updates. | Event deduplication and channel management inside `RealtimeService`. |
| **Notification API** | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, `PATCH /api/v1/notifications/read-all`. | Integrated in customer and admin notification stores. |

---

## 7. Open Decisions Closed for Frontend

- **FB-01 (Styling Engine)**: SCSS + CSS Custom Properties Design System. No Tailwind runtime. Tokens in `src/styles/tokens/`.
- **FB-02 (SSR / Prerender)**: Architecture built SSR-safe from day one using `PlatformService` and `SafeStorage`.
- **FB-12 (Brand Assets & Logo)**: Verified in `design-website/img/Brand-Identity.png`. Primary green: `#0f4c3a`, accent gold: `#80601d`, typography: IBM Plex Sans Arabic + Inter.
