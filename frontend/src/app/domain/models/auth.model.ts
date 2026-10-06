export type UserRole = 'customer' | 'admin' | 'owner' | string;
export type UserStatus = 'active' | 'suspended' | string;

export type AuthStatus = 'unknown' | 'anonymous' | 'authenticated' | 'refreshing' | 'expired';

/**
 * Minimal domain model for an authenticated user identity in Phase 3.
 * Customer profile, addresses, and full customer domains are deferred to later phases.
 */
export interface AuthUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly isEmailVerified: boolean;
  readonly emailVerifiedAt?: string | null | undefined;
}
