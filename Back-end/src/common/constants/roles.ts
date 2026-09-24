export const UserRoles = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  OWNER: 'owner',
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];
