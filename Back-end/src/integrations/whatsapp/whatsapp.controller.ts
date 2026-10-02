import { Request, Response, NextFunction } from 'express';
import { whatsAppService, WhatsAppLinkService } from './whatsapp.service';
import { supportLinkQuerySchema, customerLinkBodySchema } from './whatsapp.schema';
import { sendSuccess } from '../../common/utils/response.util';

export class WhatsAppController {
  constructor(private readonly service: WhatsAppLinkService = whatsAppService) {}

  /**
   * GET /api/v1/whatsapp/support
   * Customer / Public endpoint to generate safe, URL-encoded WhatsApp support link (WA-001).
   * Accompanied by authoritative disclaimer confirming chat does not mutate state (WA-003).
   */
  getSupportLink = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const query = supportLinkQuerySchema.parse(req.query);
      const result = this.service.getSupportLinkData(query);
      sendSuccess(req, res, result);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/admin/whatsapp/customer-link
   * Admin endpoint to generate WhatsApp link for contacting a specific customer (WA-002).
   * Requires admin permission (orders.read or services.read).
   */
  getCustomerLink = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const body = customerLinkBodySchema.parse(req.body);
      const { customerPhone, ...context } = body;
      const result = this.service.getCustomerLinkData(customerPhone, context);
      sendSuccess(req, res, result);
    } catch (err) {
      next(err);
    }
  };
}

export const whatsAppController = new WhatsAppController();
