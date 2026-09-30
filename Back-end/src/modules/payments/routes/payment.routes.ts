import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import {
  optionalAuthentication,
  requireAuthentication,
} from '../../auth/middleware/auth.middleware';
import { requirePermission } from '../../auth/middleware/rbac.middleware';
import { proofUploadRateLimiter } from '../../../config/security';
import { env } from '../../../config/env';

// 1. Order-scoped Customer / Guest Payment Routes
// Mounted under /orders in app.ts, or directly
export const orderPaymentRouter = Router({ mergeParams: true });

if (env.NODE_ENV !== 'test') {
  orderPaymentRouter.use('/:reference/payment-proof', proofUploadRateLimiter);
  orderPaymentRouter.use('/:reference/payment-proofs', proofUploadRateLimiter);
}

orderPaymentRouter.get(
  '/:reference/payment',
  optionalAuthentication(),
  paymentController.getPaymentByOrderReference,
);

orderPaymentRouter.post(
  '/:reference/payment-proof/upload-config',
  optionalAuthentication(),
  paymentController.getUploadConfig,
);

orderPaymentRouter.post(
  '/:reference/payment-proofs',
  optionalAuthentication(),
  paymentController.submitPaymentProof,
);

// 2. Admin Payments Management & Review Router
// Mounted under /api/v1/admin/payments
export const adminPaymentRouter = Router();

adminPaymentRouter.use(requireAuthentication());

// Review Queue
adminPaymentRouter.get(
  '/',
  requirePermission('payments.review'),
  paymentController.listAdminPayments,
);

// Get Payment & Proof Detail
adminPaymentRouter.get(
  '/:paymentId',
  requirePermission('payments.review'),
  paymentController.getAdminPaymentById,
);

// Admin Review Actions
adminPaymentRouter.post(
  '/:paymentId/confirm',
  requirePermission('payments.review'),
  paymentController.adminConfirmPayment,
);

adminPaymentRouter.post(
  '/:paymentId/reject',
  requirePermission('payments.review'),
  paymentController.adminRejectPayment,
);

adminPaymentRouter.post(
  '/:paymentId/request-new-proof',
  requirePermission('payments.review'),
  paymentController.adminRequestNewProof,
);

// Short-lived Signed URL generation for authorized proof inspection
adminPaymentRouter.get(
  '/:paymentId/proofs/:submissionNumber/signed-url',
  requirePermission('payments.review'),
  paymentController.getProofSignedUrl,
);
