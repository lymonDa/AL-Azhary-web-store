import { Request, Response, NextFunction } from 'express';
import { PreorderService } from '../services/preorder.service';
export declare class PreorderController {
    private readonly preorders;
    constructor(preorders?: PreorderService);
    /**
     * POST /api/v1/products/:slug/pre-orders
     * Customer / Guest submits a new pre-order request for an out-of-stock eligible product
     */
    createPreorder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/pre-orders
     * Customer retrieves their own pre-orders (or Admin retrieves pre-orders)
     */
    listPreorders: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/pre-orders/:reference
     * Retrieves single pre-order by reference (ownership-scoped)
     */
    getPreorderByReference: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/pre-orders/:reference/cancel
     * Customer or Admin cancels a pre-order request
     */
    cancelPreorder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/pre-orders/:reference/accept
     * Admin accepts a pre-order request (Section 48.7)
     */
    adminAcceptPreorder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/pre-orders/:reference/reject
     * Admin rejects a pre-order request
     */
    adminRejectPreorder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/pre-orders/:reference/available
     * Admin marks product available for confirmed pre-orders (PRE-005)
     */
    adminMarkAvailable: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/pre-orders
     * Admin lists all pre-orders with search and filter parameters
     */
    adminListPreorders: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const preorderController: PreorderController;
