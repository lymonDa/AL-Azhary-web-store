import { ClientSession, Types } from 'mongoose';
import { ISessionDocument } from '../types/auth.types';
export declare class SessionsRepository {
    create(data: {
        userId: Types.ObjectId | string;
        tokenHash: string;
        expiresAt: Date;
        userAgent?: string;
        ipHash?: string | null;
        sessionVersion?: number;
    }, options?: {
        session?: ClientSession;
    }): Promise<ISessionDocument>;
    findByTokenHash(tokenHash: string, options?: {
        session?: ClientSession;
    }): Promise<ISessionDocument | null>;
    findById(id: string, options?: {
        session?: ClientSession;
    }): Promise<ISessionDocument | null>;
    updateTokenHash(id: string, newTokenHash: string, newExpiresAt: Date, options?: {
        session?: ClientSession;
    }): Promise<ISessionDocument | null>;
    revokeById(id: string, reason?: string, options?: {
        session?: ClientSession;
    }): Promise<void>;
    revokeAllByUserId(userId: string, reason?: string, options?: {
        session?: ClientSession;
    }): Promise<void>;
}
export declare const sessionsRepository: SessionsRepository;
