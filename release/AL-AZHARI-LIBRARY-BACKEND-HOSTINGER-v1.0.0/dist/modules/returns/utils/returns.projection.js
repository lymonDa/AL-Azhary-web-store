"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSafeReturnRequest = toSafeReturnRequest;
exports.toSafeRefund = toSafeRefund;
function toSafeReturnRequest(doc) {
    return {
        reference: doc.reference,
        orderReference: doc.orderReference,
        status: doc.status,
        items: doc.items.map((it) => ({
            orderItemId: it.orderItemId,
            quantity: it.quantity,
            reason: it.reason,
            eligible: it.eligible,
            unitPriceMinor: it.unitPriceMinor,
            lineTotalMinor: it.lineTotalMinor,
            evidenceMetadata: it.evidenceMetadata || [],
        })),
        customerNote: doc.customerNote,
        adminNote: doc.adminNote,
        reviewedAt: doc.reviewedAt,
        refundId: doc.refundId ? doc.refundId.toString() : null,
        totalRefundAmountMinor: doc.totalRefundAmountMinor,
        currency: doc.currency,
        version: doc.version,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}
function toSafeRefund(doc) {
    return {
        id: doc._id.toString(),
        orderReference: doc.orderReference,
        returnReference: doc.returnReference,
        amountMinor: doc.amountMinor,
        currency: doc.currency,
        methodKey: doc.methodKey,
        status: doc.status,
        recordedAt: doc.recordedAt,
        completedAt: doc.completedAt,
        failedAt: doc.failedAt,
        failureReason: doc.failureReason,
        note: doc.note,
        attemptReference: doc.attemptReference,
        version: doc.version,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}
//# sourceMappingURL=returns.projection.js.map