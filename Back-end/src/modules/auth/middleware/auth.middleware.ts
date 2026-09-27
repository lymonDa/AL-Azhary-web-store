import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../services/jwt.service';
import { usersRepository } from '../../users/repositories/users.repository';
import { UnauthorizedError } from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';
import { AuthenticatedPrincipal } from '../types/auth.types';

/**
 * Middleware requiring a valid Bearer JWT access token.
 * Validates algorithm (HS256), issuer, audience, expiration, claims, user status, and tokenVersion.
 */
export function requireAuthentication() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedError('Authorization header is required', ErrorCodes.AUTH_REQUIRED);
      }

      const parts = authHeader.trim().split(' ');
      if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        throw new UnauthorizedError('Authorization header must use Bearer scheme', ErrorCodes.TOKEN_INVALID);
      }

      const rawToken = parts[1];
      const claims = jwtService.verifyAccessToken(rawToken);

      // Verify user existence, active status, and tokenVersion for global invalidation
      const user = await usersRepository.findById(claims.sub);
      if (!user) {
        throw new UnauthorizedError('User account not found', ErrorCodes.AUTHENTICATION_FAILED);
      }

      if (user.status === 'suspended') {
        throw new UnauthorizedError('Account is suspended', ErrorCodes.AUTHENTICATION_FAILED);
      }

      if (user.refreshTokenVersion !== claims.tokenVersion) {
        throw new UnauthorizedError('Session has been revoked', ErrorCodes.SESSION_REVOKED);
      }

      const principal: AuthenticatedPrincipal = {
        userId: claims.sub,
        role: claims.role,
        sessionId: claims.sessionId,
        tokenVersion: claims.tokenVersion,
      };

      req.user = principal;
      req.auth = principal;

      next();
    } catch (error) {
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
export function optionalAuthentication() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        // No credentials provided; proceed as guest
        return next();
      }

      const parts = authHeader.trim().split(' ');
      if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        throw new UnauthorizedError('Authorization header must use Bearer scheme', ErrorCodes.TOKEN_INVALID);
      }

      const rawToken = parts[1];
      const claims = jwtService.verifyAccessToken(rawToken);

      const user = await usersRepository.findById(claims.sub);
      if (!user || user.status === 'suspended' || user.refreshTokenVersion !== claims.tokenVersion) {
        throw new UnauthorizedError('Session has been revoked or account is inactive', ErrorCodes.SESSION_REVOKED);
      }

      const principal: AuthenticatedPrincipal = {
        userId: claims.sub,
        role: claims.role,
        sessionId: claims.sessionId,
        tokenVersion: claims.tokenVersion,
      };

      req.user = principal;
      req.auth = principal;

      next();
    } catch (error) {
      next(error);
    }
  };
}
