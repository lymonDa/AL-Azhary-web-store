import { Seeder, SeedContext } from '../types';
import { registerSeeder } from '../registry';
import { rolesService } from '../../../modules/users/services/roles.service';

export const rolesSeeder: Seeder = {
  id: '001_roles',
  description: 'Initialize idempotent system roles (customer, admin, owner)',
  run: async (_context: SeedContext): Promise<void> => {
    await rolesService.ensureSystemRoles();
  },
};

registerSeeder(rolesSeeder);
