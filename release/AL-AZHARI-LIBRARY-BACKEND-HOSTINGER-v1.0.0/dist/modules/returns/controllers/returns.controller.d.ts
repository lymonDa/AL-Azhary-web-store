import { Request, Response, NextFunction } from 'express';
import { ReturnsService } from '../services/returns.service';
export declare class ReturnsController {
    private readonly service;
    constructor(service?: ReturnsService);
    /**
     * POST /api/v1/orders/:orderReference/returns
     * Customer submits return request for order items.
     */
    createReturnRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/returns/:reference
     * Customer or Admin retrieves return request.
     */
    getReturnRequest: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/returns
     * Customer lists their return requests.
     */
    listCustomerReturns: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/returns
     * Admin lists return requests queue.
     */
    listAdminReturns: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/returns/:reference/approve
     * Admin approves return request & initiates refund atomically.
     */
    adminApproveReturn: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/returns/:reference/reject
     * Admin rejects return request.
     */
    adminRejectReturn: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/refunds
     * Admin lists refunds queue.
     */
    listAdminRefunds: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/refunds/:id
     * Admin retrieves refund by ID.
     */
    getRefund: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/refunds/:id/complete
     * Admin completes manual refund.
     */
    adminCompleteRefund: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/refunds/:id/fail
     * Admin records refund failure.
     */
    adminFailRefund: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const returnsController: ReturnsController;
