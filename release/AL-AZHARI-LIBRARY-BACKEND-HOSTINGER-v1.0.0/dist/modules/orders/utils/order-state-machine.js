"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_ORDER_TRANSITIONS = void 0;
exports.validateOrderTransition = validateOrderTransition;
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
exports.VALID_ORDER_TRANSITIONS = {
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
function validateOrderTransition(currentStatus, targetStatus) {
    const allowed = exports.VALID_ORDER_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
        throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.ORDER_STATE_CONFLICT, `Invalid order state transition from "${currentStatus}" to "${targetStatus}"`);
    }
}
//# sourceMappingURL=order-state-machine.js.map