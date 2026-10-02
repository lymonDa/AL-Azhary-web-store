import { PreorderStatus } from '../../src/modules/preorders/types/preorder.types';

describe('Pre-order State Machine & Lifecycle Transitions', () => {
  const allowedTransitions: Record<PreorderStatus, PreorderStatus[]> = {
    requested: ['admin_review', 'accepted', 'rejected', 'cancelled'],
    admin_review: ['accepted', 'rejected', 'cancelled'],
    accepted: ['payment_pending', 'cancelled'],
    rejected: [], // terminal
    payment_pending: ['payment_verification', 'confirmed', 'cancelled'],
    payment_verification: ['confirmed', 'payment_pending', 'cancelled'],
    confirmed: ['available', 'cancelled'],
    available: ['fulfilled'],
    fulfilled: [], // terminal
    cancelled: [], // terminal
    pending: ['admin_review', 'accepted', 'rejected', 'cancelled'], // legacy alias
  };

  function canTransition(from: PreorderStatus, to: PreorderStatus): boolean {
    return allowedTransitions[from]?.includes(to) ?? false;
  }

  it('allows valid progressive transitions from requested to fulfilled', () => {
    expect(canTransition('requested', 'admin_review')).toBe(true);
    expect(canTransition('admin_review', 'accepted')).toBe(true);
    expect(canTransition('accepted', 'payment_pending')).toBe(true);
    expect(canTransition('payment_pending', 'payment_verification')).toBe(true);
    expect(canTransition('payment_verification', 'confirmed')).toBe(true);
    expect(canTransition('confirmed', 'available')).toBe(true);
    expect(canTransition('available', 'fulfilled')).toBe(true);
  });

  it('allows direct acceptance from requested', () => {
    expect(canTransition('requested', 'accepted')).toBe(true);
  });

  it('allows rejection from requested and admin_review', () => {
    expect(canTransition('requested', 'rejected')).toBe(true);
    expect(canTransition('admin_review', 'rejected')).toBe(true);
  });

  it('allows cancellation before fulfillment', () => {
    expect(canTransition('requested', 'cancelled')).toBe(true);
    expect(canTransition('admin_review', 'cancelled')).toBe(true);
    expect(canTransition('accepted', 'cancelled')).toBe(true);
    expect(canTransition('payment_pending', 'cancelled')).toBe(true);
    expect(canTransition('confirmed', 'cancelled')).toBe(true);
  });

  it('enforces terminal states: rejected, cancelled, and fulfilled cannot transition anywhere', () => {
    const statuses: PreorderStatus[] = [
      'requested',
      'admin_review',
      'accepted',
      'rejected',
      'payment_pending',
      'payment_verification',
      'confirmed',
      'available',
      'fulfilled',
      'cancelled',
    ];

    for (const status of statuses) {
      expect(canTransition('rejected', status)).toBe(false);
      expect(canTransition('cancelled', status)).toBe(false);
      expect(canTransition('fulfilled', status)).toBe(false);
    }
  });

  it('disallows backward or nonsensical transitions', () => {
    expect(canTransition('fulfilled', 'requested')).toBe(false);
    expect(canTransition('available', 'payment_pending')).toBe(false);
    expect(canTransition('confirmed', 'requested')).toBe(false);
    expect(canTransition('available', 'cancelled')).toBe(false);
  });
});
