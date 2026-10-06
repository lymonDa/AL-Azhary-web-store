"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
exports.getAllowedOrigins = getAllowedOrigins;
exports.isOriginAllowed = isOriginAllowed;
const env_1 = require("./env");
const errors_1 = require("../common/errors");
function getAllowedOrigins() {
    const origins = new Set();
    if (env_1.env.ALLOWED_ORIGINS) {
        env_1.env.ALLOWED_ORIGINS.split(',')
            .map((o) => o.trim())
            .filter(Boolean)
            .forEach((o) => origins.add(o));
    }
    if (env_1.env.PUBLIC_APP_ORIGIN) {
        origins.add(env_1.env.PUBLIC_APP_ORIGIN.trim());
    }
    return Array.from(origins);
}
function isOriginAllowed(origin) {
    if (!origin) {
        return true;
    }
    const origins = getAllowedOrigins();
    // In production, wildcard '*' is strictly forbidden
    if (env_1.env.NODE_ENV !== 'production' && origins.includes('*')) {
        return true;
    }
    return origins.includes(origin);
}
exports.corsOptions = {
    origin: (origin, callback) => {
        // Requests with no origin (e.g., mobile apps, curl, server-to-server, same-origin)
        if (!origin) {
            return callback(null, true);
        }
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        return callback(new errors_1.ForbiddenError(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Request-Id',
        'X-Guest-Token',
        'Idempotency-Key',
    ],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 204,
};
//# sourceMappingURL=cors.js.map