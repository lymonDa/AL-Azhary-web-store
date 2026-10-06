import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { ShippingService } from '../../shipping/services/shipping.service';
export declare class OrderController {
    private readonly orders;
    private readonly shipping;
    constructor(orders?: OrderService, shipping?: ShippingService);
    /**
     * Helper to extract cart owner context from request (authenticated customer or guest session header)
     */
    private getCartOwnerContext;
    /**
     * POST /api/v1/checkout/shipping-estimate
     */
    estimateShipping: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/orders
     * Create an authoritative order from current cart.
     */
    createOrder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/orders/:reference
     */
    getOrderByReference: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * PATCH /api/v1/orders/:reference
     */
    updatePendingOrder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/orders/:reference/cancel
     */
    cancelOrder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/orders
     */
    listAdminOrders: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/orders/:reference/accept
     */
    adminAcceptOrder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/orders/:reference/reject
     */
    adminRejectOrder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/orders/:reference/status
     */
    adminUpdateOrderStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/orders/:reference/confirm-cod
     */
    confirmCodOrder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/orders/:reference
     */
    getAdminOrderByReference: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/orders/:reference/shipping
     */
    adminUpdateShipping: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const orderController: OrderController;
