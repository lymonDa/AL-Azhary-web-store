"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_PAYMENT_TRANSITIONS = void 0;
exports.validatePaymentTransition = validatePaymentTransition;
const errors_1 = require("../../../common/errors");
const errorCodes_1 = require("../../../common/errors/errorCodes");
exports.VALID_PAYMENT_TRANSITIONS = {
    not_submitted: ['proof_uploaded', 'under_review'],
    proof_uploaded: ['under_review'],
    under_review: ['confirmed', 'rejected', 'new_proof_requested'],
    new_proof_requested: ['proof_uploaded', 'under_review'],
    rejected: ['proof_uploaded', 'under_review'],
    confirmed: [],
};
function validatePaymentTransition(currentStatus, targetStatus) {
    const allowed = exports.VALID_PAYMENT_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
        throw new errors_1.BusinessRuleViolationError(errorCodes_1.ErrorCodes.PAYMENT_REVIEW_STATE_CONFLICT, `Invalid payment state transition from "${currentStatus}" to "${targetStatus}"`);
    }
}
//# sourceMappingURL=payment-state-machine.js.map