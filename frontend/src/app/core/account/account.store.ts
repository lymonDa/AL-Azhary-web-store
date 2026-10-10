import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { CustomerApi } from '../api/account/customer-api.service';
import { OrdersApi } from '../api/commerce/orders-api.service';
import { PreordersApi } from '../api/commerce/preorders-api.service';
import { ReturnsApi } from '../api/commerce/returns-api.service';
import { mapCustomerAddress, mapUserProfile } from '../api/mappers/customer.mapper';
import { mapSafeOrderToCustomerOrder } from '../api/mappers/order.mapper';
import { mapSafePreorderToDomain } from '../api/mappers/preorder.mapper';
import { mapSafeReturnRequestToDomain } from '../api/mappers/returns.mapper';
import type {
  CreateAddressRequestDto,
  UpdateAddressRequestDto,
  UpdateProfileRequestDto,
} from '../api/dto/customer.dto';
import type { CustomerAddress, CustomerProfile } from '../../domain/models/customer.model';
import type { CustomerOrder } from '../../domain/models/order.model';
import type { CustomerPreorder } from '../../domain/models/preorder.model';
import type { CustomerReturnRequest } from '../../domain/models/return.model';

@Injectable({
  providedIn: 'root',
})
export class AccountStore {
  private readonly customerApi = inject(CustomerApi);
  private readonly ordersApi = inject(OrdersApi);
  private readonly preordersApi = inject(PreordersApi);
  private readonly returnsApi = inject(ReturnsApi);

  readonly profile = signal<CustomerProfile | null>(null);
  readonly addresses = signal<CustomerAddress[]>([]);
  readonly orders = signal<CustomerOrder[]>([]);
  readonly preorders = signal<CustomerPreorder[]>([]);
  readonly returns = signal<CustomerReturnRequest[]>([]);

  readonly isLoadingProfile = signal<boolean>(false);
  readonly isLoadingAddresses = signal<boolean>(false);
  readonly isLoadingOrders = signal<boolean>(false);
  readonly isLoadingPreorders = signal<boolean>(false);
  readonly isLoadingReturns = signal<boolean>(false);

  readonly profileError = signal<string | null>(null);
  readonly addressesError = signal<string | null>(null);
  readonly ordersError = signal<string | null>(null);

  loadProfile(): Observable<CustomerProfile> {
    this.isLoadingProfile.set(true);
    this.profileError.set(null);

    return this.customerApi.getProfile().pipe(
      tap({
        next: (dto) => {
          const mapped = mapUserProfile(dto);
          this.profile.set(mapped);
          this.isLoadingProfile.set(false);
        },
        error: (err) => {
          this.profileError.set(err?.message || 'Failed to load profile');
          this.isLoadingProfile.set(false);
        },
      }),
    ) as unknown as Observable<CustomerProfile>;
  }

  updateProfile(dto: UpdateProfileRequestDto): Observable<CustomerProfile> {
    this.isLoadingProfile.set(true);
    this.profileError.set(null);

    return this.customerApi.updateProfile(dto).pipe(
      tap({
        next: (updatedDto) => {
          const mapped = mapUserProfile(updatedDto);
          this.profile.set(mapped);
          this.isLoadingProfile.set(false);
        },
        error: (err) => {
          this.profileError.set(err?.message || 'Failed to update profile');
          this.isLoadingProfile.set(false);
        },
      }),
    ) as unknown as Observable<CustomerProfile>;
  }

  loadAddresses(): Observable<CustomerAddress[]> {
    this.isLoadingAddresses.set(true);
    this.addressesError.set(null);

    return this.customerApi.getAddresses().pipe(
      tap({
        next: (dtos) => {
          const mapped = (dtos ?? []).map(mapCustomerAddress);
          this.addresses.set(mapped);
          this.isLoadingAddresses.set(false);
        },
        error: (err) => {
          this.addressesError.set(err?.message || 'Failed to load addresses');
          this.isLoadingAddresses.set(false);
        },
      }),
    ) as unknown as Observable<CustomerAddress[]>;
  }

  createAddress(dto: CreateAddressRequestDto): Observable<CustomerAddress> {
    return this.customerApi.createAddress(dto).pipe(
      tap({
        next: (created) => {
          const mapped = mapCustomerAddress(created);
          // If created address is default, reset others
          if (mapped.isDefault) {
            this.addresses.update((list) =>
              list.map((a) => ({ ...a, isDefault: false })).concat(mapped),
            );
          } else {
            this.addresses.update((list) => [...list, mapped]);
          }
        },
      }),
    ) as unknown as Observable<CustomerAddress>;
  }

  updateAddress(id: string, dto: UpdateAddressRequestDto): Observable<CustomerAddress> {
    return this.customerApi.updateAddress(id, dto).pipe(
      tap({
        next: (updated) => {
          const mapped = mapCustomerAddress(updated);
          this.addresses.update((list) =>
            list.map((a) => {
              if (a.id === id) return mapped;
              if (mapped.isDefault) return { ...a, isDefault: false };
              return a;
            }),
          );
        },
      }),
    ) as unknown as Observable<CustomerAddress>;
  }

  deleteAddress(id: string): Observable<void> {
    return this.customerApi.deleteAddress(id).pipe(
      tap({
        next: () => {
          this.addresses.update((list) => list.filter((a) => a.id !== id));
        },
      }),
    );
  }

  setDefaultAddress(id: string): Observable<CustomerAddress> {
    return this.customerApi.setDefaultAddress(id).pipe(
      tap({
        next: (updated) => {
          const mapped = mapCustomerAddress(updated);
          this.addresses.update((list) =>
            list.map((a) => (a.id === id ? mapped : { ...a, isDefault: false })),
          );
        },
      }),
    ) as unknown as Observable<CustomerAddress>;
  }

  loadOrders(): void {
    this.isLoadingOrders.set(true);
    this.ordersError.set(null);

    this.ordersApi.getCustomerOrders().pipe(
      tap({
        next: (response) => {
          const mapped = (response.items ?? []).map(mapSafeOrderToCustomerOrder);
          this.orders.set(mapped);
          this.isLoadingOrders.set(false);
        },
        error: (err) => {
          // If endpoint is unmounted on backend (Contract to verify), record note but don't crash
          this.ordersError.set(err?.message || 'Failed to load orders');
          this.isLoadingOrders.set(false);
        },
      }),
      catchError((err) => {
        this.isLoadingOrders.set(false);
        return throwError(() => err);
      }),
    ).subscribe();
  }

  loadPreorders(): void {
    this.isLoadingPreorders.set(true);

    this.preordersApi.getPreorders().pipe(
      tap({
        next: (res) => {
          const mapped = (res.preorders ?? []).map(mapSafePreorderToDomain);
          this.preorders.set(mapped);
          this.isLoadingPreorders.set(false);
        },
        error: () => {
          this.isLoadingPreorders.set(false);
        },
      }),
    ).subscribe();
  }

  loadReturns(): void {
    this.isLoadingReturns.set(true);

    this.returnsApi.getReturns().pipe(
      tap({
        next: (res) => {
          const mapped = (res.returns ?? []).map(mapSafeReturnRequestToDomain);
          this.returns.set(mapped);
          this.isLoadingReturns.set(false);
        },
        error: () => {
          this.isLoadingReturns.set(false);
        },
      }),
    ).subscribe();
  }
}
