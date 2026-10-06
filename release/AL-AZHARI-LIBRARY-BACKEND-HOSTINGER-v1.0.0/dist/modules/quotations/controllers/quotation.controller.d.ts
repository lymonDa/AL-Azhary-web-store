import { Request, Response, NextFunction } from 'express';
import { QuotationService } from '../services/quotation.service';
export declare class QuotationController {
    private readonly quotations;
    constructor(quotations?: QuotationService);
    /**
     * POST /api/v1/admin/service-requests/:reference/quotes
     * Admin creates and sends a quotation for a service request.
     * Permission: services.quote
     */
    adminCreateQuote: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/service-requests/:reference/quotation/accept
     * Customer / Guest accepts quotation.
     * Advances service request to awaiting_payment and activates payment.
     */
    acceptQuotation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * POST /api/v1/service-requests/:reference/quotation/reject
     * Customer / Guest rejects quotation.
     * Closes request without creating payment.
     */
    rejectQuotation: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
export declare const quotationController: QuotationController;
