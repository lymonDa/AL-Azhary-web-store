import { PaymentStatus } from '../types/payment.types';
import { BusinessRuleViolationError } from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';

export const VALID_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  not_submitted: ['proof_uploaded', 'under_review'],
  proof_uploaded: ['under_review'],
  under_review: ['confirmed', 'rejected', 'new_proof_requested'],
  new_proof_requested: ['proof_uploaded', 'under_review'],
  rejected: ['proof_uploaded', 'under_review'],
  confirmed: [],
};

export function validatePaymentTransition(
  currentStatus: PaymentStatus,
  targetStatus: PaymentStatus,
): void {
  const allowed = VALID_PAYMENT_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    throw new BusinessRuleViolationError(
      ErrorCodes.PAYMENT_REVIEW_STATE_CONFLICT,
      `Invalid payment state transition from "${currentStatus}" to "${targetStatus}"`,
    );
  }
}
