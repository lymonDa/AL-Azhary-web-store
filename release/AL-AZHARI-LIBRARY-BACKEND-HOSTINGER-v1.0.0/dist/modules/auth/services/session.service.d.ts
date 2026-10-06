import { ClientSession } from 'mongoose';
import { SessionsRepository } from '../repositories/sessions.repository';
import { TokenService } from './token.service';
import { ISessionDocument } from '../types/auth.types';
export interface CreateSessionOptions {
    userAgent?: string;
    ip?: string;
    sessionVersion?: number;
}
export declare class SessionService {
    private readonly repo;
    private readonly tokenSvc;
    constructor(repo?: SessionsRepository, tokenSvc?: TokenService);
    /**
     * Creates a new session record with a hashed refresh token.
     */
    createSession(userId: string, options?: CreateSessionOptions, session?: ClientSession): Promise<{
        session: ISessionDocument;
        rawRefreshToken: string;
    }>;
    /**
     * Rotates a session's refresh token atomically.
     */
    rotateSession(rawRefreshToken: string, options?: {
        userAgent?: string;
        ip?: string;
    }, session?: ClientSession): Promise<{
        session: ISessionDocument;
        newRawRefreshToken: string;
        userId: string;
        sessionVersion: number;
    }>;
    revokeSession(sessionId: string, reason?: string, session?: ClientSession): Promise<void>;
    revokeAllUserSessions(userId: string, reason?: string, session?: ClientSession): Promise<void>;
    getSessionById(sessionId: string): Promise<ISessionDocument | null>;
}
export declare const sessionService: SessionService;
