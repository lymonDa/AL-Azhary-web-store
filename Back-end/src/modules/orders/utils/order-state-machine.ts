import { OrderStatus } from '../types/order.types';
import { BusinessRuleViolationError } from '../../../common/errors';
import { ErrorCodes } from '../../../common/errors/errorCodes';

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_review: ['accepted', 'rejected', 'cancelled'],
  accepted: ['awaiting_payment', 'customer_confirmation_required'],
  awaiting_payment: ['payment_verification', 'rejected', 'cancelled'],
  payment_verification: ['payment_confirmed', 'awaiting_new_proof', 'rejected'],
  awaiting_new_proof: ['payment_verification', 'rejected', 'cancelled'],
  payment_confirmed: ['preparing'],
  customer_confirmation_required: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['preparing'],
  preparing: ['ready_for_pickup', 'shipped'],
  ready_for_pickup: ['picked_up'],
  picked_up: ['completed'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: ['completed'],
  completed: ['returned'],
  rejected: [],
  cancelled: [],
  returned: [],
};

export function validateOrderTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
): void {
  const allowed = VALID_ORDER_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    throw new BusinessRuleViolationError(
      ErrorCodes.ORDER_STATE_CONFLICT,
      `Invalid order state transition from "${currentStatus}" to "${targetStatus}"`,
    );
  }
}
