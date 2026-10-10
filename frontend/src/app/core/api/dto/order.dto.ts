import type {
  AddressDto,
  OrderItemSnapshotDto,
  OrderTotalsDto,
  SafeOrderResponseDto,
} from './checkout.dto';

export type {
  AddressDto,
  OrderItemSnapshotDto,
  OrderTotalsDto,
  SafeOrderResponseDto,
};

export interface CancelOrderRequestDto {
  readonly expectedVersion: number;
  readonly reason?: string;
}

export interface ConfirmCodOrderRequestDto {
  readonly expectedVersion: number;
}

export interface OrderStatusHistoryEntryDto {
  readonly fromStatus: string;
  readonly toStatus: string;
  readonly actorRole: string;
  readonly reason?: string | null;
  readonly timestamp: string;
}

export interface CustomerOrdersResponseDto {
  readonly items: SafeOrderResponseDto[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}
