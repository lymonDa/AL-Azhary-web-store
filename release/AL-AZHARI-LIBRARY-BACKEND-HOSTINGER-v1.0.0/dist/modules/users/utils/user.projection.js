"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSafeUser = toSafeUser;
/**
 * Projects a user document into a safe user object.
 * Excludes sensitive fields: passwordHash, refreshTokenVersion, and internal authentication metadata.
 */
function toSafeUser(user) {
    const userRecord = user;
    const rawId = userRecord._id ?? userRecord.id;
    const id = typeof rawId === 'object' && rawId !== null ? rawId.toString() : String(rawId);
    return {
        id,
        name: String(userRecord.name ?? ''),
        email: String(userRecord.email ?? ''),
        phone: String(userRecord.phone ?? ''),
        role: userRecord.role,
        status: userRecord.status,
        emailVerifiedAt: userRecord.emailVerifiedAt ?? null,
        createdAt: userRecord.createdAt ?? new Date(),
        updatedAt: userRecord.updatedAt ?? new Date(),
    };
}
//# sourceMappingURL=user.projection.js.map