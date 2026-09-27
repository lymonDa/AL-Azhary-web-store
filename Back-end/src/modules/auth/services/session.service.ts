import { ClientSession } from 'mongoose';
import { sessionsRepository, SessionsRepository } from '../repositories/sessions.repository';
import { tokenService, TokenService } from './token.service';
import { env } from '../../../config/env';
import { ISessionDocument } from '../types/auth.types';
import { UnauthorizedError } from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';
import { logger } from '../../../config/logger';

export interface CreateSessionOptions {
  userAgent?: string;
  ip?: string;
  sessionVersion?: number;
}

export class SessionService {
  constructor(
    private readonly repo: SessionsRepository = sessionsRepository,
    private readonly tokenSvc: TokenService = tokenService,
  ) {}

  /**
   * Creates a new session record with a hashed refresh token.
   */
  async createSession(
    userId: string,
    options: CreateSessionOptions = {},
    session?: ClientSession,
  ): Promise<{ session: ISessionDocument; rawRefreshToken: string }> {
    const rawRefreshToken = this.tokenSvc.generateOpaqueToken();
    const tokenHash = this.tokenSvc.hashToken(rawRefreshToken);
    const ipHash = this.tokenSvc.hashIp(options.ip);
    const expiresAt = this.tokenSvc.calculateExpiryDate(env.JWT_REFRESH_TTL);

    const safeUserAgent = (options.userAgent || '').slice(0, 500);

    const sessionDoc = await this.repo.create(
      {
        userId,
        tokenHash,
        userAgent: safeUserAgent,
        ipHash,
        expiresAt,
        sessionVersion: options.sessionVersion ?? 1,
      },
      { session },
    );

    return { session: sessionDoc, rawRefreshToken };
  }

  /**
   * Rotates a session's refresh token atomically.
   */
  async rotateSession(
    rawRefreshToken: string,
    options: { userAgent?: string; ip?: string } = {},
    session?: ClientSession,
  ): Promise<{
    session: ISessionDocument;
    newRawRefreshToken: string;
    userId: string;
    sessionVersion: number;
  }> {
    const oldTokenHash = this.tokenSvc.hashToken(rawRefreshToken);
    const existingSession = await this.repo.findByTokenHash(oldTokenHash, { session });

    if (!existingSession) {
      // Security event: attempt to refresh with an invalid or already-rotated token
      logger.warn({ ipHash: this.tokenSvc.hashIp(options.ip) }, 'Refresh attempt with unknown or already-rotated token');
      throw new UnauthorizedError('Invalid or expired refresh token', ErrorCodes.AUTHENTICATION_FAILED);
    }

    if (existingSession.revokedAt) {
      logger.warn(
        { sessionId: existingSession._id.toString(), userId: existingSession.userId.toString() },
        'Refresh attempt on revoked session',
      );
      throw new UnauthorizedError('Session has been revoked', ErrorCodes.SESSION_REVOKED);
    }

    if (existingSession.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError('Session has expired', ErrorCodes.TOKEN_EXPIRED);
    }

    const newRawRefreshToken = this.tokenSvc.generateOpaqueToken();
    const newTokenHash = this.tokenSvc.hashToken(newRawRefreshToken);
    const newExpiresAt = this.tokenSvc.calculateExpiryDate(env.JWT_REFRESH_TTL);

    const updatedSession = await this.repo.updateTokenHash(
      existingSession._id.toString(),
      newTokenHash,
      newExpiresAt,
      { session },
    );

    if (!updatedSession) {
      throw new UnauthorizedError('Failed to rotate session', ErrorCodes.AUTHENTICATION_FAILED);
    }

    return {
      session: updatedSession,
      newRawRefreshToken,
      userId: updatedSession.userId.toString(),
      sessionVersion: updatedSession.sessionVersion,
    };
  }

  async revokeSession(
    sessionId: string,
    reason: string = 'logout',
    session?: ClientSession,
  ): Promise<void> {
    await this.repo.revokeById(sessionId, reason, { session });
  }

  async revokeAllUserSessions(
    userId: string,
    reason: string = 'global_logout',
    session?: ClientSession,
  ): Promise<void> {
    await this.repo.revokeAllByUserId(userId, reason, { session });
  }

  async getSessionById(sessionId: string): Promise<ISessionDocument | null> {
    return this.repo.findById(sessionId);
  }
}

export const sessionService = new SessionService();
