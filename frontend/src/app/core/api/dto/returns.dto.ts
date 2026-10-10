export interface ReturnItemDto {
  readonly orderItemId: string;
  readonly quantity: number;
  readonly reason: string;
  readonly eligible?: boolean | undefined;
  readonly unitPriceMinor?: number | undefined;
  readonly lineTotalMinor?: number | undefined;
}

export interface SafeReturnRequestDto {
  readonly reference: string;
  readonly orderReference: string;
  readonly items: ReturnItemDto[];
  readonly status: string;
  readonly customerNote?: string | null | undefined;
  readonly adminNote?: string | null | undefined;
  readonly totalRefundAmountMinor: number;
  readonly currency: 'EGP';
  readonly version: number;
  readonly reviewedAt?: string | null | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ReturnListResponseDto {
  readonly returns: SafeReturnRequestDto[];
  readonly pagination?: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
  } | undefined;
}

export interface CreateReturnRequestDto {
  readonly items: {
    readonly orderItemId: string;
    readonly quantity: number;
    readonly reason: string;
  }[];
  readonly customerNote?: string | undefined;
}
