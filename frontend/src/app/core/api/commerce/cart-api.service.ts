import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../base/api-client';
import type {
  AddCartItemDto,
  CartDto,
  CartMergeResultDto,
  MergeCartDto,
  UpdateCartItemDto,
} from '../dto/cart.dto';

@Injectable({
  providedIn: 'root',
})
export class CartApi {
  private readonly client = inject(ApiClient);

  /**
   * Retrieves active cart for authenticated user or guest session.
   */
  getCart(): Observable<CartDto> {
    return this.client.getData<CartDto>('/cart');
  }

  /**
   * Adds an item to the cart or increments existing line quantity.
   */
  addItem(dto: AddCartItemDto): Observable<CartDto> {
    return this.client.postData<CartDto>('/cart/items', dto);
  }

  /**
   * Updates item quantity with optimistic version check.
   */
  updateItem(itemId: string, dto: UpdateCartItemDto): Observable<CartDto> {
    return this.client.patchData<CartDto>(
      `/cart/items/${encodeURIComponent(itemId)}`,
      dto,
    );
  }

  /**
   * Removes an item from the cart idempotently with optimistic version check.
   */
  removeItem(itemId: string, expectedVersion?: number): Observable<void> {
    const params =
      expectedVersion !== undefined
        ? { expectedVersion: String(expectedVersion) }
        : undefined;

    return this.client.deleteData<void>(
      `/cart/items/${encodeURIComponent(itemId)}`,
      { params },
    );
  }

  /**
   * Merges guest cart into registered user cart upon authentication.
   */
  mergeCart(dto: MergeCartDto): Observable<CartMergeResultDto> {
    return this.client.postData<CartMergeResultDto>('/cart/merge', dto);
  }
}
