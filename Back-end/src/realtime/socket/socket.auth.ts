import { Socket } from 'socket.io';
import { jwtService } from '../../modules/auth/services/jwt.service';
import { usersRepository } from '../../modules/users/repositories/users.repository';
import { AuthenticatedPrincipal } from '../../modules/auth/types/auth.types';
import { logger } from '../../config/logger';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: AuthenticatedPrincipal;
  };
}

/**
 * Socket.IO Handshake Authentication Middleware.
 * Validates JWT access token, checks user active status, and verifies session version.
 */
export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const authHeader = socket.handshake.headers.authorization;
    const tokenFromAuth = socket.handshake.auth?.token;

    let rawToken: string | null = null;
    if (typeof tokenFromAuth === 'string' && tokenFromAuth.trim()) {
      rawToken = tokenFromAuth.trim();
    } else if (typeof authHeader === 'string') {
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
      claims = jwtService.verifyAccessToken(rawToken);
    } catch {
      return next(new Error('SOCKET_AUTHENTICATION_FAILED'));
    }

    const user = await usersRepository.findById(claims.sub);
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
  } catch (err) {
    logger.error({ err }, 'Unexpected error in socket authentication');
    next(new Error('SOCKET_AUTHENTICATION_FAILED'));
  }
}
