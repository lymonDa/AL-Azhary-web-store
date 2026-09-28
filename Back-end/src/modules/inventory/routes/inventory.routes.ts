import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { requireAuthentication } from '../../auth/middleware/auth.middleware';
import { requirePermission } from '../../auth/middleware/rbac.middleware';

export const adminInventoryRouter = Router();

// All Admin Inventory routes require authenticated user with 'inventory.write' permission
// (Store Owner has unrestricted universal authority)
adminInventoryRouter.use(requireAuthentication());
adminInventoryRouter.use(requirePermission('inventory.write'));

adminInventoryRouter.get('/:productId', inventoryController.getInventory);
adminInventoryRouter.get('/:productId/ledger', inventoryController.getLedger);
adminInventoryRouter.post('/adjust', inventoryController.adjust);
