import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { CartApi } from '../api/commerce/cart-api.service';
import { GuestSessionService } from './guest-session.service';
import { AuthStore } from '../auth/auth.store';
import { ApiError } from '../errors/api-error';
import { ApiErrorCodes } from '../errors/error-codes';
import {
  mapCartDtoToDomain,
  mapCartMergeConflictDtoToDomain,
} from '../api/mappers/cart.mapper';
import { createMoney } from '../../domain/models/money.model';
import type {
  Cart,
  CartItem,
  CartMergeConflict,
} from '../../domain/models/cart.model';
import type {
  AddCartItemDto,
  CartDto,
  MergeCartDto,
} from '../api/dto/cart.dto';

interface CartStoreState {
  readonly cart: Cart | null;
  readonly isLoading: boolean;
  readonly isMutating: boolean;
  readonly error: string | null;
  readonly isStale: boolean;
  readonly conflicts: CartMergeConflict[];
  readonly showConflictModal: boolean;
}

const INITIAL_STATE: CartStoreState = {
  cart: null,
  isLoading: false,
  isMutating: false,
  error: null,
  isStale: false,
  conflicts: [],
  showConflictModal: false,
};

@Injectable({
  providedIn: 'root',
})
export class CartStore {
  private readonly cartApi = inject(CartApi);
  private readonly guestSession = inject(GuestSessionService);
  private readonly authStore = inject(AuthStore);

  private readonly stateSignal = signal<CartStoreState>(INITIAL_STATE);

  readonly state = this.stateSignal.asReadonly();
  readonly cart = computed(() => this.stateSignal().cart);
  readonly items = computed<CartItem[]>(() => this.cart()?.items ?? []);
  readonly itemCount = computed(() => this.cart()?.itemsCount ?? 0);
  readonly totalQuantity = computed(() => this.cart()?.totalQuantity ?? 0);
  readonly subtotal = computed(() => this.cart()?.subtotal ?? createMoney(0));
  readonly version = computed(() => this.cart()?.version ?? 0);
  readonly isLoading = computed(() => this.stateSignal().isLoading);
  readonly isMutating = computed(() => this.stateSignal().isMutating);
  readonly error = computed(() => this.stateSignal().error);
  readonly isStale = computed(() => this.stateSignal().isStale);
  readonly conflicts = computed(() => this.stateSignal().conflicts);
  readonly showConflictModal = computed(() => this.stateSignal().showConflictModal);
  readonly isEmpty = computed(() => (this.cart()?.itemsCount ?? 0) === 0);

  private previousAuthStatus: string | null = null;

  constructor() {
    // Automatically observe auth transitions to perform guest cart merge or refresh
    effect(() => {
      const authStatus = this.authStore.status();
      if (this.previousAuthStatus === null) {
        this.previousAuthStatus = authStatus;
        return;
      }

      if (this.previousAuthStatus !== 'authenticated' && authStatus === 'authenticated') {
        // User logged in: attempt cart merge if guest session exists
        if (this.guestSession.hasActiveSession()) {
          const guestSessionId = this.guestSession.getSessionId();
          if (guestSessionId) {
            this.mergeGuestCart(guestSessionId).subscribe({
              error: () => {
                // If merge conflicts or error occur, state is already updated in mergeGuestCart
              },
            });
          }
        } else {
          // No guest session, just reload user's cart
          this.loadCart().subscribe();
        }
      } else if (this.previousAuthStatus === 'authenticated' && authStatus === 'anonymous') {
        // User logged out: clear stored cart and load fresh guest cart
        this.stateSignal.update((s) => ({ ...s, cart: null, isStale: false, conflicts: [] }));
        this.loadCart().subscribe();
      }

      this.previousAuthStatus = authStatus;
    });
  }

