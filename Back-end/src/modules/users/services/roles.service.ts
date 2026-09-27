import { rolesRepository, RolesRepository } from '../repositories/roles.repository';
import { UserRoles } from '../../../common/constants/roles';
import { IRoleDocument } from '../types/user.types';

export const SYSTEM_ROLE_DEFINITIONS = [
  {
    key: UserRoles.CUSTOMER,
    displayName: 'Customer',
    permissionKeys: [],
    isSystem: true,
    active: true,
  },
  {
    key: UserRoles.ADMIN,
    displayName: 'Administrator',
    permissionKeys: [
      'orders.read',
      'orders.write',
      'orders.accept',
      'payments.review',
      'products.write',
      'categories.write',
      'inventory.write',
      'services.write',
      'quotations.write',
      'preorders.write',
      'returns.write',
      'refunds.write',
      'reports.read',
    ],
    isSystem: true,
    active: true,
  },
  {
    key: UserRoles.OWNER,
    displayName: 'Store Owner',
    permissionKeys: ['*'],
    isSystem: true,
    active: true,
  },
];

export class RolesService {
  constructor(private readonly repo: RolesRepository = rolesRepository) {}

  async getRoleByKey(key: string): Promise<IRoleDocument | null> {
    return this.repo.findByKey(key);
  }

  async hasPermission(roleKey: string, requiredPermission: string): Promise<boolean> {
    // Owner role always has unrestricted authority across all modules
    if (roleKey === UserRoles.OWNER) {
      return true;
    }

    const role = await this.repo.findByKey(roleKey);
    if (!role || !role.active) {
      return false;
    }

    if (role.permissionKeys.includes('*')) {
      return true;
    }

    return role.permissionKeys.includes(requiredPermission);
  }

  async ensureSystemRoles(): Promise<void> {
    for (const def of SYSTEM_ROLE_DEFINITIONS) {
      await this.repo.upsertRole(def);
    }
  }
}

export const rolesService = new RolesService();
