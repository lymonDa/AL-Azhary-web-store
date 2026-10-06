"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryController = exports.InventoryController = void 0;
const inventory_service_1 = require("../services/inventory.service");
const inventory_schema_1 = require("../schemas/inventory.schema");
const response_util_1 = require("../../../common/utils/response.util");
const errors_1 = require("../../../common/errors");
class InventoryController {
    service;
    constructor(service = inventory_service_1.inventoryService) {
        this.service = service;
    }
    /**
     * GET /api/v1/admin/inventory/:productId
     * Read current stock, reserved stock, and available calculation for a product or variant.
     */
    getInventory = async (req, res, next) => {
        try {
            const { productId } = req.params;
            const variantId = req.query.variantId ? String(req.query.variantId) : undefined;
            const data = await this.service.getInventory(productId, variantId);
            (0, response_util_1.sendSuccess)(req, res, data);
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/inventory/:productId/ledger
     * Read immutable historical audit ledger for a product or variant.
     */
    getLedger = async (req, res, next) => {
        try {
            const { productId } = req.params;
            const query = inventory_schema_1.inventoryQuerySchema.parse(req.query);
            const result = await this.service.getLedger(productId, query.variantId, {
                page: query.page,
                limit: query.limit,
            });
            (0, response_util_1.sendSuccess)(req, res, result.items, 200, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            });
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * POST /api/v1/admin/inventory/adjust
     * Perform manual inventory adjustment with optimistic versioning.
     */
    adjust = async (req, res, next) => {
        try {
            if (!req.user) {
                throw new errors_1.UnauthorizedError('Authentication required');
            }
            const input = inventory_schema_1.inventoryAdjustmentSchema.parse(req.body);
            const result = await this.service.adjustStock(input, {
                id: req.user.userId,
                role: req.user.role,
            }, {
                requestId: req.id ? String(req.id) : undefined,
                ipHash: req.ip,
            });
            (0, response_util_1.sendSuccess)(req, res, result, 200);
        }
        catch (error) {
            next(error);
        }
    };
}
exports.InventoryController = InventoryController;
exports.inventoryController = new InventoryController();
//# sourceMappingURL=inventory.controller.js.map