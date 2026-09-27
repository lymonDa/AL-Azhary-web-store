import { IUserDocument, IUser, SafeUser } from '../types/user.types';

/**
 * Projects a user document into a safe user object.
 * Excludes sensitive fields: passwordHash, refreshTokenVersion, and internal authentication metadata.
 */
export function toSafeUser(user: IUserDocument | IUser | Record<string, unknown>): SafeUser {
  const userRecord = user as unknown as Record<string, unknown>;
  const rawId = userRecord._id ?? userRecord.id;
  const id = typeof rawId === 'object' && rawId !== null ? rawId.toString() : String(rawId);

  return {
    id,
    name: String(userRecord.name ?? ''),
    email: String(userRecord.email ?? ''),
    phone: String(userRecord.phone ?? ''),
    role: userRecord.role as SafeUser['role'],
    status: userRecord.status as SafeUser['status'],
    emailVerifiedAt: (userRecord.emailVerifiedAt as Date) ?? null,
    createdAt: (userRecord.createdAt as Date) ?? new Date(),
    updatedAt: (userRecord.updatedAt as Date) ?? new Date(),
  };
}
