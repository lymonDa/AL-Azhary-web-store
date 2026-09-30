import { rolesRepository, RolesRepository } from '../repositories/roles.repository';
import { UserRoles } from '../../../common/constants/roles';
import { IRoleDocument } from '../types/user.types';
import { auditService, AuditService } from '../../audit/services/audit.service';
import { NotFoundError } from '../../../common/errors';

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
      'content.write',
      'inventory.write',
      'services.read',
      'services.write',
      'services.quote',
      'quotations.write',
      'preorders.write',
      'returns.write',
      'refunds.write',
      'reports.read',
      'shipping.read',
      'shipping.write',
      'coupons.read',
      'coupons.write',
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
  constructor(
    private readonly repo: RolesRepository = rolesRepository,
    private readonly audit: AuditService = auditService,
  ) {}

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

    if (role.permissionKeys.includes(requiredPermission)) {
      return true;
    }

    // Support namespace wildcard matching, e.g. 'services.*' matching 'services.quote'
    const [namespace] = requiredPermission.split('.');
    if (role.permissionKeys.includes(`${namespace}.*`)) {
      return true;
    }

    return false;
  }

  async updateRolePermissions(
    roleKey: string,
    permissionKeys: string[],
    actor?: { id: string; role: string; requestId?: string; ipHash?: string },
  ): Promise<IRoleDocument> {
    const existing = await this.repo.findByKey(roleKey);
    if (!existing) {
      throw new NotFoundError(`Role not found: ${roleKey}`);
    }

    const previousPermissions = [...existing.permissionKeys];
    existing.permissionKeys = permissionKeys;
    await existing.save();

    await this.audit.record({
      actorId: actor?.id,
      actorRole: actor?.role ?? 'owner',
      action: 'role.permissions_updated',
      entityType: 'Role',
      entityId: roleKey,
      previousState: { permissionKeys: previousPermissions },
      newState: { permissionKeys },
      requestId: actor?.requestId,
      ipHash: actor?.ipHash,
    });

    return existing;
  }

  async ensureSystemRoles(): Promise<void> {
    for (const def of SYSTEM_ROLE_DEFINITIONS) {
      await this.repo.upsertRole(def);
    }
  }
}

export const rolesService = new RolesService();
