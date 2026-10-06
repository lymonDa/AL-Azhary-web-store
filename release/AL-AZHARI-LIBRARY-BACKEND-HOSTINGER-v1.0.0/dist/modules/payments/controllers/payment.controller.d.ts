import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
export declare class PaymentController {
    private readonly payments;
    constructor(payments?: PaymentService);
    /**
     * Helper to extract payment access context from request (customer user, guest token header, or admin)
     */
    private getAccessContext;
    /**
     * GET /api/v1/orders/:reference/payment
     * Retrieve payment status, method instructions, and customer-safe proof history.
     */
    getPaymentByOrderReference: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/orders/:reference/payment-proof/upload-config
     * Requests a constrained signed Cloudinary direct-upload policy for payment proof screenshots.
     */
    getUploadConfig: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/orders/:reference/payment-proofs
     * Customer submits uploaded Cloudinary proof screenshots.
     */
    submitPaymentProof: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/payments
     * Admin lists payment queue with pagination.
     */
    listAdminPayments: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/payments/:paymentId
     * Admin gets payment and full proof details.
     */
    getAdminPaymentById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/payments/:paymentId/confirm
     * Admin confirms payment proof.
     */
    adminConfirmPayment: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/payments/:paymentId/reject
     * Admin rejects payment proof.
     */
    adminRejectPayment: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/admin/payments/:paymentId/request-new-proof
     * Admin requests customer to upload new payment proof.
     */
    adminRequestNewProof: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * GET /api/v1/admin/payments/:paymentId/proofs/:submissionNumber/signed-url
     * Generates a short-lived signed URL for an authorized admin to view a private proof screenshot.
     */
    getProofSignedUrl: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const paymentController: PaymentController;
