import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../base/api-client';
import type { AddressDto } from '../dto/checkout.dto';
import type {
  CreateAddressRequestDto,
  UpdateAddressRequestDto,
  UpdateProfileRequestDto,
  UserProfileDto,
} from '../dto/customer.dto';

@Injectable({
  providedIn: 'root',
})
export class CustomerApi {
  private readonly client = inject(ApiClient);

  /**
   * Retrieves authenticated customer profile (GET /api/v1/me).
   */
  getProfile(): Observable<UserProfileDto> {
    return this.client.getData<UserProfileDto>('/me');
  }

  /**
   * Updates authenticated customer profile name/phone (PATCH /api/v1/me).
   */
  updateProfile(dto: UpdateProfileRequestDto): Observable<UserProfileDto> {
    return this.client.patchData<UserProfileDto>('/me', dto);
  }

  /**
   * Lists customer shipping addresses (GET /api/v1/addresses).
   */
  getAddresses(): Observable<AddressDto[]> {
    return this.client.getData<AddressDto[]>('/addresses');
  }

  /**
   * Retrieves single address by ID (GET /api/v1/addresses/:id).
   */
  getAddress(id: string): Observable<AddressDto> {
    return this.client.getData<AddressDto>(`/addresses/${encodeURIComponent(id)}`);
  }

  /**
   * Creates new customer address (POST /api/v1/addresses).
   */
  createAddress(dto: CreateAddressRequestDto): Observable<AddressDto> {
    return this.client.postData<AddressDto>('/addresses', dto);
  }

  /**
   * Updates existing customer address (PATCH /api/v1/addresses/:id).
   */
  updateAddress(id: string, dto: UpdateAddressRequestDto): Observable<AddressDto> {
    return this.client.patchData<AddressDto>(`/addresses/${encodeURIComponent(id)}`, dto);
  }

  /**
   * Deletes customer address (DELETE /api/v1/addresses/:id).
   */
  deleteAddress(id: string): Observable<void> {
    return this.client.deleteData<void>(`/addresses/${encodeURIComponent(id)}`);
  }

  /**
   * Sets default address by setting isDefault: true (PATCH /api/v1/addresses/:id).
   */
  setDefaultAddress(id: string): Observable<AddressDto> {
    return this.client.patchData<AddressDto>(`/addresses/${encodeURIComponent(id)}`, {
      isDefault: true,
    });
  }
}
