import { ClientSession, Types } from 'mongoose';
import { IAuthTokenDocument, AuthTokenType } from '../types/auth.types';
export declare class AuthTokensRepository {
    create(data: {
        userId: Types.ObjectId | string;
        type: AuthTokenType;
        tokenHash: string;
        expiresAt: Date;
    }, options?: {
        session?: ClientSession;
    }): Promise<IAuthTokenDocument>;
    findByTokenHash(tokenHash: string, type: AuthTokenType, options?: {
        session?: ClientSession;
    }): Promise<IAuthTokenDocument | null>;
    consumeToken(id: string, options?: {
        session?: ClientSession;
    }): Promise<IAuthTokenDocument | null>;
}
export declare const authTokensRepository: AuthTokensRepository;
