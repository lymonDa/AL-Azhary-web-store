"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtService = exports.JwtService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../../config/env");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
class JwtService {
    /**
     * Issues a short-lived access JWT containing only minimal architectural claims.
     */
    issueAccessToken(claims) {
        const payload = {
            sub: claims.sub,
            role: claims.role,
            sessionId: claims.sessionId,
            tokenVersion: claims.tokenVersion,
        };
        return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_ACCESS_SECRET, {
            algorithm: 'HS256',
            expiresIn: env_1.env.JWT_ACCESS_TTL,
            issuer: env_1.env.JWT_ISSUER,
            audience: env_1.env.JWT_AUDIENCE,
        });
    }
    /**
     * Verifies access token signature, algorithm, issuer, audience, and expiration.
     */
    verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET, {
                algorithms: ['HS256'],
                issuer: env_1.env.JWT_ISSUER,
                audience: env_1.env.JWT_AUDIENCE,
            });
            if (!decoded.sub || !decoded.role || !decoded.sessionId || decoded.tokenVersion === undefined) {
                throw new errors_1.UnauthorizedError('Malformed access token claims', errorCodes_1.ErrorCodes.TOKEN_INVALID);
            }
            return {
                sub: String(decoded.sub),
                role: decoded.role,
                sessionId: String(decoded.sessionId),
                tokenVersion: Number(decoded.tokenVersion),
            };
        }
        catch (err) {
            if (err instanceof errors_1.UnauthorizedError) {
                throw err;
            }
            if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new errors_1.UnauthorizedError('Access token has expired', errorCodes_1.ErrorCodes.TOKEN_EXPIRED);
            }
            if (err instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new errors_1.UnauthorizedError('Invalid access token', errorCodes_1.ErrorCodes.TOKEN_INVALID);
            }
            throw new errors_1.UnauthorizedError('Authentication verification failed', errorCodes_1.ErrorCodes.AUTHENTICATION_FAILED);
        }
    }
}
exports.JwtService = JwtService;
exports.jwtService = new JwtService();
//# sourceMappingURL=jwt.service.js.map