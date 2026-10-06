import { UsersRepository } from '../../users/repositories/users.repository';
import { AuthTokensRepository } from '../repositories/auth-tokens.repository';
import { SessionService } from './session.service';
import { PasswordService } from './password.service';
import { JwtService } from './jwt.service';
import { TokenService } from './token.service';
import { SafeUser } from '../../users/types/user.types';
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
export declare class AuthService {
    private readonly usersRepo;
    private readonly authTokensRepo;
    private readonly sessionSvc;
    private readonly passwordSvc;
    private readonly jwtSvc;
    private readonly tokenSvc;
    constructor(usersRepo?: UsersRepository, authTokensRepo?: AuthTokensRepository, sessionSvc?: SessionService, passwordSvc?: PasswordService, jwtSvc?: JwtService, tokenSvc?: TokenService);
    /**
     * Registers a new customer identity atomically with an email verification token.
     */
    register(input: RegisterInput): Promise<{
        user: SafeUser;
        verificationToken: string;
    }>;
    /**
     * Authenticates user via email or phone and issues JWT + refresh token session.
     */
    login(input: LoginInput, metadata?: RequestClientMetadata): Promise<{
        accessToken: string;
        rawRefreshToken: string;
        user: SafeUser;
        session: {
            id: string;
            expiresAt: Date;
        };
    }>;
    /**
     * Refreshes access token and rotates refresh token inside a transaction.
     */
    refresh(rawRefreshToken: string, metadata?: RequestClientMetadata): Promise<{
        accessToken: string;
        rawRefreshToken: string;
    }>;
    /**
     * Logs out current session or all active sessions globally.
     */
    logout(userId: string, sessionId: string, all?: boolean): Promise<void>;
    /**
     * Verifies email using an opaque one-time token.
     */
    verifyEmail(token: string): Promise<SafeUser>;
    /**
     * Initiates password reset. Emits neutral response regardless of account existence.
     */
    forgotPassword(email: string): Promise<{
        resetToken?: string;
    }>;
    /**
     * Completes password reset, consumes token, updates password, and revokes all active sessions.
     */
    resetPassword(token: string, newPassword: string): Promise<void>;
}
export declare const authService: AuthService;
