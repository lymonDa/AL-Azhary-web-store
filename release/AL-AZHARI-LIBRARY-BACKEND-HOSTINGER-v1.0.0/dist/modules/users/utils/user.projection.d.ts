import { IUserDocument, IUser, SafeUser } from '../types/user.types';
/**
 * Projects a user document into a safe user object.
 * Excludes sensitive fields: passwordHash, refreshTokenVersion, and internal authentication metadata.
 */
export declare function toSafeUser(user: IUserDocument | IUser | Record<string, unknown>): SafeUser;
