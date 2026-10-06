"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const users_repository_1 = require("../../users/repositories/users.repository");
const auth_tokens_repository_1 = require("../repositories/auth-tokens.repository");
const session_service_1 = require("./session.service");
const password_service_1 = require("./password.service");
const jwt_service_1 = require("./jwt.service");
const token_service_1 = require("./token.service");
const email_util_1 = require("../../users/utils/email.util");
const phone_util_1 = require("../../users/utils/phone.util");
const user_projection_1 = require("../../users/utils/user.projection");
const transaction_1 = require("../../../database/transaction");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
const roles_1 = require("../../../common/constants/roles");
const logger_1 = require("../../../config/logger");
class AuthService {
    usersRepo;
    authTokensRepo;
    sessionSvc;
    passwordSvc;
    jwtSvc;
    tokenSvc;
    constructor(usersRepo = users_repository_1.usersRepository, authTokensRepo = auth_tokens_repository_1.authTokensRepository, sessionSvc = session_service_1.sessionService, passwordSvc = password_service_1.passwordService, jwtSvc = jwt_service_1.jwtService, tokenSvc = token_service_1.tokenService) {
        this.usersRepo = usersRepo;
        this.authTokensRepo = authTokensRepo;
        this.sessionSvc = sessionSvc;
        this.passwordSvc = passwordSvc;
        this.jwtSvc = jwtSvc;
        this.tokenSvc = tokenSvc;
    }
    /**
     * Registers a new customer identity atomically with an email verification token.
     */
    async register(input) {
        const normalizedEmail = (0, email_util_1.normalizeEmail)(input.email);
        const canonicalPhone = (0, phone_util_1.canonicalizePhone)(input.phone);
        // Pre-flight uniqueness checks
        const [existingEmail, existingPhone] = await Promise.all([
            this.usersRepo.findByEmail(normalizedEmail),
            this.usersRepo.findByPhone(canonicalPhone),
        ]);
        if (existingEmail || existingPhone) {
            throw new errors_1.ConflictError(errorCodes_1.ErrorCodes.RESOURCE_CONFLICT, 'An account with this email or phone number already exists');
        }
        const passwordHash = await this.passwordSvc.hashPassword(input.password);
        const rawVerificationToken = this.tokenSvc.generateOpaqueToken();
        const tokenHash = this.tokenSvc.hashToken(rawVerificationToken);
        const tokenExpiresAt = this.tokenSvc.calculateExpiryDate('24h');
        // Atomic transaction: create user document + email verification token
        const userDoc = await (0, transaction_1.withTransaction)(async (session) => {
            const newUser = await this.usersRepo.create({
                name: input.name.trim(),
                email: normalizedEmail,
                phone: canonicalPhone,
                passwordHash,
                role: roles_1.UserRoles.CUSTOMER, // Always forced server-side
                status: 'active',
                emailVerifiedAt: null,
            }, { session });
            await this.authTokensRepo.create({
                userId: newUser._id,
                type: 'email_verification',
                tokenHash,
                expiresAt: tokenExpiresAt,
            }, { session });
            return newUser;
        });
        logger_1.logger.info({ userId: userDoc._id.toString() }, 'User registered successfully');
        return {
            user: (0, user_projection_1.toSafeUser)(userDoc),
            verificationToken: rawVerificationToken,
        };
    }
    /**
     * Authenticates user via email or phone and issues JWT + refresh token session.
     */
    async login(input, metadata = {}) {
        const identifier = (input.identifier || input.email || input.phone || '').trim();
        if (!identifier) {
            throw new errors_1.UnauthorizedError('Invalid email/phone or password', errorCodes_1.ErrorCodes.AUTHENTICATION_FAILED);
        }
        // Try finding by normalized email or canonicalized phone
        const normalizedEmail = (0, email_util_1.normalizeEmail)(identifier);
        const canonicalPhone = (0, phone_util_1.canonicalizePhone)(identifier);
        const user = await this.usersRepo.findByIdentifier(identifier.includes('@') ? normalizedEmail : canonicalPhone, { selectPassword: true });
        if (!user) {
            throw new errors_1.UnauthorizedError('Invalid email/phone or password', errorCodes_1.ErrorCodes.AUTHENTICATION_FAILED);
        }
        if (user.status === 'suspended') {
            logger_1.logger.warn({ userId: user._id.toString() }, 'Login attempt on suspended account');
            throw new errors_1.UnauthorizedError('Account is suspended. Please contact support.', errorCodes_1.ErrorCodes.AUTHENTICATION_FAILED);
        }
        const isPasswordValid = await this.passwordSvc.verifyPassword(user.passwordHash, input.password);
        if (!isPasswordValid) {
            throw new errors_1.UnauthorizedError('Invalid email/phone or password', errorCodes_1.ErrorCodes.AUTHENTICATION_FAILED);
        }
        // Create session record
        const { session: newSession, rawRefreshToken } = await this.sessionSvc.createSession(user._id.toString(), {
            userAgent: metadata.userAgent,
            ip: metadata.ip,
            sessionVersion: user.refreshTokenVersion,
        });
        // Issue JWT access token
        const accessToken = this.jwtSvc.issueAccessToken({
            sub: user._id.toString(),
            role: user.role,
            sessionId: newSession._id.toString(),
            tokenVersion: user.refreshTokenVersion,
        });
        // Update lastLoginAt without failing the login if metadata update fails
        this.usersRepo.updateLastLogin(user._id.toString()).catch((err) => {
            logger_1.logger.error({ err, userId: user._id.toString() }, 'Failed to update lastLoginAt');
        });
        logger_1.logger.info({ userId: user._id.toString(), sessionId: newSession._id.toString() }, 'User logged in successfully');
        return {
            accessToken,
            rawRefreshToken,
            user: (0, user_projection_1.toSafeUser)(user),
            session: {
                id: newSession._id.toString(),
                expiresAt: newSession.expiresAt,
            },
        };
    }
    /**
     * Refreshes access token and rotates refresh token inside a transaction.
     */
    async refresh(rawRefreshToken, metadata = {}) {
        try {
            return await (0, transaction_1.withTransaction)(async (session) => {
                const rotationResult = await this.sessionSvc.rotateSession(rawRefreshToken, { userAgent: metadata.userAgent, ip: metadata.ip }, session);
                const user = await this.usersRepo.findById(rotationResult.userId, { session });
                if (!user || user.status === 'suspended') {
                    throw new errors_1.UnauthorizedError('Account is not active', errorCodes_1.ErrorCodes.AUTHENTICATION_FAILED);
                }
                // Check if global session invalidation was performed
                if (user.refreshTokenVersion !== rotationResult.sessionVersion) {
                    throw new errors_1.UnauthorizedError('Session has been revoked', errorCodes_1.ErrorCodes.SESSION_REVOKED);
                }
                const accessToken = this.jwtSvc.issueAccessToken({
                    sub: user._id.toString(),
                    role: user.role,
                    sessionId: rotationResult.session._id.toString(),
                    tokenVersion: user.refreshTokenVersion,
                });
                return {
                    accessToken,
                    rawRefreshToken: rotationResult.newRawRefreshToken,
                };
            });
        }
        catch (err) {
            if (err instanceof errors_1.ConflictError ||
                err?.code === 112 ||
                err?.codeName === 'WriteConflict') {
                throw new errors_1.UnauthorizedError('Invalid or expired refresh token', errorCodes_1.ErrorCodes.AUTHENTICATION_FAILED);
            }
            throw err;
        }
    }
    /**
     * Logs out current session or all active sessions globally.
     */
    async logout(userId, sessionId, all = false) {
        if (all) {
            await (0, transaction_1.withTransaction)(async (session) => {
                await this.usersRepo.incrementRefreshTokenVersion(userId, { session });
                await this.sessionSvc.revokeAllUserSessions(userId, 'global_logout', session);
            });
            logger_1.logger.info({ userId }, 'Global logout completed: all sessions revoked');
        }
        else {
            await this.sessionSvc.revokeSession(sessionId, 'logout');
            logger_1.logger.info({ userId, sessionId }, 'Current session logout completed');
        }
    }
    /**
     * Verifies email using an opaque one-time token.
     */
    async verifyEmail(token) {
        const tokenHash = this.tokenSvc.hashToken(token);
        const authToken = await this.authTokensRepo.findByTokenHash(tokenHash, 'email_verification');
        if (!authToken) {
            throw new errors_1.AppError(errorCodes_1.ErrorCodes.AUTH_TOKEN_INVALID, 'Invalid verification token', 400);
        }
        if (authToken.consumedAt) {
            throw new errors_1.AppError(errorCodes_1.ErrorCodes.AUTH_TOKEN_CONSUMED, 'Verification token has already been consumed', 400);
        }
        if (authToken.expiresAt.getTime() <= Date.now()) {
            throw new errors_1.AppError(errorCodes_1.ErrorCodes.AUTH_TOKEN_EXPIRED, 'Verification token has expired', 400);
        }
        const updatedUser = await (0, transaction_1.withTransaction)(async (session) => {
            await this.authTokensRepo.consumeToken(authToken._id.toString(), { session });
            return this.usersRepo.updateEmailVerified(authToken.userId.toString(), new Date(), { session });
        });
        if (!updatedUser) {
            throw new errors_1.NotFoundError('User associated with verification token not found');
        }
        logger_1.logger.info({ userId: updatedUser._id.toString() }, 'Email verified successfully');
        return (0, user_projection_1.toSafeUser)(updatedUser);
    }
    /**
     * Initiates password reset. Emits neutral response regardless of account existence.
     */
    async forgotPassword(email) {
        const normalized = (0, email_util_1.normalizeEmail)(email);
        const user = await this.usersRepo.findByEmail(normalized);
        if (!user) {
            // Return neutrally to avoid enumeration attacks
            return {};
        }
        const rawResetToken = this.tokenSvc.generateOpaqueToken();
        const tokenHash = this.tokenSvc.hashToken(rawResetToken);
        const expiresAt = this.tokenSvc.calculateExpiryDate('1h');
        await this.authTokensRepo.create({
            userId: user._id,
            type: 'password_reset',
            tokenHash,
            expiresAt,
        });
        logger_1.logger.info({ userId: user._id.toString() }, 'Password reset token generated');
        return { resetToken: rawResetToken };
    }
    /**
     * Completes password reset, consumes token, updates password, and revokes all active sessions.
     */
    async resetPassword(token, newPassword) {
        const tokenHash = this.tokenSvc.hashToken(token);
        const authToken = await this.authTokensRepo.findByTokenHash(tokenHash, 'password_reset');
        if (!authToken) {
            throw new errors_1.AppError(errorCodes_1.ErrorCodes.AUTH_TOKEN_INVALID, 'Invalid reset token', 400);
        }
        if (authToken.consumedAt) {
            throw new errors_1.AppError(errorCodes_1.ErrorCodes.AUTH_TOKEN_CONSUMED, 'Reset token has already been consumed', 400);
        }
        if (authToken.expiresAt.getTime() <= Date.now()) {
            throw new errors_1.AppError(errorCodes_1.ErrorCodes.AUTH_TOKEN_EXPIRED, 'Reset token has expired', 400);
        }
        const newPasswordHash = await this.passwordSvc.hashPassword(newPassword);
        await (0, transaction_1.withTransaction)(async (session) => {
            // 1. Consume reset token
            await this.authTokensRepo.consumeToken(authToken._id.toString(), { session });
            // 2. Update user's passwordHash
            await this.usersRepo.updatePassword(authToken.userId.toString(), newPasswordHash, { session });
            // 3. Increment refreshTokenVersion for instant global invalidation
            await this.usersRepo.incrementRefreshTokenVersion(authToken.userId.toString(), { session });
            // 4. Revoke all active sessions
            await this.sessionSvc.revokeAllUserSessions(authToken.userId.toString(), 'password_reset', session);
        });
        logger_1.logger.info({ userId: authToken.userId.toString() }, 'Password successfully reset and sessions revoked');
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map