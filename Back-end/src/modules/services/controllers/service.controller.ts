import { Request, Response, NextFunction } from 'express';
import { serviceService, ServiceService } from '../services/service.service';
import {
  createServiceRequestSchema,
  serviceSlugParamSchema,
  serviceReferenceParamSchema,
  FORBIDDEN_ATTACHMENT_KEYS,
} from '../schemas/service.schema';
import { toSafeServiceRequest } from '../utils/service.projection';
import { sendSuccess } from '../../../common/utils/response.util';
import { AppError } from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';

function detectForbiddenAttachments(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (FORBIDDEN_ATTACHMENT_KEYS.includes(normalized)) return true;
    if (typeof val === 'string' && val.startsWith('data:') && val.includes(';base64,')) return true;
    if (val && typeof val === 'object' && detectForbiddenAttachments(val)) return true;
  }
  return false;
}

export class ServiceController {
  constructor(private readonly services: ServiceService = serviceService) {}

  /**
   * GET /api/v1/services
   * Public list of active service categories
   */
  getServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.services.getActiveCategories();
      sendSuccess(req, res, { categories });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/services/:slug
   * Public service category details and active form configuration
   */
  getServiceBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = serviceSlugParamSchema.parse(req.params);
      const category = await this.services.getCategoryBySlug(slug);
      sendSuccess(req, res, { category });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/services/:slug/requests
   * Customer / Guest creates a new service request
   */
  createServiceRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Explicit attachment prohibition check
      if (detectForbiddenAttachments(req.body)) {
        throw new AppError(
          ErrorCodes.ATTACHMENT_NOT_ALLOWED,
          'File attachments, uploads, and file URLs are strictly prohibited for service requests. Exchange files externally via WhatsApp or Telegram.',
          400,
        );
      }

      // Check if contentType is multipart/form-data
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('multipart/form-data')) {
        throw new AppError(
          ErrorCodes.ATTACHMENT_NOT_ALLOWED,
          'Multipart file uploads are prohibited for service requests.',
          400,
        );
      }

      const { slug } = serviceSlugParamSchema.parse(req.params);
      const input = createServiceRequestSchema.parse(req.body);

      const guestToken =
        (req.headers['x-guest-token'] as string) || (req.query.token as string) || undefined;

      const result = await this.services.createServiceRequest(slug, input, {
        userId: req.user?.userId,
        role: req.user?.role,
        guestToken,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      });

      sendSuccess(
        req,
        res,
        {
          serviceRequest: toSafeServiceRequest(result.request),
          guestAccessToken: result.guestAccessToken,
        },
        201,
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/service-requests/:reference
   * Retrieves a single service request with strict customer ownership / admin validation
   */
  getServiceRequestByReference = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { reference } = serviceReferenceParamSchema.parse(req.params);
      const guestToken =
        (req.headers['x-guest-token'] as string) || (req.query.token as string) || undefined;

      const serviceRequest = await this.services.getServiceRequestByReference(reference, {
        userId: req.user?.userId,
        role: req.user?.role,
        guestToken,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      });

      sendSuccess(req, res, { serviceRequest });
    } catch (err) {
      next(err);
    }
  };
}

export const serviceController = new ServiceController();
