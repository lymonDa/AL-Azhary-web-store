"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerController = registerController;
exports.loginController = loginController;
exports.refreshController = refreshController;
exports.logoutController = logoutController;
exports.verifyEmailController = verifyEmailController;
exports.forgotPasswordController = forgotPasswordController;
exports.resetPasswordController = resetPasswordController;
exports.getMeController = getMeController;
const auth_service_1 = require("../services/auth.service");
const users_service_1 = require("../../users/services/users.service");
const token_service_1 = require("../services/token.service");
const env_1 = require("../../../config/env");
const response_util_1 = require("../../../common/utils/response.util");
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
/**
 * Sets the HttpOnly refresh token cookie with environment-configured security options.
 */
function setRefreshCookie(res, rawRefreshToken) {
    const maxAgeMs = token_service_1.tokenService.parseTtlToMs(env_1.env.JWT_REFRESH_TTL);
    res.cookie(env_1.env.REFRESH_COOKIE_NAME, rawRefreshToken, {
        httpOnly: true,
        secure: env_1.env.REFRESH_COOKIE_SECURE,
        sameSite: env_1.env.REFRESH_COOKIE_SAME_SITE,
        path: `${env_1.env.API_BASE_PATH}/auth`,
        maxAge: maxAgeMs,
    });
}
/**
 * Clears the refresh token cookie.
 */
function clearRefreshCookie(res) {
    res.clearCookie(env_1.env.REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: env_1.env.REFRESH_COOKIE_SECURE,
        sameSite: env_1.env.REFRESH_COOKIE_SAME_SITE,
        path: `${env_1.env.API_BASE_PATH}/auth`,
    });
}
async function registerController(req, res, next) {
    try {
        const { name, email, phone, password } = req.body;
        const { user } = await auth_service_1.authService.register({ name, email, phone, password });
        (0, response_util_1.sendCreated)(req, res, user);
    }
    catch (error) {
        next(error);
    }
}
async function loginController(req, res, next) {
    try {
        const result = await auth_service_1.authService.login(req.body, {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        setRefreshCookie(res, result.rawRefreshToken);
        (0, response_util_1.sendSuccess)(req, res, {
            accessToken: result.accessToken,
            user: result.user,
            session: result.session,
        });
    }
    catch (error) {
        next(error);
    }
}
async function refreshController(req, res, next) {
    try {
        const rawRefreshToken = req.cookies?.[env_1.env.REFRESH_COOKIE_NAME];
        if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
            throw new errors_1.UnauthorizedError('Refresh token cookie is required', errorCodes_1.ErrorCodes.AUTHENTICATION_FAILED);
        }
        const result = await auth_service_1.authService.refresh(rawRefreshToken, {
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });
        setRefreshCookie(res, result.rawRefreshToken);
        (0, response_util_1.sendSuccess)(req, res, {
            accessToken: result.accessToken,
        });
    }
    catch (error) {
        next(error);
    }
}
async function logoutController(req, res, next) {
    try {
        const principal = req.user;
        const all = Boolean(req.body?.all || req.query?.all === 'true');
        await auth_service_1.authService.logout(principal.userId, principal.sessionId, all);
        clearRefreshCookie(res);
        (0, response_util_1.sendNoContent)(res);
    }
    catch (error) {
        next(error);
    }
}
async function verifyEmailController(req, res, next) {
    try {
        const { token } = req.body;
        const user = await auth_service_1.authService.verifyEmail(token);
        (0, response_util_1.sendSuccess)(req, res, {
            user,
            verified: true,
        });
    }
    catch (error) {
        next(error);
    }
}
async function forgotPasswordController(req, res, next) {
    try {
        const { email } = req.body;
        await auth_service_1.authService.forgotPassword(email);
        // Neutral response to avoid email enumeration
        const requestId = String(req.id || 'req_unknown');
        res.status(202).json({
            success: true,
            data: {
                message: 'If an account exists with this email, a password reset link has been sent.',
            },
            requestId,
            meta: {
                requestId,
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        next(error);
    }
}
async function resetPasswordController(req, res, next) {
    try {
        const { token, newPassword } = req.body;
        await auth_service_1.authService.resetPassword(token, newPassword);
        clearRefreshCookie(res);
        (0, response_util_1.sendNoContent)(res);
    }
    catch (error) {
        next(error);
    }
}
async function getMeController(req, res, next) {
    try {
        const principal = req.user;
        const user = await users_service_1.usersService.getUserById(principal.userId);
        (0, response_util_1.sendSuccess)(req, res, user);
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=auth.controller.js.map