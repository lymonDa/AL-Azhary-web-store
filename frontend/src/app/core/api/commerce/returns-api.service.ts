import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../base/api-client';
import { buildHttpParams } from '../base/query-params.builder';
import type {
  CreateReturnRequestDto,
  ReturnListResponseDto,
  SafeReturnRequestDto,
} from '../dto/returns.dto';

@Injectable({
  providedIn: 'root',
})
export class ReturnsApi {
  private readonly client = inject(ApiClient);

  /**
   * Lists customer return requests (GET /api/v1/returns).
   */
  getReturns(options?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Observable<ReturnListResponseDto> {
    const params = buildHttpParams(options ?? {});
    return this.client.getData<ReturnListResponseDto>('/returns', { params });
  }

  /**
   * Retrieves single return request by reference (GET /api/v1/returns/:reference).
   */
  getReturn(reference: string): Observable<{ returnRequest: SafeReturnRequestDto }> {
    return this.client.getData<{ returnRequest: SafeReturnRequestDto }>(
      `/returns/${encodeURIComponent(reference)}`,
    );
  }

  /**
   * Submits a return request for items of an order (POST /api/v1/orders/:orderReference/returns).
   */
  createReturn(
    orderReference: string,
    dto: CreateReturnRequestDto,
  ): Observable<{ returnRequest: SafeReturnRequestDto }> {
    return this.client.postData<{ returnRequest: SafeReturnRequestDto }>(
      `/orders/${encodeURIComponent(orderReference)}/returns`,
      dto,
    );
  }
}
