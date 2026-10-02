import { Request, Response, NextFunction } from 'express';
import { preorderService, PreorderService } from '../services/preorder.service';
import {
  createPreorderSchema,
  acceptPreorderSchema,
  rejectPreorderSchema,
  cancelPreorderSchema,
  preorderReferenceParamSchema,
  productSlugParamSchema,
  listPreordersQuerySchema,
} from '../schemas/preorder.schema';
import { sendSuccess, sendCreated } from '../../../common/utils/response.util';
import { parsePagination } from '../../../common/http/pagination';
import { PreorderFilter } from '../types/preorder.types';

export class PreorderController {
  constructor(private readonly preorders: PreorderService = preorderService) {}

  /**
   * POST /api/v1/products/:slug/pre-orders
   * Customer / Guest submits a new pre-order request for an out-of-stock eligible product
   */
  createPreorder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = productSlugParamSchema.parse(req.params);
      const input = createPreorderSchema.parse(req.body);

      const accessContext = {
        userId: req.user?.userId || null,
        role: req.user?.role || null,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      };

      const preorder = await this.preorders.createPreorder(slug, input, accessContext);
      sendCreated(req, res, { preorder });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/pre-orders
   * Customer retrieves their own pre-orders (or Admin retrieves pre-orders)
   */
  listPreorders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = listPreordersQuerySchema.parse(req.query);
      const pagination = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });

      const isAdmin =
        req.user?.role === 'admin' ||
        req.user?.role === 'owner';

      const accessContext = {
        userId: req.user?.userId || null,
        role: req.user?.role || null,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      };

      const filter: PreorderFilter = {};
      if (query.status) filter.status = query.status;
      if (query.productId) filter.productId = query.productId;
      if (query.variantId !== undefined) filter.variantId = query.variantId;
      if (query.reference) filter.reference = query.reference;

      if (isAdmin && query.customerId) {
        filter.customerId = query.customerId;
      }

      if (isAdmin) {
        const result = await this.preorders.listAdminPreorders(filter, pagination);
        sendSuccess(req, res, { preorders: result.preorders }, 200, result.pagination);
      } else {
        const result = await this.preorders.listCustomerPreorders(accessContext, filter, pagination);
        sendSuccess(req, res, { preorders: result.preorders }, 200, result.pagination);
      }
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/pre-orders/:reference
   * Retrieves single pre-order by reference (ownership-scoped)
   */
  getPreorderByReference = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { reference } = preorderReferenceParamSchema.parse(req.params);
      const accessContext = {
        userId: req.user?.userId || null,
        role: req.user?.role || null,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      };

      const preorder = await this.preorders.getPreorderByReference(reference, accessContext);
      sendSuccess(req, res, { preorder });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/pre-orders/:reference/cancel
   * Customer or Admin cancels a pre-order request
   */
  cancelPreorder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = preorderReferenceParamSchema.parse(req.params);
      const input = cancelPreorderSchema.parse(req.body);

      const accessContext = {
        userId: req.user?.userId || null,
        role: req.user?.role || null,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      };

      const preorder = await this.preorders.cancelPreorder(reference, input, accessContext);
      sendSuccess(req, res, { preorder });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/admin/pre-orders/:reference/accept
   * Admin accepts a pre-order request (Section 48.7)
   */
  adminAcceptPreorder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = preorderReferenceParamSchema.parse(req.params);
      const input = acceptPreorderSchema.parse(req.body);

      const accessContext = {
        userId: req.user?.userId || null,
        role: req.user?.role || 'admin',
        requestId: String(req.id || ''),
        ipHash: req.ip,
      };

      const preorder = await this.preorders.acceptPreorder(reference, input, accessContext);
      sendSuccess(req, res, { preorder });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/admin/pre-orders/:reference/reject
   * Admin rejects a pre-order request
   */
  adminRejectPreorder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = preorderReferenceParamSchema.parse(req.params);
      const input = rejectPreorderSchema.parse(req.body);

      const accessContext = {
        userId: req.user?.userId || null,
        role: req.user?.role || 'admin',
        requestId: String(req.id || ''),
        ipHash: req.ip,
      };

      const preorder = await this.preorders.rejectPreorder(reference, input, accessContext);
      sendSuccess(req, res, { preorder });
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/admin/pre-orders/:reference/available
   * Admin marks product available for confirmed pre-orders (PRE-005)
   */
  adminMarkAvailable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = preorderReferenceParamSchema.parse(req.params);

      const accessContext = {
        userId: req.user?.userId || null,
        role: req.user?.role || 'admin',
        requestId: String(req.id || ''),
        ipHash: req.ip,
      };

      const preorder = await this.preorders.markAvailable(reference, accessContext);
      sendSuccess(req, res, { preorder });
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/admin/pre-orders
   * Admin lists all pre-orders with search and filter parameters
   */
  adminListPreorders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = listPreordersQuerySchema.parse(req.query);
      const pagination = parsePagination(query, { defaultLimit: 20, maxLimit: 100 });

      const filter: PreorderFilter = {};
      if (query.status) filter.status = query.status;
      if (query.productId) filter.productId = query.productId;
      if (query.variantId !== undefined) filter.variantId = query.variantId;
      if (query.reference) filter.reference = query.reference;
      if (query.customerId) filter.customerId = query.customerId;

      const result = await this.preorders.listAdminPreorders(filter, pagination);
      sendSuccess(req, res, { preorders: result.preorders }, 200, result.pagination);
    } catch (err) {
      next(err);
    }
  };
}

export const preorderController = new PreorderController();
