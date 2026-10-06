import { Document, Types } from 'mongoose';
import { UserRole } from '../../../common/constants/roles';
export type UserStatus = 'active' | 'suspended';
export interface IUser {
    _id: Types.ObjectId;
    role: UserRole;
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    emailVerifiedAt: Date | null;
    status: UserStatus;
    lastLoginAt: Date | null;
    refreshTokenVersion: number;
    createdAt: Date;
    updatedAt: Date;
}
export type IUserDocument = IUser & Document<Types.ObjectId>;
export interface SafeUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    status: UserStatus;
    emailVerifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateUserInput {
    name: string;
    email: string;
    phone: string;
    passwordHash: string;
    role?: UserRole;
    status?: UserStatus;
    emailVerifiedAt?: Date | null;
}
export interface UpdateProfileInput {
    name?: string;
    phone?: string;
}
export interface IRole {
    _id: Types.ObjectId;
    key: string;
    displayName: string;
    permissionKeys: string[];
    isSystem: boolean;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export type IRoleDocument = IRole & Document<Types.ObjectId>;
