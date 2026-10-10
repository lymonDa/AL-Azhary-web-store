import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../base/api-client';
import type {
  AddressDto,
  CreateOrderRequestDto,
  SafeCustomerPaymentResponseDto,
  SafeOrderResponseDto,
  ShippingEstimateRequestDto,
  ShippingEstimateResponseDto,
  SignedUploadConfigDto,
  SubmitPaymentProofRequestDto,
  ValidateCouponRequestDto,
  ValidateCouponResponseDto,
} from '../dto/checkout.dto';

@Injectable({
  providedIn: 'root',
})
export class CheckoutApi {
  private readonly client = inject(ApiClient);

  /**
   * Estimates shipping cost and serviceability before order placement.
   */
  estimateShipping(
    dto: ShippingEstimateRequestDto,
  ): Observable<ShippingEstimateResponseDto> {
    return this.client.postData<ShippingEstimateResponseDto>(
      '/checkout/shipping-estimate',
      dto,
    );
  }

  /**
   * Validates coupon code and calculates discount amount.
   */
  validateCoupon(
    dto: ValidateCouponRequestDto,
  ): Observable<ValidateCouponResponseDto> {
    return this.client.postData<ValidateCouponResponseDto>(
      '/checkout/validate',
      dto,
    );
  }

  /**
   * Submits order created from current cart.
   * Server validates catalog availability, prices, coupon, and idempotency key.
   */
  createOrder(dto: CreateOrderRequestDto): Observable<SafeOrderResponseDto> {
    const headers: Record<string, string> = {
      'Idempotency-Key': dto.idempotencyKey,
    };
    return this.client.postData<SafeOrderResponseDto>('/orders', dto, {
      headers,
    });
  }

  /**
   * Retrieves saved addresses for authenticated customer.
   */
  getSavedAddresses(): Observable<AddressDto[]> {
    return this.client.getData<AddressDto[]>('/addresses');
  }

  /**
   * Retrieves payment status, method snapshot, and proofs for an order.
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
   * Obtains signed Cloudinary direct-upload config for payment proof screenshot.
   */
  getPaymentProofUploadConfig(
    reference: string,
    guestToken?: string,
  ): Observable<SignedUploadConfigDto> {
    const headers = guestToken ? { 'x-guest-token': guestToken } : undefined;
    return this.client.postData<SignedUploadConfigDto>(
      `/orders/${encodeURIComponent(reference)}/payment-proof/upload-config`,
      {},
      { headers },
    );
  }

  /**
   * Submits uploaded Cloudinary payment proof metadata.
   */
  submitPaymentProof(
    reference: string,
    dto: SubmitPaymentProofRequestDto,
    guestToken?: string,
  ): Observable<SafeCustomerPaymentResponseDto> {
    const headers: Record<string, string> = {};
    if (guestToken) {
      headers['x-guest-token'] = guestToken;
    }
    if (dto.idempotencyKey) {
      headers['Idempotency-Key'] = dto.idempotencyKey;
    }

    return this.client.postData<SafeCustomerPaymentResponseDto>(
      `/orders/${encodeURIComponent(reference)}/payment-proofs`,
      dto,
      { headers: Object.keys(headers).length > 0 ? headers : undefined },
    );
  }
}
