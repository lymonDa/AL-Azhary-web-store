import { Migration, MigrationContext } from '../types';
import { rolesService } from '../../../modules/users/services/roles.service';

export const rolesMigration: Migration = {
  id: '20260927_001_roles',
  description: 'Initialize idempotent system roles (customer, admin, owner)',
  up: async (_context: MigrationContext): Promise<void> => {
    await rolesService.ensureSystemRoles();
  },
};
