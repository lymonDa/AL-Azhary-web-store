"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetSocketHandshakeRateLimits = resetSocketHandshakeRateLimits;
exports.socketAuthMiddleware = socketAuthMiddleware;
const jwt_service_1 = require("../../modules/auth/services/jwt.service");
const users_repository_1 = require("../../modules/users/repositories/users.repository");
const logger_1 = require("../../config/logger");
const env_1 = require("../../config/env");
// In-memory sliding window rate limiter for socket connection attempts by IP
const socketHandshakeTracker = new Map();
function resetSocketHandshakeRateLimits() {
    socketHandshakeTracker.clear();
}
/**
 * Socket.IO Handshake Authentication Middleware.
 * Validates JWT access token, checks user active status, verifies session version, and enforces handshake rate limits.
 */
async function socketAuthMiddleware(socket, next) {
    try {
        const clientIp = socket.handshake.address || 'ip_unknown';
        const now = Date.now();
        const windowMs = env_1.env.RATE_LIMIT_WINDOW_MS;
        const maxAttempts = env_1.env.RATE_LIMIT_SOCKET_PER_MINUTE;
        let record = socketHandshakeTracker.get(clientIp);
        if (!record || record.resetAt <= now) {
            record = { count: 1, resetAt: now + windowMs };
            socketHandshakeTracker.set(clientIp, record);
        }
        else {
            record.count += 1;
        }
        if (record.count > maxAttempts) {
            return next(new Error('RATE_LIMITED'));
        }
        const authHeader = socket.handshake.headers.authorization;
        const tokenFromAuth = socket.handshake.auth?.token;
        let rawToken = null;
        if (typeof tokenFromAuth === 'string' && tokenFromAuth.trim()) {
            rawToken = tokenFromAuth.trim();
        }
        else if (typeof authHeader === 'string') {
            const parts = authHeader.trim().split(' ');
            if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
                rawToken = parts[1];
            }
        }
        if (!rawToken) {
            return next(new Error('SOCKET_AUTHENTICATION_REQUIRED'));
        }
        let claims;
        try {
            claims = jwt_service_1.jwtService.verifyAccessToken(rawToken);
        }
        catch {
            return next(new Error('SOCKET_AUTHENTICATION_FAILED'));
        }
        const user = await users_repository_1.usersRepository.findById(claims.sub);
        if (!user || user.status === 'suspended') {
            return next(new Error('SOCKET_AUTHENTICATION_FAILED'));
        }
        if (user.refreshTokenVersion !== claims.tokenVersion) {
            return next(new Error('SESSION_REVOKED'));
        }
        socket.data.user = {
            userId: claims.sub,
            role: claims.role,
            sessionId: claims.sessionId,
            tokenVersion: claims.tokenVersion,
        };
        next();
    }
    catch (err) {
        logger_1.logger.error({ err }, 'Unexpected error in socket authentication');
        next(new Error('SOCKET_AUTHENTICATION_FAILED'));
    }
}
//# sourceMappingURL=socket.auth.js.map