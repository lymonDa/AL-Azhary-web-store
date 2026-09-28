import { Request, Response, NextFunction } from 'express';
import { inventoryService, InventoryService } from '../services/inventory.service';
import {
  inventoryAdjustmentSchema,
  inventoryQuerySchema,
} from '../schemas/inventory.schema';
import { sendSuccess } from '../../../common/utils/response.util';
import { UnauthorizedError } from '../../../common/errors';

export class InventoryController {
  constructor(private readonly service: InventoryService = inventoryService) {}

  /**
   * GET /api/v1/admin/inventory/:productId
   * Read current stock, reserved stock, and available calculation for a product or variant.
   */
  getInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId } = req.params;
      const variantId = req.query.variantId ? String(req.query.variantId) : undefined;

      const data = await this.service.getInventory(productId, variantId);
      sendSuccess(req, res, data);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/inventory/:productId/ledger
   * Read immutable historical audit ledger for a product or variant.
   */
  getLedger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId } = req.params;
      const query = inventoryQuerySchema.parse(req.query);

      const result = await this.service.getLedger(productId, query.variantId, {
        page: query.page,
        limit: query.limit,
      });

      sendSuccess(
        req,
        res,
        result.items,
        200,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/inventory/adjust
   * Perform manual inventory adjustment with optimistic versioning.
   */
  adjust = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const input = inventoryAdjustmentSchema.parse(req.body);

      const result = await this.service.adjustStock(
        input,
        {
          id: req.user.userId,
          role: req.user.role,
        },
        {
          requestId: req.id ? String(req.id) : undefined,
          ipHash: req.ip,
        },
      );

      sendSuccess(req, res, result, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const inventoryController = new InventoryController();
