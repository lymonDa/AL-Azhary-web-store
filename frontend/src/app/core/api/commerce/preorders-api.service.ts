import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../base/api-client';
import { buildHttpParams } from '../base/query-params.builder';
import type {
  CancelPreorderRequestDto,
  PreorderListResponseDto,
  SafePreorderDto,
} from '../dto/preorder.dto';

@Injectable({
  providedIn: 'root',
})
export class PreordersApi {
  private readonly client = inject(ApiClient);

  /**
   * Lists customer pre-orders (GET /api/v1/pre-orders).
   */
  getPreorders(options?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Observable<PreorderListResponseDto> {
    const params = buildHttpParams(options ?? {});
    return this.client.getData<PreorderListResponseDto>('/pre-orders', { params });
  }

  /**
   * Retrieves single pre-order by reference (GET /api/v1/pre-orders/:reference).
   */
  getPreorder(reference: string): Observable<{ preorder: SafePreorderDto }> {
    return this.client.getData<{ preorder: SafePreorderDto }>(
      `/pre-orders/${encodeURIComponent(reference)}`,
    );
  }

  /**
   * Cancels a customer pre-order request (POST /api/v1/pre-orders/:reference/cancel).
   */
  cancelPreorder(
    reference: string,
    reason?: string,
  ): Observable<{ preorder: SafePreorderDto }> {
    const body: CancelPreorderRequestDto = reason ? { reason } : {};
    return this.client.postData<{ preorder: SafePreorderDto }>(
      `/pre-orders/${encodeURIComponent(reference)}/cancel`,
      body,
    );
  }
}
