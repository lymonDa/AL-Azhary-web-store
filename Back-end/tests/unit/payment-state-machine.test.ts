import {
  validatePaymentTransition,
  VALID_PAYMENT_TRANSITIONS,
} from '../../src/modules/payments/utils/payment-state-machine';
import { PaymentStatus } from '../../src/modules/payments/types/payment.types';
import { BusinessRuleViolationError } from '../../src/common/errors';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('Payment State Machine Unit Tests', () => {
  it('should allow valid forward transitions', () => {
    expect(() => validatePaymentTransition('not_submitted', 'proof_uploaded')).not.toThrow();
    expect(() => validatePaymentTransition('not_submitted', 'under_review')).not.toThrow();
    expect(() => validatePaymentTransition('proof_uploaded', 'under_review')).not.toThrow();
    expect(() => validatePaymentTransition('under_review', 'confirmed')).not.toThrow();
    expect(() => validatePaymentTransition('under_review', 'rejected')).not.toThrow();
    expect(() => validatePaymentTransition('under_review', 'new_proof_requested')).not.toThrow();
  });

  it('should allow retry after new_proof_requested or rejected', () => {
    expect(() => validatePaymentTransition('new_proof_requested', 'under_review')).not.toThrow();
    expect(() => validatePaymentTransition('new_proof_requested', 'proof_uploaded')).not.toThrow();
    expect(() => validatePaymentTransition('rejected', 'under_review')).not.toThrow();
    expect(() => validatePaymentTransition('rejected', 'proof_uploaded')).not.toThrow();
  });

  it('should disallow any transition from confirmed (terminal state)', () => {
    const statuses: PaymentStatus[] = [
      'not_submitted',
      'proof_uploaded',
      'under_review',
      'confirmed',
      'rejected',
      'new_proof_requested',
    ];

    for (const target of statuses) {
      expect(() => validatePaymentTransition('confirmed', target)).toThrow(BusinessRuleViolationError);
      try {
        validatePaymentTransition('confirmed', target);
      } catch (err: unknown) {
        if (err instanceof BusinessRuleViolationError) {
          expect(err.code).toBe(ErrorCodes.PAYMENT_REVIEW_STATE_CONFLICT);
        } else {
          throw err;
        }
      }
    }
  });

  it('should disallow illegal jumps (e.g. not_submitted directly to confirmed)', () => {
    expect(() => validatePaymentTransition('not_submitted', 'confirmed')).toThrow(
      BusinessRuleViolationError,
    );
  });

  it('should define distinct states for rejected vs new_proof_requested', () => {
    expect('rejected').not.toBe('new_proof_requested');
    expect(VALID_PAYMENT_TRANSITIONS.under_review).toContain('rejected');
    expect(VALID_PAYMENT_TRANSITIONS.under_review).toContain('new_proof_requested');
  });
});
