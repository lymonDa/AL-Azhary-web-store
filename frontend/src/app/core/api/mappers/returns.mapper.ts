import { createMoney } from '../../../domain/models/money.model';
import type { SafeReturnRequestDto } from '../dto/returns.dto';
import type { CustomerReturnRequest } from '../../../domain/models/return.model';

export function mapSafeReturnRequestToDomain(dto: SafeReturnRequestDto): CustomerReturnRequest {
  return {
    reference: dto.reference,
    orderReference: dto.orderReference,
    items: (dto.items ?? []).map((it) => ({
      orderItemId: it.orderItemId,
      quantity: it.quantity,
      reason: it.reason,
      eligible: it.eligible,
      unitPrice: it.unitPriceMinor !== undefined ? createMoney(it.unitPriceMinor) : undefined,
      lineTotal: it.lineTotalMinor !== undefined ? createMoney(it.lineTotalMinor) : undefined,
    })),
    status: dto.status,
    customerNote: dto.customerNote ?? null,
    adminNote: dto.adminNote ?? null,
    totalRefundAmount: createMoney(dto.totalRefundAmountMinor),
    version: dto.version,
    reviewedAt: dto.reviewedAt ?? null,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}
