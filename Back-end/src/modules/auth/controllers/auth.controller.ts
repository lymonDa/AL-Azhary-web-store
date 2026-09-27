import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { usersService } from '../../users/services/users.service';
import { tokenService } from '../services/token.service';
import { env } from '../../../config/env';
import { sendCreated, sendNoContent, sendSuccess } from '../../../common/utils/response.util';
import { UnauthorizedError } from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';

/**
 * Sets the HttpOnly refresh token cookie with environment-configured security options.
 */
function setRefreshCookie(res: Response, rawRefreshToken: string): void {
  const maxAgeMs = tokenService.parseTtlToMs(env.JWT_REFRESH_TTL);

  res.cookie(env.REFRESH_COOKIE_NAME, rawRefreshToken, {
    httpOnly: true,
    secure: env.REFRESH_COOKIE_SECURE,
    sameSite: env.REFRESH_COOKIE_SAME_SITE,
    path: `${env.API_BASE_PATH}/auth`,
    maxAge: maxAgeMs,
  });
}

/**
 * Clears the refresh token cookie.
 */
function clearRefreshCookie(res: Response): void {
  res.clearCookie(env.REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.REFRESH_COOKIE_SECURE,
    sameSite: env.REFRESH_COOKIE_SAME_SITE,
    path: `${env.API_BASE_PATH}/auth`,
  });
}

export async function registerController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, phone, password } = req.body;
    const { user } = await authService.register({ name, email, phone, password });
    sendCreated(req, res, user);
  } catch (error) {
    next(error);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.login(req.body, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    setRefreshCookie(res, result.rawRefreshToken);

    sendSuccess(req, res, {
      accessToken: result.accessToken,
      user: result.user,
      session: result.session,
    });
  } catch (error) {
    next(error);
  }
}

export async function refreshController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawRefreshToken = req.cookies?.[env.REFRESH_COOKIE_NAME];
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      throw new UnauthorizedError('Refresh token cookie is required', ErrorCodes.AUTHENTICATION_FAILED);
    }

    const result = await authService.refresh(rawRefreshToken, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    setRefreshCookie(res, result.rawRefreshToken);

    sendSuccess(req, res, {
      accessToken: result.accessToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const principal = req.user!;
    const all = Boolean(req.body?.all || req.query?.all === 'true');

    await authService.logout(principal.userId, principal.sessionId, all);
    clearRefreshCookie(res);

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function verifyEmailController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body;
    const user = await authService.verifyEmail(token);
    sendSuccess(req, res, {
      user,
      verified: true,
    });
  } catch (error) {
    next(error);
  }
}

export async function forgotPasswordController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);

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
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    clearRefreshCookie(res);
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function getMeController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const principal = req.user!;
    const user = await usersService.getUserById(principal.userId);
    sendSuccess(req, res, user);
  } catch (error) {
    next(error);
  }
}
