"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuthentication = requireAuthentication;
exports.optionalAuthentication = optionalAuthentication;
const jwt_service_1 = require("../services/jwt.service");
const users_repository_1 = require("../../users/repositories/users.repository");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
/**
 * Middleware requiring a valid Bearer JWT access token.
 * Validates algorithm (HS256), issuer, audience, expiration, claims, user status, and tokenVersion.
 */
function requireAuthentication() {
    return async (req, _res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                throw new errors_1.UnauthorizedError('Authorization header is required', errorCodes_1.ErrorCodes.AUTH_REQUIRED);
            }
            const parts = authHeader.trim().split(' ');
            if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
                throw new errors_1.UnauthorizedError('Authorization header must use Bearer scheme', errorCodes_1.ErrorCodes.TOKEN_INVALID);
            }
            const rawToken = parts[1];
            const claims = jwt_service_1.jwtService.verifyAccessToken(rawToken);
            // Verify user existence, active status, and tokenVersion for global invalidation
            const user = await users_repository_1.usersRepository.findById(claims.sub);
            if (!user) {
                throw new errors_1.UnauthorizedError('User account not found', errorCodes_1.ErrorCodes.AUTHENTICATION_FAILED);
            }
            if (user.status === 'suspended') {
                throw new errors_1.UnauthorizedError('Account is suspended', errorCodes_1.ErrorCodes.AUTHENTICATION_FAILED);
            }
            if (user.refreshTokenVersion !== claims.tokenVersion) {
                throw new errors_1.UnauthorizedError('Session has been revoked', errorCodes_1.ErrorCodes.SESSION_REVOKED);
            }
            const principal = {
                userId: claims.sub,
                role: claims.role,
                sessionId: claims.sessionId,
                tokenVersion: claims.tokenVersion,
            };
            req.user = principal;
            req.auth = principal;
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
/**
 * Optional authentication middleware:
 * - If no Authorization header: proceeds as guest.
 * - If valid token: attaches principal and proceeds.
 * - If invalid/malformed token: rejects with 401 rather than silently degrading to guest.
 */
function optionalAuthentication() {
    return async (req, _res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                // No credentials provided; proceed as guest
                return next();
            }
            const parts = authHeader.trim().split(' ');
            if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
                throw new errors_1.UnauthorizedError('Authorization header must use Bearer scheme', errorCodes_1.ErrorCodes.TOKEN_INVALID);
            }
            const rawToken = parts[1];
            const claims = jwt_service_1.jwtService.verifyAccessToken(rawToken);
            const user = await users_repository_1.usersRepository.findById(claims.sub);
            if (!user || user.status === 'suspended' || user.refreshTokenVersion !== claims.tokenVersion) {
                throw new errors_1.UnauthorizedError('Session has been revoked or account is inactive', errorCodes_1.ErrorCodes.SESSION_REVOKED);
            }
            const principal = {
                userId: claims.sub,
                role: claims.role,
                sessionId: claims.sessionId,
                tokenVersion: claims.tokenVersion,
            };
            req.user = principal;
            req.auth = principal;
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
//# sourceMappingURL=auth.middleware.js.map