  /**
   * Loads current active cart from server.
   */
  loadCart(): Observable<Cart> {
    this.stateSignal.update((s) => ({ ...s, isLoading: true, error: null }));

    return this.cartApi.getCart().pipe(
      map((dto: CartDto) => mapCartDtoToDomain(dto)),
      tap((cart: Cart) => {
        this.stateSignal.update((s) => ({
          ...s,
          cart,
          isLoading: false,
          isStale: false,
          error: null,
        }));
      }),
      catchError((err: unknown) => {
        const errorMsg = this.resolveErrorMessage(err);
        this.stateSignal.update((s) => ({
          ...s,
          isLoading: false,
          error: errorMsg,
        }));
        return throwError(() => err);
      }),
    );
  }

  /**
   * Adds an item to the cart or increments line quantity.
   */
  addItem(
    productId: string,
    variantId?: string | null,
    quantity = 1,
  ): Observable<Cart> {
    this.stateSignal.update((s) => ({ ...s, isMutating: true, error: null }));
    const currentVersion = this.version() > 0 ? this.version() : undefined;

    const payload: AddCartItemDto = {
      productId,
      quantity,
      ...(variantId ? { variantId } : {}),
      ...(currentVersion !== undefined ? { expectedVersion: currentVersion } : {}),
    };

    return this.cartApi
      .addItem(payload)
      .pipe(
        map((dto: CartDto) => mapCartDtoToDomain(dto)),
        tap((cart: Cart) => {
          this.stateSignal.update((s) => ({
            ...s,
            cart,
            isMutating: false,
            isStale: false,
            error: null,
          }));
        }),
        catchError((err: unknown) => {
          this.handleMutationError(err);
          return throwError(() => err);
        }),
      );
  }

  /**
   * Updates line quantity with optimistic version check.
   */
  updateQuantity(itemId: string, quantity: number): Observable<Cart> {
    this.stateSignal.update((s) => ({ ...s, isMutating: true, error: null }));
    const expectedVersion = this.version();

    return this.cartApi
      .updateItem(itemId, {
        quantity,
        expectedVersion,
      })
      .pipe(
        map((dto: CartDto) => mapCartDtoToDomain(dto)),
        tap((cart: Cart) => {
          this.stateSignal.update((s) => ({
            ...s,
            cart,
            isMutating: false,
            isStale: false,
            error: null,
          }));
        }),
        catchError((err: unknown) => {
          this.handleMutationError(err);
          return throwError(() => err);
        }),
      );
  }

  /**
   * Removes an item from the cart.
   */
  removeItem(itemId: string): Observable<void> {
    this.stateSignal.update((s) => ({ ...s, isMutating: true, error: null }));
    const expectedVersion = this.version();

    return this.cartApi.removeItem(itemId, expectedVersion).pipe(
      tap(() => {
        // Optimistically remove item locally and bump local version
        const currentCart = this.cart();
        if (currentCart) {
          const remainingItems = currentCart.items.filter((it) => it.id !== itemId);
          const newTotalQty = remainingItems.reduce((acc, it) => acc + it.quantity, 0);
          const newSubtotalMinor = remainingItems.reduce(
            (acc, it) => acc + it.unitPrice.amount * it.quantity,
            0,
          );
          const updatedCart: Cart = {
            ...currentCart,
            items: remainingItems,
            itemsCount: remainingItems.length,
            totalQuantity: newTotalQty,
            subtotal: createMoney(newSubtotalMinor),
            version: currentCart.version + 1,
          };
          this.stateSignal.update((s) => ({
            ...s,
            cart: updatedCart,
            isMutating: false,
            error: null,
          }));
        } else {
          this.stateSignal.update((s) => ({ ...s, isMutating: false }));
        }
      }),
      catchError((err: unknown) => {
        this.handleMutationError(err);
        return throwError(() => err);
      }),
    );
  }

  /**
   * Clears all items in the cart.
   */
  clearCart(): Observable<void> {
    const currentItems = this.items();
    const first = currentItems[0];
    if (!first) {
      return of(undefined);
    }

    this.stateSignal.update((s) => ({ ...s, isMutating: true, error: null }));

    return this.cartApi
      .removeItem(first.id, this.version())
      .pipe(
        tap(() => {
          this.loadCart().subscribe();
        }),
        map(() => undefined),
        catchError((err: unknown) => {
          this.handleMutationError(err);
          return throwError(() => err);
        }),
      );
  }

