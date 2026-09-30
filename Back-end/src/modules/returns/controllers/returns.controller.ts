import { Request, Response, NextFunction } from 'express';
import { returnsService, ReturnsService } from '../services/returns.service';
import {
  returnOrderReferenceParamSchema,
  returnReferenceParamSchema,
  refundIdParamSchema,
  createReturnRequestSchema,
  adminReviewReturnSchema,
  completeRefundSchema,
  failRefundSchema,
  listReturnsQuerySchema,
  listRefundsQuerySchema,
} from '../schemas/returns.schema';
import { toSafeReturnRequest, toSafeRefund } from '../utils/returns.projection';
import { sendSuccess } from '../../../common/utils/response.util';

export class ReturnsController {
  constructor(private readonly service: ReturnsService = returnsService) {}

  /**
   * POST /api/v1/orders/:orderReference/returns
   * Customer submits return request for order items.
   */
  createReturnRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderReference } = returnOrderReferenceParamSchema.parse(req.params);
      const input = createReturnRequestSchema.parse(req.body);

      const returnRequest = await this.service.createReturnRequest(orderReference, input, {
        userId: req.user!.userId,
        role: req.user!.role,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      });

      sendSuccess(req, res, { returnRequest: toSafeReturnRequest(returnRequest) }, 201);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/returns/:reference
   * Customer or Admin retrieves return request.
   */
  getReturnRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = returnReferenceParamSchema.parse(req.params);

      const returnRequest = await this.service.getReturnRequestByReference(reference, {
        userId: req.user!.userId,
        role: req.user!.role,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      });

      sendSuccess(req, res, { returnRequest: toSafeReturnRequest(returnRequest) }, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/returns
   * Customer lists their return requests.
   */
  listCustomerReturns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = listReturnsQuerySchema.parse(req.query);

      const result = await this.service.listCustomerReturns(
        {
          userId: req.user!.userId,
          role: req.user!.role,
          requestId: String(req.id || ''),
          ipHash: req.ip,
        },
        query,
      );

      sendSuccess(
        req,
        res,
        {
          returns: result.items.map(toSafeReturnRequest),
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
          },
        },
        200,
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/admin/returns
   * Admin lists return requests queue.
   */
  listAdminReturns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = listReturnsQuerySchema.parse(req.query);
      const filter: Record<string, unknown> = {};
      if (query.status) {
        filter.status = query.status;
      }

      const result = await this.service.listAdminReturns(filter, query);

      sendSuccess(
        req,
        res,
        {
          returns: result.items.map(toSafeReturnRequest),
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
          },
        },
        200,
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/admin/returns/:reference/approve
   * Admin approves return request & initiates refund atomically.
   */
  adminApproveReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = returnReferenceParamSchema.parse(req.params);
      const input = adminReviewReturnSchema.parse(req.body);

      const result = await this.service.adminApproveReturn(reference, input, {
        userId: req.user!.userId,
        role: req.user!.role,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      });

      sendSuccess(
        req,
        res,
        {
          returnRequest: toSafeReturnRequest(result.returnRequest),
          refund: toSafeRefund(result.refund),
        },
        200,
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/admin/returns/:reference/reject
   * Admin rejects return request.
   */
  adminRejectReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reference } = returnReferenceParamSchema.parse(req.params);
      const input = adminReviewReturnSchema.parse(req.body);

      const returnRequest = await this.service.adminRejectReturn(reference, input, {
        userId: req.user!.userId,
        role: req.user!.role,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      });

      sendSuccess(req, res, { returnRequest: toSafeReturnRequest(returnRequest) }, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/admin/refunds
   * Admin lists refunds queue.
   */
  listAdminRefunds = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = listRefundsQuerySchema.parse(req.query);
      const filter: Record<string, unknown> = {};
      if (query.status) {
        filter.status = query.status;
      }

      const result = await this.service.listAdminRefunds(filter, query);

      sendSuccess(
        req,
        res,
        {
          refunds: result.items.map(toSafeRefund),
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
          },
        },
        200,
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * GET /api/v1/admin/refunds/:id
   * Admin retrieves refund by ID.
   */
  getRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = refundIdParamSchema.parse(req.params);

      const refund = await this.service.getRefundById(id, {
        userId: req.user!.userId,
        role: req.user!.role,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      });

      sendSuccess(req, res, { refund: toSafeRefund(refund) }, 200);
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/admin/refunds/:id/complete
   * Admin completes manual refund.
   */
  adminCompleteRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = refundIdParamSchema.parse(req.params);
      const input = completeRefundSchema.parse(req.body);

      const result = await this.service.adminCompleteRefund(id, input, {
        userId: req.user!.userId,
        role: req.user!.role,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      });

      sendSuccess(
        req,
        res,
        {
          refund: toSafeRefund(result.refund),
          returnRequest: toSafeReturnRequest(result.returnRequest),
        },
        200,
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * POST /api/v1/admin/refunds/:id/fail
   * Admin records refund failure.
   */
  adminFailRefund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = refundIdParamSchema.parse(req.params);
      const input = failRefundSchema.parse(req.body);

      const refund = await this.service.adminFailRefund(id, input, {
        userId: req.user!.userId,
        role: req.user!.role,
        requestId: String(req.id || ''),
        ipHash: req.ip,
      });

      sendSuccess(req, res, { refund: toSafeRefund(refund) }, 200);
    } catch (err) {
      next(err);
    }
  };
}

export const returnsController = new ReturnsController();
