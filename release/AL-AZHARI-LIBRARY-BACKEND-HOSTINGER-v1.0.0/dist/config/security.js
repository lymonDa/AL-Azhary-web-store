"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMutationRateLimiter = exports.proofUploadRateLimiter = exports.guestOrderRateLimiter = exports.accountRateLimiter = exports.authRateLimiter = exports.publicRateLimiter = exports.helmetOptions = void 0;
exports.createRateLimiter = createRateLimiter;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./env");
const errors_1 = require("../common/errors");
exports.helmetOptions = {
    contentSecurityPolicy: env_1.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
    xContentTypeOptions: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: env_1.env.NODE_ENV === 'production'
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        }
        : false,
};
function createRateLimiter(options = {}) {
    const { customMessage, ...restOptions } = options;
    return (0, express_rate_limit_1.default)({
        windowMs: options.windowMs ?? env_1.env.RATE_LIMIT_WINDOW_MS,
        max: options.max ?? env_1.env.RATE_LIMIT_PUBLIC_PER_MINUTE,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res, _next, opts) => {
            const requestId = String(req.id || 'req_unknown');
            const message = customMessage || 'Too many requests, please try again later.';
            const response = {
                success: false,
                error: {
                    code: errors_1.ErrorCodes.RATE_LIMITED,
                    message,
                    details: null,
                },
                requestId,
                meta: {
                    requestId,
                    timestamp: new Date().toISOString(),
                },
            };
            res.status(opts.statusCode).json(response);
        },
        ...restOptions,
    });
}
// 1. Public IP rate limiter (catalog, search, content)
exports.publicRateLimiter = createRateLimiter({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_PUBLIC_PER_MINUTE,
    customMessage: 'Too many requests, please try again later.',
});
// 2. Auth IP rate limiter (login, registration, refresh)
exports.authRateLimiter = createRateLimiter({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_AUTH_PER_MINUTE,
    customMessage: 'Too many authentication attempts, please try again later.',
});
// 3. Account / Identifier rate limiter (per account/email to prevent credential stuffing)
exports.accountRateLimiter = createRateLimiter({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_ACCOUNT_PER_MINUTE,
    keyGenerator: (req) => {
        const identifier = req.body?.email || req.body?.phone || req.body?.identifier;
        if (typeof identifier === 'string' && identifier.trim()) {
            return `account:${identifier.trim().toLowerCase()}`;
        }
        return req.ip || 'ip_unknown';
    },
    customMessage: 'Too many attempts for this account, please try again later.',
});
// 4. Guest order rate limiter (order creation, lookup)
exports.guestOrderRateLimiter = createRateLimiter({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_GUEST_ORDER_PER_MINUTE,
    customMessage: 'Too many guest order operations, please try again later.',
});
// 5. Proof upload rate limiter (payment proof metadata submission)
exports.proofUploadRateLimiter = createRateLimiter({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_PROOF_UPLOAD_PER_MINUTE,
    customMessage: 'Too many payment proof upload attempts, please try again later.',
});
// 6. Admin mutation rate limiter (sensitive operational mutations)
exports.adminMutationRateLimiter = createRateLimiter({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_ADMIN_MUTATION_PER_MINUTE,
    keyGenerator: (req) => req.user?.userId || req.ip || 'admin_unknown',
    customMessage: 'Too many administrative mutations, please try again later.',
});
//# sourceMappingURL=security.js.map