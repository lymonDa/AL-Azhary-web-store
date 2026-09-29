import { Request, Response, NextFunction } from 'express';
import { shippingService, ShippingService } from '../services/shipping.service';
import {
  createShippingRuleSchema,
  updateShippingRuleSchema,
  shippingRuleQuerySchema,
  shippingEstimateSchema,
} from '../schemas/shipping.schema';
import { sendSuccess } from '../../../common/utils/response.util';
import { UnauthorizedError } from '../../../common/errors';

export class ShippingController {
  constructor(private readonly shipping: ShippingService = shippingService) {}

  /**
   * POST /api/v1/checkout/shipping-estimate
   */
  estimateShipping = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = shippingEstimateSchema.parse(req.body);
      const result = await this.shipping.estimateShipping({
        method: input.method,
        governorate: input.governorate,
        city: input.city,
        area: input.area,
      });

      sendSuccess(req, res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/shipping/rules
   */
  createRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const input = createShippingRuleSchema.parse(req.body);

      const rule = await this.shipping.createRule(input, {
        id: req.user.userId,
        role: req.user.role,
      });

      sendSuccess(req, res, rule, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/shipping/rules
   */
  listRules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = shippingRuleQuerySchema.parse(req.query);
      const result = await this.shipping.listRules(query);
      sendSuccess(req, res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/shipping/rules/:id
   */
  getRuleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const rule = await this.shipping.getRuleById(id);
      sendSuccess(req, res, rule);
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/shipping/rules/:id
   */
  updateRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { id } = req.params;
      const input = updateShippingRuleSchema.parse(req.body);

      const updated = await this.shipping.updateRule(id, input, {
        id: req.user.userId,
        role: req.user.role,
      });

      sendSuccess(req, res, updated);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/shipping/rules/:id
   */
  deleteRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { id } = req.params;

      const deleted = await this.shipping.deleteRule(id, {
        id: req.user.userId,
        role: req.user.role,
      });

      sendSuccess(req, res, deleted);
    } catch (error) {
      next(error);
    }
  };
}

export const shippingController = new ShippingController();
