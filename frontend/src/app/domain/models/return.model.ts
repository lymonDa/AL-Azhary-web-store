import type { Money } from './money.model';

export interface CustomerReturnItem {
  readonly orderItemId: string;
  readonly quantity: number;
  readonly reason: string;
  readonly eligible?: boolean | undefined;
  readonly unitPrice?: Money | undefined;
  readonly lineTotal?: Money | undefined;
}

export interface CustomerReturnRequest {
  readonly reference: string;
  readonly orderReference: string;
  readonly items: CustomerReturnItem[];
  readonly status: string;
  readonly customerNote?: string | null | undefined;
  readonly adminNote?: string | null | undefined;
  readonly totalRefundAmount: Money;
  readonly version: number;
  readonly reviewedAt?: string | null | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
}
