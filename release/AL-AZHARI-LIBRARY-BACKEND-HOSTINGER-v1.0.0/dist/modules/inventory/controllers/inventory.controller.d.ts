import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service';
export declare class InventoryController {
    private readonly service;
    constructor(service?: InventoryService);
    /**
     * GET /api/v1/admin/inventory/:productId
     * Read current stock, reserved stock, and available calculation for a product or variant.
     */
    getInventory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/inventory/:productId/ledger
     * Read immutable historical audit ledger for a product or variant.
     */
    getLedger: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/inventory/adjust
     * Perform manual inventory adjustment with optimistic versioning.
     */
    adjust: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const inventoryController: InventoryController;
