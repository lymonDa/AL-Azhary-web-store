import { createMoney } from '../../../domain/models/money.model';
import type { SafePreorderDto } from '../dto/preorder.dto';
import type { CustomerPreorder } from '../../../domain/models/preorder.model';

export function mapSafePreorderToDomain(dto: SafePreorderDto): CustomerPreorder {
  return {
    reference: dto.reference,
    customerId: dto.customerId ?? null,
    customerSnapshot: {
      name: dto.customerSnapshot.name,
      phone: dto.customerSnapshot.phone,
      email: dto.customerSnapshot.email ?? null,
    },
    productId: dto.productId,
    variantId: dto.variantId ?? null,
    productSnapshot: {
      name: {
        ar: dto.productSnapshot.name.ar,
        en: dto.productSnapshot.name.en ?? null,
      },
      slug: dto.productSnapshot.slug,
      variantLabel: dto.productSnapshot.variantLabel
        ? {
            ar: dto.productSnapshot.variantLabel.ar,
            en: dto.productSnapshot.variantLabel.en ?? null,
          }
        : null,
      sku: dto.productSnapshot.sku ?? null,
      image: dto.productSnapshot.image ?? null,
      attributes: dto.productSnapshot.attributes ?? null,
    },
    quantity: dto.quantity,
    price: createMoney(dto.capturedPriceMinor),
    status: dto.status,
    expectedAvailabilityAt: dto.expectedAvailabilityAt ?? null,
    notes: dto.notes ?? null,
    rejectionReason: dto.rejectionReason ?? null,
    cancellationReason: dto.cancellationReason ?? null,
    version: dto.version,
    acceptedAt: dto.acceptedAt ?? null,
    rejectedAt: dto.rejectedAt ?? null,
    confirmedAt: dto.confirmedAt ?? null,
    availableAt: dto.availableAt ?? null,
    fulfilledAt: dto.fulfilledAt ?? null,
    cancelledAt: dto.cancelledAt ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}
