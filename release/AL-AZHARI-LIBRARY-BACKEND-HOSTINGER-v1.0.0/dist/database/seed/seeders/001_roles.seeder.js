"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rolesSeeder = void 0;
const registry_1 = require("../registry");
const roles_service_1 = require("../../../modules/users/services/roles.service");
exports.rolesSeeder = {
    id: '001_roles',
    description: 'Initialize idempotent system roles (customer, admin, owner)',
    run: async (_context) => {
        await roles_service_1.rolesService.ensureSystemRoles();
    },
};
(0, registry_1.registerSeeder)(exports.rolesSeeder);
//# sourceMappingURL=001_roles.seeder.js.map