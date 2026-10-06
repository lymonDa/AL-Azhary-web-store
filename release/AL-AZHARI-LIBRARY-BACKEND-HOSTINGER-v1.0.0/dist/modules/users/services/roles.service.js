"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesService = exports.RolesService = exports.SYSTEM_ROLE_DEFINITIONS = void 0;
const roles_repository_1 = require("../repositories/roles.repository");
const roles_1 = require("../../../common/constants/roles");
const audit_service_1 = require("../../audit/services/audit.service");
const errors_1 = require("../../../common/errors");
exports.SYSTEM_ROLE_DEFINITIONS = [
    {
        key: roles_1.UserRoles.CUSTOMER,
        displayName: 'Customer',
        permissionKeys: [],
        isSystem: true,
        active: true,
    },
    {
        key: roles_1.UserRoles.ADMIN,
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
        key: roles_1.UserRoles.OWNER,
        displayName: 'Store Owner',
        permissionKeys: ['*'],
        isSystem: true,
        active: true,
    },
];
class RolesService {
    repo;
    audit;
    constructor(repo = roles_repository_1.rolesRepository, audit = audit_service_1.auditService) {
        this.repo = repo;
        this.audit = audit;
    }
    async getRoleByKey(key) {
        return this.repo.findByKey(key);
    }
    async hasPermission(roleKey, requiredPermission) {
        // Owner role always has unrestricted authority across all modules
        if (roleKey === roles_1.UserRoles.OWNER) {
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
    async updateRolePermissions(roleKey, permissionKeys, actor) {
        const existing = await this.repo.findByKey(roleKey);
        if (!existing) {
            throw new errors_1.NotFoundError(`Role not found: ${roleKey}`);
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
    async ensureSystemRoles() {
        for (const def of exports.SYSTEM_ROLE_DEFINITIONS) {
            await this.repo.upsertRole(def);
        }
    }
}
exports.RolesService = RolesService;
exports.rolesService = new RolesService();
//# sourceMappingURL=roles.service.js.map