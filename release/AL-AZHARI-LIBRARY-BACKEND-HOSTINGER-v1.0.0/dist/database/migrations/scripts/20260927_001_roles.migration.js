"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesMigration = void 0;
const roles_service_1 = require("../../../modules/users/services/roles.service");
const registry_1 = require("../registry");
exports.rolesMigration = {
    id: '20260927_001_roles',
    description: 'Initialize idempotent system roles (customer, admin, owner)',
    up: async (_context) => {
        await roles_service_1.rolesService.ensureSystemRoles();
    },
};
(0, registry_1.registerMigration)(exports.rolesMigration);
//# sourceMappingURL=20260927_001_roles.migration.js.map