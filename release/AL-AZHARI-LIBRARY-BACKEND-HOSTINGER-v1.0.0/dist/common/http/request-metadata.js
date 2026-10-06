"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientIp = getClientIp;
exports.getUserAgent = getUserAgent;
exports.getRequestMetadata = getRequestMetadata;
/**
 * Safely extracts client IP address respecting the application's proxy trust configuration.
 */
function getClientIp(req) {
    if (req.ip) {
        return req.ip;
    }
    if (req.socket?.remoteAddress) {
        return req.socket.remoteAddress;
    }
    return 'unknown';
}
/**
 * Safely extracts User-Agent string from request headers.
 */
function getUserAgent(req) {
    return req.headers['user-agent'] || 'unknown';
}
/**
 * Extracts a safe metadata summary for request logging, auditing, or error correlation.
 * Never includes cookies, authorization tokens, or sensitive payload credentials.
 */
function getRequestMetadata(req) {
    const originHeader = req.headers['origin'];
    const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;
    const refererHeader = req.headers['referer'] || req.headers['referrer'];
    const referrer = Array.isArray(refererHeader) ? refererHeader[0] : refererHeader;
    return {
        requestId: String(req.id || req.headers['x-request-id'] || 'req_unknown'),
        method: req.method,
        path: req.path,
        originalUrl: req.originalUrl,
        ip: getClientIp(req),
        userAgent: getUserAgent(req),
        ...(origin ? { origin } : {}),
        ...(referrer ? { referrer } : {}),
        timestamp: new Date().toISOString(),
    };
}
//# sourceMappingURL=request-metadata.js.map