  /**
   * Merges guest cart into authenticated customer account.
   */
  mergeGuestCart(sessionId?: string): Observable<Cart> {
    this.stateSignal.update((s) => ({ ...s, isMutating: true, error: null }));
    const sid = sessionId ?? this.guestSession.getSessionId();
    const expectedUserCartVersion = this.version() > 0 ? this.version() : undefined;

    const payload: MergeCartDto = {
      ...(sid ? { sessionId: sid } : {}),
      ...(expectedUserCartVersion !== undefined ? { expectedUserCartVersion } : {}),
    };

    return this.cartApi
      .mergeCart(payload)
      .pipe(
        map((res) => {
          const cart = mapCartDtoToDomain(res.cart);
          const conflicts = (res.conflicts ?? []).map(mapCartMergeConflictDtoToDomain);
          return { cart, conflicts };
        }),
        tap(({ cart, conflicts }) => {
          this.guestSession.clearSessionId();
          this.stateSignal.update((s) => ({
            ...s,
            cart,
            conflicts,
            showConflictModal: conflicts.length > 0,
            isMutating: false,
            isStale: false,
            error: null,
          }));
        }),
        map(({ cart }) => cart),
        catchError((err: unknown) => {
          if (ApiError.isApiError(err) && err.code === ApiErrorCodes.CART_MERGE_CONFLICT) {
            const rawConflicts =
              (err.details as { conflicts?: Parameters<typeof mapCartMergeConflictDtoToDomain>[0][] })?.conflicts ?? [];
            const mappedConflicts = rawConflicts.map(mapCartMergeConflictDtoToDomain);

            this.stateSignal.update((s) => ({
              ...s,
              conflicts: mappedConflicts,
              showConflictModal: true,
              isMutating: false,
              error: 'بعض العناصر في السلة تعذر دمجها تلقائياً بسبب تغيير في الأسعار أو التوفر.',
            }));
            // Still reload the user's current cart to keep UI updated
            this.loadCart().subscribe();
          } else {
            this.handleMutationError(err);
          }
          return throwError(() => err);
        }),
      );
  }

  dismissConflicts(): void {
    this.stateSignal.update((s) => ({ ...s, showConflictModal: false }));
  }

  dismissConflict(): void {
    this.dismissConflicts();
  }

  clearError(): void {
    this.stateSignal.update((s) => ({ ...s, error: null }));
  }

  private handleMutationError(err: unknown): void {
    if (ApiError.isApiError(err) && err.code === ApiErrorCodes.CART_VERSION_CONFLICT) {
      this.stateSignal.update((s) => ({
        ...s,
        isMutating: false,
        isStale: true,
        error: 'تم تعديل السلة في جلسة أخرى. يرجى تحديث الصفحة لمشاهدة أحدث البيانات.',
      }));
    } else {
      const errorMsg = this.resolveErrorMessage(err);
      this.stateSignal.update((s) => ({
        ...s,
        isMutating: false,
        error: errorMsg,
      }));
    }
  }

  private resolveErrorMessage(err: unknown): string {
    if (ApiError.isApiError(err)) {
      if (err.code === ApiErrorCodes.PRODUCT_NOT_PURCHASABLE) {
        return 'المنتج غير متاح للشراء حالياً.';
      }
      if (err.code === ApiErrorCodes.PRODUCT_NOT_FOUND) {
        return 'المنتج غير موجود في الكتالوج.';
      }
      if (err.code === ApiErrorCodes.VARIANT_REQUIRED) {
        return 'يرجى تحديد النوع أو الحجم المطلوب لهذا المنتج.';
      }
      if (err.code === ApiErrorCodes.VARIANT_NOT_PURCHASABLE) {
        return 'الخيار المحدد غير متوفر حالياً.';
      }
      if (err.code === ApiErrorCodes.INVALID_QUANTITY) {
        return 'الكمية المدخلة غير صحيحة.';
      }
      if (err.message) {
        return err.message;
      }
    }
    return 'حدث خطأ أثناء تحديث السلة. يرجى المحاولة مرة أخرى.';
  }
}
