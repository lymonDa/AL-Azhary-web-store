"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSafePreorderDto = toSafePreorderDto;
/**
 * Projects a raw preorder document or POJO to a sanitized, public-safe DTO.
 * Guarantees no sensitive internals, stringifies ObjectIds, and formats dates to ISO.
 */
function toSafePreorderDto(doc, includeAdminNotes = false) {
    const plain = 'toObject' in doc && typeof doc.toObject === 'function' ? doc.toObject() : doc;
    const dto = {
        id: plain._id.toString(),
        reference: plain.reference,
        customerId: plain.customerId ? plain.customerId.toString() : null,
        customerSnapshot: {
            name: plain.customerSnapshot?.name || '',
            phone: plain.customerSnapshot?.phone || '',
            email: plain.customerSnapshot?.email ?? null,
        },
        productId: plain.productId ? plain.productId.toString() : '',
        variantId: plain.variantId ?? null,
        productSnapshot: {
            name: {
                ar: plain.productSnapshot?.name?.ar || '',
                en: plain.productSnapshot?.name?.en ?? null,
            },
            slug: plain.productSnapshot?.slug || '',
            variantLabel: plain.productSnapshot?.variantLabel
                ? {
                    ar: plain.productSnapshot.variantLabel.ar,
                    en: plain.productSnapshot.variantLabel.en ?? null,
                }
                : null,
            sku: plain.productSnapshot?.sku ?? null,
            image: plain.productSnapshot?.image ?? null,
            attributes: plain.productSnapshot?.attributes ?? null,
        },
        quantity: plain.quantity,
        capturedPriceMinor: plain.capturedPriceMinor ?? 0,
        currency: plain.currency || 'EGP',
        status: plain.status,
        expectedAvailabilityAt: plain.expectedAvailabilityAt
            ? new Date(plain.expectedAvailabilityAt).toISOString()
            : null,
        paymentId: plain.paymentId ? plain.paymentId.toString() : null,
        linkedOrderId: plain.linkedOrderId ? plain.linkedOrderId.toString() : null,
        allocationSequence: plain.allocationSequence ?? null,
        notes: plain.notes ?? null,
        rejectionReason: plain.rejectionReason ?? null,
        cancellationReason: plain.cancellationReason ?? null,
        version: plain.version ?? 1,
        acceptedAt: plain.acceptedAt ? new Date(plain.acceptedAt).toISOString() : null,
        rejectedAt: plain.rejectedAt ? new Date(plain.rejectedAt).toISOString() : null,
        confirmedAt: plain.confirmedAt ? new Date(plain.confirmedAt).toISOString() : null,
        availableAt: plain.availableAt ? new Date(plain.availableAt).toISOString() : null,
        fulfilledAt: plain.fulfilledAt ? new Date(plain.fulfilledAt).toISOString() : null,
        cancelledAt: plain.cancelledAt ? new Date(plain.cancelledAt).toISOString() : null,
        createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : new Date().toISOString(),
    };
    if (includeAdminNotes && plain.adminNotes !== undefined) {
        dto.adminNotes = plain.adminNotes ?? null;
    }
    return dto;
}
//# sourceMappingURL=preorder.projection.js.map