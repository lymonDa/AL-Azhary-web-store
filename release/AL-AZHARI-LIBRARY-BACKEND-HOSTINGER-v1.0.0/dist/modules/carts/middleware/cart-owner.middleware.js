"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GUEST_SESSION_HEADER_NAME = exports.GUEST_SESSION_COOKIE_NAME = void 0;
exports.resolveCartOwner = resolveCartOwner;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../../../config/env");
exports.GUEST_SESSION_COOKIE_NAME = 'al_azhari_guest_session';
exports.GUEST_SESSION_HEADER_NAME = 'x-guest-session-id';
const SESSION_ID_REGEX = /^[a-zA-Z0-9_-]{16,128}$/;
/**
 * Resolves the cart owner context for the request.
 * - Authenticated users are bound to their user ID (principal).
 * - Guest requests are bound to an unpredictable guest session identifier.
 * - If no guest session exists or if it is malformed, a secure random session ID is generated.
 */
function resolveCartOwner() {
    return (req, res, next) => {
        try {
            // 1. Authenticated customer
            if (req.user?.userId) {
                req.cartOwner = {
                    ownerType: 'user',
                    userId: req.user.userId,
                };
                return next();
            }
            // 2. Guest user session resolution
            let sessionId;
            // Check header first
            const rawHeader = req.headers[exports.GUEST_SESSION_HEADER_NAME] || req.headers['x-session-id'];
            if (typeof rawHeader === 'string' && SESSION_ID_REGEX.test(rawHeader.trim())) {
                sessionId = rawHeader.trim();
            }
            // Check cookie if header not provided
            if (!sessionId && req.cookies) {
                const rawCookie = req.cookies[exports.GUEST_SESSION_COOKIE_NAME] || req.cookies['guest_session_id'];
                if (typeof rawCookie === 'string' && SESSION_ID_REGEX.test(rawCookie.trim())) {
                    sessionId = rawCookie.trim();
                }
            }
            // Generate new secure unpredictable guest session ID if none or invalid
            if (!sessionId) {
                sessionId = crypto_1.default.randomUUID();
            }
            // Always set cookie and header for guest clients
            res.setHeader(exports.GUEST_SESSION_HEADER_NAME, sessionId);
            res.cookie(exports.GUEST_SESSION_COOKIE_NAME, sessionId, {
                httpOnly: true,
                secure: env_1.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                path: '/',
            });
            const guestOwner = {
                ownerType: 'guest',
                sessionId,
            };
            req.cartOwner = guestOwner;
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=cart-owner.middleware.js.map