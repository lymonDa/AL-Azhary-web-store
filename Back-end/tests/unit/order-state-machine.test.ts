import { validateOrderTransition } from '../../src/modules/orders/utils/order-state-machine';
import { OrderStatus } from '../../src/modules/orders/types/order.types';
import { BusinessRuleViolationError } from '../../src/common/errors';
import { ErrorCodes } from '../../src/common/errors/errorCodes';

describe('Order State Machine & Transition Rules', () => {
  it('validates allowed transitions from pending_review', () => {
    expect(() => validateOrderTransition('pending_review', 'accepted')).not.toThrow();
    expect(() => validateOrderTransition('pending_review', 'rejected')).not.toThrow();
    expect(() => validateOrderTransition('pending_review', 'cancelled')).not.toThrow();
  });

  it('validates allowed transitions from accepted', () => {
    expect(() => validateOrderTransition('accepted', 'awaiting_payment')).not.toThrow();
    expect(() => validateOrderTransition('accepted', 'customer_confirmation_required')).not.toThrow();
  });

  it('validates digital payment path transitions', () => {
    expect(() => validateOrderTransition('awaiting_payment', 'payment_verification')).not.toThrow();
    expect(() => validateOrderTransition('payment_verification', 'payment_confirmed')).not.toThrow();
    expect(() => validateOrderTransition('payment_verification', 'awaiting_new_proof')).not.toThrow();
    expect(() => validateOrderTransition('awaiting_new_proof', 'payment_verification')).not.toThrow();
    expect(() => validateOrderTransition('payment_confirmed', 'preparing')).not.toThrow();
  });

  it('validates COD path transitions', () => {
    expect(() => validateOrderTransition('customer_confirmation_required', 'confirmed')).not.toThrow();
    expect(() => validateOrderTransition('confirmed', 'preparing')).not.toThrow();
  });

  it('validates fulfillment pickup and delivery paths', () => {
    // Pickup path
    expect(() => validateOrderTransition('preparing', 'ready_for_pickup')).not.toThrow();
    expect(() => validateOrderTransition('ready_for_pickup', 'picked_up')).not.toThrow();
    expect(() => validateOrderTransition('picked_up', 'completed')).not.toThrow();

    // Delivery path
    expect(() => validateOrderTransition('preparing', 'shipped')).not.toThrow();
    expect(() => validateOrderTransition('shipped', 'out_for_delivery')).not.toThrow();
    expect(() => validateOrderTransition('out_for_delivery', 'delivered')).not.toThrow();
    expect(() => validateOrderTransition('delivered', 'completed')).not.toThrow();

    // Post-completion return transition
    expect(() => validateOrderTransition('completed', 'returned')).not.toThrow();
  });

  it('rejects terminal states from transitioning', () => {
    const terminalStates: OrderStatus[] = ['rejected', 'cancelled', 'returned'];
    const anyTarget: OrderStatus = 'pending_review';

    for (const status of terminalStates) {
      expect(() => validateOrderTransition(status, anyTarget)).toThrow(BusinessRuleViolationError);
      try {
        validateOrderTransition(status, anyTarget);
      } catch (err) {
        expect((err as BusinessRuleViolationError).code).toBe(ErrorCodes.ORDER_STATE_CONFLICT);
      }
    }
  });

  it('rejects invalid jumps across lifecycle boundaries', () => {
    const invalidTransitions: Array<[OrderStatus, OrderStatus]> = [
      ['pending_review', 'preparing'],
      ['pending_review', 'shipped'],
      ['pending_review', 'picked_up'],
      ['pending_review', 'delivered'],
      ['pending_review', 'completed'],
      ['accepted', 'preparing'],
      ['accepted', 'shipped'],
      ['accepted', 'completed'],
      ['awaiting_payment', 'preparing'],
      ['cancelled', 'accepted'],
      ['completed', 'pending_review'],
      ['rejected', 'preparing'],
      ['ready_for_pickup', 'delivered'],
      ['shipped', 'picked_up'],
    ];

    for (const [from, to] of invalidTransitions) {
      expect(() => validateOrderTransition(from, to)).toThrow(BusinessRuleViolationError);
      try {
        validateOrderTransition(from, to);
      } catch (err) {
        expect((err as BusinessRuleViolationError).code).toBe(ErrorCodes.ORDER_STATE_CONFLICT);
      }
    }
  });
});
