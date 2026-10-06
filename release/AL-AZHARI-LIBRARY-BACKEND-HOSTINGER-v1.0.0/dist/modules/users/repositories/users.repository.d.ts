import { ClientSession } from 'mongoose';
import { IUserDocument, CreateUserInput } from '../types/user.types';
export declare class UsersRepository {
    findById(id: string, options?: {
        session?: ClientSession;
        selectPassword?: boolean;
    }): Promise<IUserDocument | null>;
    findByEmail(email: string, options?: {
        session?: ClientSession;
        selectPassword?: boolean;
    }): Promise<IUserDocument | null>;
    findByPhone(phone: string, options?: {
        session?: ClientSession;
        selectPassword?: boolean;
    }): Promise<IUserDocument | null>;
    findByIdentifier(identifier: string, options?: {
        session?: ClientSession;
        selectPassword?: boolean;
    }): Promise<IUserDocument | null>;
    create(data: CreateUserInput, options?: {
        session?: ClientSession;
    }): Promise<IUserDocument>;
    updateLastLogin(id: string, options?: {
        session?: ClientSession;
    }): Promise<void>;
    incrementRefreshTokenVersion(id: string, options?: {
        session?: ClientSession;
    }): Promise<number | null>;
    updatePassword(id: string, passwordHash: string, options?: {
        session?: ClientSession;
    }): Promise<void>;
    updateEmailVerified(id: string, emailVerifiedAt?: Date, options?: {
        session?: ClientSession;
    }): Promise<IUserDocument | null>;
    updateProfile(id: string, data: {
        name?: string;
        phone?: string;
    }, options?: {
        session?: ClientSession;
    }): Promise<IUserDocument | null>;
}
export declare const usersRepository: UsersRepository;
