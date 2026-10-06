"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderReference = generateOrderReference;
exports.generateGuestAccessToken = generateGuestAccessToken;
exports.hashGuestToken = hashGuestToken;
exports.calculateIdempotencyFingerprint = calculateIdempotencyFingerprint;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates an authoritative order reference:
 * Pattern: ORD-YYYYMMDD-XXXX (e.g. ORD-20260928-7A4B)
 * Safe under high concurrency.
 */
function generateOrderReference(date = new Date()) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const randomSuffix = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${year}${month}${day}-${randomSuffix}`;
}
/**
 * Generates a cryptographically secure 256-bit guest access token.
 */
function generateGuestAccessToken() {
    const rawToken = crypto_1.default.randomBytes(32).toString('hex');
    const tokenHash = hashGuestToken(rawToken);
    return { rawToken, tokenHash };
}
/**
 * SHA-256 hash of a guest token for secure DB storage and lookup.
 */
function hashGuestToken(token) {
    return crypto_1.default.createHash('sha256').update(token.trim()).digest('hex');
}
function canonicalize(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(canonicalize);
    }
    const sortedKeys = Object.keys(obj).sort();
    const result = {};
    for (const key of sortedKeys) {
        result[key] = canonicalize(obj[key]);
    }
    return result;
}
/**
 * Produces a stable SHA-256 fingerprint of the request payload to detect idempotency key reuse.
 */
function calculateIdempotencyFingerprint(payload) {
    const canonical = canonicalize(payload);
    const serialized = JSON.stringify(canonical);
    return crypto_1.default.createHash('sha256').update(serialized).digest('hex');
}
//# sourceMappingURL=order.utils.js.map