"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminInventoryRouter = void 0;
const express_1 = require("express");
const inventory_controller_1 = require("../controllers/inventory.controller");
const auth_middleware_1 = require("../../auth/middleware/auth.middleware");
const rbac_middleware_1 = require("../../auth/middleware/rbac.middleware");
exports.adminInventoryRouter = (0, express_1.Router)();
// All Admin Inventory routes require authenticated user with 'inventory.write' permission
// (Store Owner has unrestricted universal authority)
exports.adminInventoryRouter.use((0, auth_middleware_1.requireAuthentication)());
exports.adminInventoryRouter.use((0, rbac_middleware_1.requirePermission)('inventory.write'));
exports.adminInventoryRouter.get('/:productId', inventory_controller_1.inventoryController.getInventory);
exports.adminInventoryRouter.get('/:productId/ledger', inventory_controller_1.inventoryController.getLedger);
exports.adminInventoryRouter.post('/adjust', inventory_controller_1.inventoryController.adjust);
//# sourceMappingURL=inventory.routes.js.map