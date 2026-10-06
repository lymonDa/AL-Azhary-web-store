"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = exports.SessionService = void 0;
const sessions_repository_1 = require("../repositories/sessions.repository");
const token_service_1 = require("./token.service");
const env_1 = require("../../../config/env");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
const logger_1 = require("../../../config/logger");
class SessionService {
    repo;
    tokenSvc;
    constructor(repo = sessions_repository_1.sessionsRepository, tokenSvc = token_service_1.tokenService) {
        this.repo = repo;
        this.tokenSvc = tokenSvc;
    }
    /**
     * Creates a new session record with a hashed refresh token.
     */
    async createSession(userId, options = {}, session) {
        const rawRefreshToken = this.tokenSvc.generateOpaqueToken();
        const tokenHash = this.tokenSvc.hashToken(rawRefreshToken);
        const ipHash = this.tokenSvc.hashIp(options.ip);
        const expiresAt = this.tokenSvc.calculateExpiryDate(env_1.env.JWT_REFRESH_TTL);
        const safeUserAgent = (options.userAgent || '').slice(0, 500);
        const sessionDoc = await this.repo.create({
            userId,
            tokenHash,
            userAgent: safeUserAgent,
            ipHash,
            expiresAt,
            sessionVersion: options.sessionVersion ?? 1,
        }, { session });
        return { session: sessionDoc, rawRefreshToken };
    }
    /**
     * Rotates a session's refresh token atomically.
     */
    async rotateSession(rawRefreshToken, options = {}, session) {
        const oldTokenHash = this.tokenSvc.hashToken(rawRefreshToken);
        const existingSession = await this.repo.findByTokenHash(oldTokenHash, { session });
        if (!existingSession) {
            // Security event: attempt to refresh with an invalid or already-rotated token
            logger_1.logger.warn({ ipHash: this.tokenSvc.hashIp(options.ip) }, 'Refresh attempt with unknown or already-rotated token');
            throw new errors_1.UnauthorizedError('Invalid or expired refresh token', errorCodes_1.ErrorCodes.AUTHENTICATION_FAILED);
        }
        if (existingSession.revokedAt) {
            logger_1.logger.warn({ sessionId: existingSession._id.toString(), userId: existingSession.userId.toString() }, 'Refresh attempt on revoked session');
            throw new errors_1.UnauthorizedError('Session has been revoked', errorCodes_1.ErrorCodes.SESSION_REVOKED);
        }
        if (existingSession.expiresAt.getTime() <= Date.now()) {
            throw new errors_1.UnauthorizedError('Session has expired', errorCodes_1.ErrorCodes.TOKEN_EXPIRED);
        }
        const newRawRefreshToken = this.tokenSvc.generateOpaqueToken();
        const newTokenHash = this.tokenSvc.hashToken(newRawRefreshToken);
        const newExpiresAt = this.tokenSvc.calculateExpiryDate(env_1.env.JWT_REFRESH_TTL);
        const updatedSession = await this.repo.updateTokenHash(existingSession._id.toString(), newTokenHash, newExpiresAt, { session });
        if (!updatedSession) {
            throw new errors_1.UnauthorizedError('Failed to rotate session', errorCodes_1.ErrorCodes.AUTHENTICATION_FAILED);
        }
        return {
            session: updatedSession,
            newRawRefreshToken,
            userId: updatedSession.userId.toString(),
            sessionVersion: updatedSession.sessionVersion,
        };
    }
    async revokeSession(sessionId, reason = 'logout', session) {
        await this.repo.revokeById(sessionId, reason, { session });
    }
    async revokeAllUserSessions(userId, reason = 'global_logout', session) {
        await this.repo.revokeAllByUserId(userId, reason, { session });
    }
    async getSessionById(sessionId) {
        return this.repo.findById(sessionId);
    }
}
exports.SessionService = SessionService;
exports.sessionService = new SessionService();
//# sourceMappingURL=session.service.js.map