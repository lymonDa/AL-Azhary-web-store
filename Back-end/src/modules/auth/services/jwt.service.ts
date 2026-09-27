import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { AccessClaims } from '../types/auth.types';
import { UnauthorizedError } from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';

export class JwtService {
  /**
   * Issues a short-lived access JWT containing only minimal architectural claims.
   */
  issueAccessToken(claims: AccessClaims): string {
    const payload: AccessClaims = {
      sub: claims.sub,
      role: claims.role,
      sessionId: claims.sessionId,
      tokenVersion: claims.tokenVersion,
    };

    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
      expiresIn: env.JWT_ACCESS_TTL as unknown as number,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });
  }

  /**
   * Verifies access token signature, algorithm, issuer, audience, and expiration.
   */
  verifyAccessToken(token: string): AccessClaims {
    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        algorithms: ['HS256'],
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      }) as jwt.JwtPayload;

      if (!decoded.sub || !decoded.role || !decoded.sessionId || decoded.tokenVersion === undefined) {
        throw new UnauthorizedError('Malformed access token claims', ErrorCodes.TOKEN_INVALID);
      }

      return {
        sub: String(decoded.sub),
        role: decoded.role,
        sessionId: String(decoded.sessionId),
        tokenVersion: Number(decoded.tokenVersion),
      };
    } catch (err: unknown) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Access token has expired', ErrorCodes.TOKEN_EXPIRED);
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid access token', ErrorCodes.TOKEN_INVALID);
      }
      throw new UnauthorizedError('Authentication verification failed', ErrorCodes.AUTHENTICATION_FAILED);
    }
  }
}

export const jwtService = new JwtService();
