import { Request, Response, NextFunction } from 'express';
import { quotationService, QuotationService } from '../services/quotation.service';
import {
  createQuoteSchema,
  acceptQuoteSchema,
  rejectQuoteSchema,
} from '../schemas/quotation.schema';
import { serviceReferenceParamSchema } from '../../services/schemas/service.schema';
import { toSafeServiceRequest } from '../../services/utils/service.projection';
import { sendSuccess } from '../../../common/utils/response.util';

export class QuotationController {
  constructor(private readonly quotations: QuotationService = quotationService) {}

  /**
   * POST /api/v1/admin/service-requests/:reference/quotes
   * Admin creates and sends a quotation for a service request.
   * Permission: services.quote
   */
  adminCreateQuote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = serviceReferenceParamSchema.parse(req.params);
      const input = createQuoteSchema.parse(req.body);

      const quotation = await this.quotations.createAndSendQuotation(reference, input, {
        userId: req.user!.userId,
        role: req.user!.role,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      });

      sendSuccess(req, res, { quotation }, 201);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/service-requests/:reference/quotation/accept
   * Customer / Guest accepts quotation.
   * Advances service request to awaiting_payment and activates payment.
   */
  acceptQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = serviceReferenceParamSchema.parse(req.params);
      const input = acceptQuoteSchema.parse(req.body);

      const guestToken =
        (req.headers['x-guest-token'] as string) || (req.query.token as string) || undefined;

      const result = await this.quotations.acceptQuotation(reference, input, {
        userId: req.user?.userId,
        role: req.user?.role,
        guestToken,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      });

      sendSuccess(req, res, {
        quotation: result.quotation,
        serviceRequest: toSafeServiceRequest(result.serviceRequest, result.quotation),
        payment: result.payment,
      });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/service-requests/:reference/quotation/reject
   * Customer / Guest rejects quotation.
   * Closes request without creating payment.
   */
  rejectQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = serviceReferenceParamSchema.parse(req.params);
      const input = rejectQuoteSchema.parse(req.body);

      const guestToken =
        (req.headers['x-guest-token'] as string) || (req.query.token as string) || undefined;

      const result = await this.quotations.rejectQuotation(reference, input, {
        userId: req.user?.userId,
        role: req.user?.role,
        guestToken,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      });

      sendSuccess(req, res, {
        quotation: result.quotation,
        serviceRequest: toSafeServiceRequest(result.serviceRequest, result.quotation),
      });
    } catch (err) {
      next(err);
    }
  };
}

export const quotationController = new QuotationController();
