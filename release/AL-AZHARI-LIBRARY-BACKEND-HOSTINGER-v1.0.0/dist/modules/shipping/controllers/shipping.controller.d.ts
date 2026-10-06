import { Request, Response, NextFunction } from 'express';
import { ShippingService } from '../services/shipping.service';
export declare class ShippingController {
    private readonly shipping;
    constructor(shipping?: ShippingService);
    /**
     * POST /api/v1/checkout/shipping-estimate
     */
    estimateShipping: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/shipping/rules
     */
    createRule: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/shipping/rules
     */
    listRules: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/shipping/rules/:id
     */
    getRuleById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PATCH /api/v1/admin/shipping/rules/:id
     */
    updateRule: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * DELETE /api/v1/admin/shipping/rules/:id
     */
    deleteRule: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const shippingController: ShippingController;
