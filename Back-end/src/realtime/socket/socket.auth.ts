import { Socket } from 'socket.io';
import { jwtService } from '../../modules/auth/services/jwt.service';
import { usersRepository } from '../../modules/users/repositories/users.repository';
import { AuthenticatedPrincipal } from '../../modules/auth/types/auth.types';
import { logger } from '../../config/logger';

import { env } from '../../config/env';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: AuthenticatedPrincipal;
  };
}

// In-memory sliding window rate limiter for socket connection attempts by IP
const socketHandshakeTracker = new Map<string, { count: number; resetAt: number }>();

export function resetSocketHandshakeRateLimits(): void {
  socketHandshakeTracker.clear();
}

/**
 * Socket.IO Handshake Authentication Middleware.
 * Validates JWT access token, checks user active status, verifies session version, and enforces handshake rate limits.
 */
export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> {
  try {
    const clientIp = socket.handshake.address || 'ip_unknown';
    const now = Date.now();
    const windowMs = env.RATE_LIMIT_WINDOW_MS;
    const maxAttempts = env.RATE_LIMIT_SOCKET_PER_MINUTE;

    let record = socketHandshakeTracker.get(clientIp);
    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs };
      socketHandshakeTracker.set(clientIp, record);
    } else {
      record.count += 1;
    }

    if (record.count > maxAttempts) {
      return next(new Error('RATE_LIMITED'));
    }

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
