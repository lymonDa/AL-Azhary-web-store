import { usersRepository, UsersRepository } from '../../users/repositories/users.repository';
import { authTokensRepository, AuthTokensRepository } from '../repositories/auth-tokens.repository';
import { sessionService, SessionService } from './session.service';
import { passwordService, PasswordService } from './password.service';
import { jwtService, JwtService } from './jwt.service';
import { tokenService, TokenService } from './token.service';
import { normalizeEmail } from '../../users/utils/email.util';
import { canonicalizePhone } from '../../users/utils/phone.util';
import { toSafeUser } from '../../users/utils/user.projection';
import { SafeUser } from '../../users/types/user.types';
import { withTransaction } from '../../../database/transaction';
import {
  AppError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';
import { UserRoles } from '../../../common/constants/roles';
import { logger } from '../../../config/logger';

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginInput {
  email?: string;
  phone?: string;
  identifier?: string;
  password: string;
}

export interface RequestClientMetadata {
  ip?: string;
  userAgent?: string;
}

export class AuthService {
  constructor(
    private readonly usersRepo: UsersRepository = usersRepository,
    private readonly authTokensRepo: AuthTokensRepository = authTokensRepository,
    private readonly sessionSvc: SessionService = sessionService,
    private readonly passwordSvc: PasswordService = passwordService,
    private readonly jwtSvc: JwtService = jwtService,
    private readonly tokenSvc: TokenService = tokenService,
  ) {}

  /**
   * Registers a new customer identity atomically with an email verification token.
   */
  async register(
    input: RegisterInput,
  ): Promise<{ user: SafeUser; verificationToken: string }> {
    const normalizedEmail = normalizeEmail(input.email);
    const canonicalPhone = canonicalizePhone(input.phone);

    // Pre-flight uniqueness checks
    const [existingEmail, existingPhone] = await Promise.all([
      this.usersRepo.findByEmail(normalizedEmail),
      this.usersRepo.findByPhone(canonicalPhone),
    ]);

    if (existingEmail || existingPhone) {
      throw new ConflictError(
        ErrorCodes.RESOURCE_CONFLICT,
        'An account with this email or phone number already exists',
      );
    }

    const passwordHash = await this.passwordSvc.hashPassword(input.password);
    const rawVerificationToken = this.tokenSvc.generateOpaqueToken();
    const tokenHash = this.tokenSvc.hashToken(rawVerificationToken);
    const tokenExpiresAt = this.tokenSvc.calculateExpiryDate('24h');

    // Atomic transaction: create user document + email verification token
    const userDoc = await withTransaction(async (session) => {
      const newUser = await this.usersRepo.create(
        {
          name: input.name.trim(),
          email: normalizedEmail,
          phone: canonicalPhone,
          passwordHash,
          role: UserRoles.CUSTOMER, // Always forced server-side
          status: 'active',
          emailVerifiedAt: null,
        },
        { session },
      );

      await this.authTokensRepo.create(
        {
          userId: newUser._id,
          type: 'email_verification',
          tokenHash,
          expiresAt: tokenExpiresAt,
        },
        { session },
      );

      return newUser;
    });

    logger.info({ userId: userDoc._id.toString() }, 'User registered successfully');

    return {
      user: toSafeUser(userDoc),
      verificationToken: rawVerificationToken,
    };
  }

  /**
   * Authenticates user via email or phone and issues JWT + refresh token session.
   */
  async login(
    input: LoginInput,
    metadata: RequestClientMetadata = {},
  ): Promise<{
    accessToken: string;
    rawRefreshToken: string;
    user: SafeUser;
    session: { id: string; expiresAt: Date };
  }> {
    const identifier = (input.identifier || input.email || input.phone || '').trim();
    if (!identifier) {
      throw new UnauthorizedError('Invalid email/phone or password', ErrorCodes.AUTHENTICATION_FAILED);
    }

    // Try finding by normalized email or canonicalized phone
    const normalizedEmail = normalizeEmail(identifier);
    const canonicalPhone = canonicalizePhone(identifier);

    const user = await this.usersRepo.findByIdentifier(
      identifier.includes('@') ? normalizedEmail : canonicalPhone,
      { selectPassword: true },
    );

    if (!user) {
      throw new UnauthorizedError('Invalid email/phone or password', ErrorCodes.AUTHENTICATION_FAILED);
    }

    if (user.status === 'suspended') {
      logger.warn({ userId: user._id.toString() }, 'Login attempt on suspended account');
      throw new UnauthorizedError('Account is suspended. Please contact support.', ErrorCodes.AUTHENTICATION_FAILED);
    }

    const isPasswordValid = await this.passwordSvc.verifyPassword(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email/phone or password', ErrorCodes.AUTHENTICATION_FAILED);
    }

    // Create session record
    const { session: newSession, rawRefreshToken } = await this.sessionSvc.createSession(
      user._id.toString(),
      {
        userAgent: metadata.userAgent,
        ip: metadata.ip,
        sessionVersion: user.refreshTokenVersion,
      },
    );

    // Issue JWT access token
    const accessToken = this.jwtSvc.issueAccessToken({
      sub: user._id.toString(),
      role: user.role,
      sessionId: newSession._id.toString(),
      tokenVersion: user.refreshTokenVersion,
    });

    // Update lastLoginAt without failing the login if metadata update fails
    this.usersRepo.updateLastLogin(user._id.toString()).catch((err) => {
      logger.error({ err, userId: user._id.toString() }, 'Failed to update lastLoginAt');
    });

    logger.info({ userId: user._id.toString(), sessionId: newSession._id.toString() }, 'User logged in successfully');

    return {
      accessToken,
      rawRefreshToken,
      user: toSafeUser(user),
      session: {
        id: newSession._id.toString(),
        expiresAt: newSession.expiresAt,
      },
    };
  }

  /**
   * Refreshes access token and rotates refresh token inside a transaction.
   */
  async refresh(
    rawRefreshToken: string,
    metadata: RequestClientMetadata = {},
  ): Promise<{ accessToken: string; rawRefreshToken: string }> {
    try {
      return await withTransaction(async (session) => {
        const rotationResult = await this.sessionSvc.rotateSession(
          rawRefreshToken,
          { userAgent: metadata.userAgent, ip: metadata.ip },
          session,
        );

        const user = await this.usersRepo.findById(rotationResult.userId, { session });
        if (!user || user.status === 'suspended') {
          throw new UnauthorizedError('Account is not active', ErrorCodes.AUTHENTICATION_FAILED);
        }

        // Check if global session invalidation was performed
        if (user.refreshTokenVersion !== rotationResult.sessionVersion) {
          throw new UnauthorizedError('Session has been revoked', ErrorCodes.SESSION_REVOKED);
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
    } catch (err: unknown) {
      if (
        err instanceof ConflictError ||
        (err as { code?: number })?.code === 112 ||
        (err as { codeName?: string })?.codeName === 'WriteConflict'
      ) {
        throw new UnauthorizedError('Invalid or expired refresh token', ErrorCodes.AUTHENTICATION_FAILED);
      }
      throw err;
    }
  }

  /**
   * Logs out current session or all active sessions globally.
   */
  async logout(
    userId: string,
    sessionId: string,
    all: boolean = false,
  ): Promise<void> {
    if (all) {
      await withTransaction(async (session) => {
        await this.usersRepo.incrementRefreshTokenVersion(userId, { session });
        await this.sessionSvc.revokeAllUserSessions(userId, 'global_logout', session);
      });
      logger.info({ userId }, 'Global logout completed: all sessions revoked');
    } else {
      await this.sessionSvc.revokeSession(sessionId, 'logout');
      logger.info({ userId, sessionId }, 'Current session logout completed');
    }
  }

  /**
   * Verifies email using an opaque one-time token.
   */
  async verifyEmail(token: string): Promise<SafeUser> {
    const tokenHash = this.tokenSvc.hashToken(token);
    const authToken = await this.authTokensRepo.findByTokenHash(tokenHash, 'email_verification');

    if (!authToken) {
      throw new AppError(ErrorCodes.AUTH_TOKEN_INVALID, 'Invalid verification token', 400);
    }

    if (authToken.consumedAt) {
      throw new AppError(ErrorCodes.AUTH_TOKEN_CONSUMED, 'Verification token has already been consumed', 400);
    }

    if (authToken.expiresAt.getTime() <= Date.now()) {
      throw new AppError(ErrorCodes.AUTH_TOKEN_EXPIRED, 'Verification token has expired', 400);
    }

    const updatedUser = await withTransaction(async (session) => {
      await this.authTokensRepo.consumeToken(authToken._id.toString(), { session });
      return this.usersRepo.updateEmailVerified(authToken.userId.toString(), new Date(), { session });
    });

    if (!updatedUser) {
      throw new NotFoundError('User associated with verification token not found');
    }

    logger.info({ userId: updatedUser._id.toString() }, 'Email verified successfully');
    return toSafeUser(updatedUser);
  }

  /**
   * Initiates password reset. Emits neutral response regardless of account existence.
   */
  async forgotPassword(email: string): Promise<{ resetToken?: string }> {
    const normalized = normalizeEmail(email);
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

    logger.info({ userId: user._id.toString() }, 'Password reset token generated');

    return { resetToken: rawResetToken };
  }

  /**
   * Completes password reset, consumes token, updates password, and revokes all active sessions.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.tokenSvc.hashToken(token);
    const authToken = await this.authTokensRepo.findByTokenHash(tokenHash, 'password_reset');

    if (!authToken) {
      throw new AppError(ErrorCodes.AUTH_TOKEN_INVALID, 'Invalid reset token', 400);
    }

    if (authToken.consumedAt) {
      throw new AppError(ErrorCodes.AUTH_TOKEN_CONSUMED, 'Reset token has already been consumed', 400);
    }

    if (authToken.expiresAt.getTime() <= Date.now()) {
      throw new AppError(ErrorCodes.AUTH_TOKEN_EXPIRED, 'Reset token has expired', 400);
    }

    const newPasswordHash = await this.passwordSvc.hashPassword(newPassword);

    await withTransaction(async (session) => {
      // 1. Consume reset token
      await this.authTokensRepo.consumeToken(authToken._id.toString(), { session });

      // 2. Update user's passwordHash
      await this.usersRepo.updatePassword(authToken.userId.toString(), newPasswordHash, { session });

      // 3. Increment refreshTokenVersion for instant global invalidation
      await this.usersRepo.incrementRefreshTokenVersion(authToken.userId.toString(), { session });

      // 4. Revoke all active sessions
      await this.sessionSvc.revokeAllUserSessions(authToken.userId.toString(), 'password_reset', session);
    });

    logger.info({ userId: authToken.userId.toString() }, 'Password successfully reset and sessions revoked');
  }
}

export const authService = new AuthService();
