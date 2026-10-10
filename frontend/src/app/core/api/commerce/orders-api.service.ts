import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../base/api-client';
import { buildHttpParams } from '../base/query-params.builder';
import type { SafeCustomerPaymentResponseDto, SafeOrderResponseDto } from '../dto/checkout.dto';
import type {
  CancelOrderRequestDto,
  ConfirmCodOrderRequestDto,
  CustomerOrdersResponseDto,
} from '../dto/order.dto';

@Injectable({
  providedIn: 'root',
})
export class OrdersApi {
  private readonly client = inject(ApiClient);

  /**
   * Retrieves single order by reference (GET /api/v1/orders/:reference).
   * Supports authenticated customer, admin, or guest with x-guest-token header.
   */
  getOrder(reference: string, guestToken?: string): Observable<SafeOrderResponseDto> {
    const headers = guestToken ? { 'x-guest-token': guestToken } : undefined;
    return this.client.getData<SafeOrderResponseDto>(
      `/orders/${encodeURIComponent(reference)}`,
      { headers },
    );
  }

  /**
   * Cancels pending order (POST /api/v1/orders/:reference/cancel).
   * Strict contract: only permitted in 'pending_review' status.
   * Requires expectedVersion for optimistic concurrency control.
   */
  cancelOrder(
    reference: string,
    expectedVersion: number,
    reason?: string,
    guestToken?: string,
  ): Observable<SafeOrderResponseDto> {
    const headers = guestToken ? { 'x-guest-token': guestToken } : undefined;
    const body: CancelOrderRequestDto = {
      expectedVersion,
      ...(reason ? { reason } : {}),
    };
    return this.client.postData<SafeOrderResponseDto>(
      `/orders/${encodeURIComponent(reference)}/cancel`,
      body,
      { headers },
    );
  }

  /**
   * Customer confirms Cash-on-Delivery order (POST /api/v1/orders/:reference/confirm-cod).
   * Strict contract: only permitted in 'customer_confirmation_required' status.
   * Requires expectedVersion.
   */
  confirmCodOrder(
    reference: string,
    expectedVersion: number,
    guestToken?: string,
  ): Observable<SafeOrderResponseDto> {
    const headers = guestToken ? { 'x-guest-token': guestToken } : undefined;
    const body: ConfirmCodOrderRequestDto = { expectedVersion };
    return this.client.postData<SafeOrderResponseDto>(
      `/orders/${encodeURIComponent(reference)}/confirm-cod`,
      body,
      { headers },
    );
  }

  /**
   * Retrieves payment details and proof history (GET /api/v1/orders/:reference/payment).
   */
  getPaymentDetails(
    reference: string,
    guestToken?: string,
  ): Observable<SafeCustomerPaymentResponseDto> {
    const headers = guestToken ? { 'x-guest-token': guestToken } : undefined;
    return this.client.getData<SafeCustomerPaymentResponseDto>(
      `/orders/${encodeURIComponent(reference)}/payment`,
      { headers },
    );
  }

  /**
   * Lists authenticated customer orders (GET /api/v1/orders).
   * [CONTRACT TO VERIFY]: findCustomerOrders is implemented in backend repository,
   * but GET /orders customer listing endpoint route is unmounted in order.routes.ts.
   */
  getCustomerOrders(options?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Observable<CustomerOrdersResponseDto> {
    const params = buildHttpParams(options ?? {});
    return this.client.getData<CustomerOrdersResponseDto>('/orders', { params });
  }
}
