import { Request, Response, NextFunction } from 'express';
import { WhatsAppLinkService } from './whatsapp.service';
export declare class WhatsAppController {
    private readonly service;
    constructor(service?: WhatsAppLinkService);
    /**
     * GET /api/v1/whatsapp/support
     * Customer / Public endpoint to generate safe, URL-encoded WhatsApp support link (WA-001).
     * Accompanied by authoritative disclaimer confirming chat does not mutate state (WA-003).
     */
    getSupportLink: (req: Request, res: Response, next: NextFunction) => void;
    /**
     * POST /api/v1/admin/whatsapp/customer-link
     * Admin endpoint to generate WhatsApp link for contacting a specific customer (WA-002).
     * Requires admin permission (orders.read or services.read).
     */
    getCustomerLink: (req: Request, res: Response, next: NextFunction) => void;
}
export declare const whatsAppController: WhatsAppController;
