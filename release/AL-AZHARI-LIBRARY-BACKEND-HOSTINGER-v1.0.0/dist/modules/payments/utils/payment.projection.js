"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSafeBasePaymentResponse = toSafeBasePaymentResponse;
exports.toSafeCustomerPaymentResponse = toSafeCustomerPaymentResponse;
exports.toSafeAdminPaymentResponse = toSafeAdminPaymentResponse;
function toSafeBasePaymentResponse(payment) {
    return {
        paymentId: payment._id.toString(),
        ownerType: payment.ownerType,
        ownerId: payment.ownerId.toString(),
        methodKey: payment.methodKey,
        methodSnapshot: payment.methodSnapshot,
        amountDueMinor: payment.amountDueMinor,
        currency: payment.currency,
        status: payment.status,
        proofRequired: payment.proofRequired,
        proofSubmissionCount: payment.proofSubmissionCount,
        confirmedAt: payment.confirmedAt ? payment.confirmedAt.toISOString() : null,
        rejectedAt: payment.rejectedAt ? payment.rejectedAt.toISOString() : null,
        version: payment.version,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
    };
}
function toSafeCustomerPaymentResponse(payment, proofs) {
    const base = toSafeBasePaymentResponse(payment);
    return {
        ...base,
        ...(proofs
            ? {
                proofs: proofs.map((p) => ({
                    submissionNumber: p.submissionNumber,
                    status: p.status,
                    filesCount: p.files.length,
                    customerNote: p.customerNote ?? null,
                    reviewNote: p.reviewNote ?? null,
                    createdAt: p.createdAt.toISOString(),
                })),
            }
            : {}),
    };
}
function toSafeAdminPaymentResponse(payment, proofs) {
    const base = toSafeBasePaymentResponse(payment);
    return {
        ...base,
        customerId: payment.customerId ? payment.customerId.toString() : null,
        ...(proofs
            ? {
                proofs: proofs.map((p) => ({
                    submissionNumber: p.submissionNumber,
                    status: p.status,
                    filesCount: p.files.length,
                    files: p.files.map((f) => ({
                        cloudinaryPublicId: f.cloudinaryPublicId,
                        format: f.format,
                        bytes: f.bytes,
                        width: f.width ?? null,
                        height: f.height ?? null,
                    })),
                    customerNote: p.customerNote ?? null,
                    reviewNote: p.reviewNote ?? null,
                    reviewedBy: p.reviewedBy ? p.reviewedBy.toString() : null,
                    reviewedAt: p.reviewedAt ? p.reviewedAt.toISOString() : null,
                    createdAt: p.createdAt.toISOString(),
                })),
            }
            : {}),
    };
}
//# sourceMappingURL=payment.projection.js.map