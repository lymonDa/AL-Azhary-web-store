import { Request, Response, NextFunction } from 'express';
import { paymentService, PaymentService } from '../services/payment.service';
import {
  submitPaymentProofSchema,
  adminConfirmPaymentSchema,
  adminRejectPaymentSchema,
  adminRequestNewProofSchema,
  paymentQuerySchema,
} from '../schemas/payment.schema';
import {
  toSafeCustomerPaymentResponse,
  toSafeAdminPaymentResponse,
} from '../utils/payment.projection';
import { sendSuccess } from '../../../common/utils/response.util';
import { UnauthorizedError } from '../../../common/errors';

export class PaymentController {
  constructor(private readonly payments: PaymentService = paymentService) {}

  /**
   * Helper to extract payment access context from request (customer user, guest token header, or admin)
   */
  private getAccessContext(req: Request) {
    const guestToken =
      (req.headers['x-guest-token'] as string) || (req.query.token as string);

    return {
      userId: req.user?.userId,
      role: req.user?.role,
      guestToken,
      requestId: String(req.id || ''),
      ipHash: req.ip,
    };
  }

  /**
   * GET /api/v1/orders/:reference/payment
   * Retrieve payment status, method instructions, and customer-safe proof history.
   */
  getPaymentByOrderReference = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { reference } = req.params;
      const access = this.getAccessContext(req);

      const result = await this.payments.getPaymentByOrderReference(reference, access);
      const safeData = toSafeCustomerPaymentResponse(result.payment, result.proofs);

      sendSuccess(req, res, safeData);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/orders/:reference/payment-proof/upload-config
   * Requests a constrained signed Cloudinary direct-upload policy for payment proof screenshots.
   */
  getUploadConfig = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { reference } = req.params;
      const access = this.getAccessContext(req);

      const result = await this.payments.generateProofUploadConfig(reference, access);

      sendSuccess(req, res, result.uploadConfig);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/orders/:reference/payment-proofs
   * Customer submits uploaded Cloudinary proof screenshots.
   */
  submitPaymentProof = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { reference } = req.params;
      const access = this.getAccessContext(req);
      const input = submitPaymentProofSchema.parse(req.body);

      const result = await this.payments.submitPaymentProof(reference, input, access);
      const safeData = toSafeCustomerPaymentResponse(result.payment, [result.proof]);

      sendSuccess(req, res, safeData, 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/payments
   * Admin lists payment queue with pagination.
   */
  listAdminPayments = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const query = paymentQuerySchema.parse(req.query);

      const result = await this.payments.listAdminPayments(query);

      sendSuccess(
        req,
        res,
        result.items.map((p) => toSafeAdminPaymentResponse(p)),
        200,
        {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/payments/:paymentId
   * Admin gets payment and full proof details.
   */
  getAdminPaymentById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { paymentId } = req.params;

      const result = await this.payments.getAdminPaymentById(paymentId);
      const safeData = toSafeAdminPaymentResponse(result.payment, result.proofs);

      sendSuccess(req, res, safeData);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/payments/:paymentId/confirm
   * Admin confirms payment proof.
   */
  adminConfirmPayment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { paymentId } = req.params;
      const input = adminConfirmPaymentSchema.parse(req.body);

      const result = await this.payments.adminConfirmPayment(
        paymentId,
        input,
        { id: req.user.userId, role: req.user.role },
      );

      sendSuccess(req, res, toSafeAdminPaymentResponse(result.payment));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/payments/:paymentId/reject
   * Admin rejects payment proof.
   */
  adminRejectPayment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { paymentId } = req.params;
      const input = adminRejectPaymentSchema.parse(req.body);

      const result = await this.payments.adminRejectPayment(
        paymentId,
        input,
        { id: req.user.userId, role: req.user.role },
      );

      sendSuccess(req, res, toSafeAdminPaymentResponse(result.payment));
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/payments/:paymentId/request-new-proof
   * Admin requests customer to upload new payment proof.
   */
  adminRequestNewProof = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { paymentId } = req.params;
      const input = adminRequestNewProofSchema.parse(req.body);

      const result = await this.payments.adminRequestNewProof(
        paymentId,
        input,
        { id: req.user.userId, role: req.user.role },
      );

      sendSuccess(req, res, toSafeAdminPaymentResponse(result.payment));
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/payments/:paymentId/proofs/:submissionNumber/signed-url
   * Generates a short-lived signed URL for an authorized admin to view a private proof screenshot.
   */
  getProofSignedUrl = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication required');
      const { paymentId, submissionNumber } = req.params;
      const subNum = parseInt(submissionNumber, 10);

      const result = await this.payments.getProofSignedUrl(
        paymentId,
        subNum,
        { id: req.user.userId, role: req.user.role },
      );

      sendSuccess(req, res, {
        signedUrl: result.signedUrl,
        expiresAt: result.expiresAt.toISOString(),
      });
    } catch (error) {
      next(error);
    }
  };
}

export const paymentController = new PaymentController();
