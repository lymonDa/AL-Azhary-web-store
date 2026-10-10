import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CartStore } from './cart.store';
import { CartApi } from '../api/commerce/cart-api.service';
import { GuestSessionService } from './guest-session.service';
import { AuthStore } from '../auth/auth.store';
import { ApiError } from '../errors/api-error';
import { ApiErrorCodes } from '../errors/error-codes';
import type { CartDto, CartMergeResultDto } from '../api/dto/cart.dto';

describe('CartStore', () => {
  let store: CartStore;
  let cartApiSpy: jasmine.SpyObj<CartApi>;
  let guestSessionSpy: jasmine.SpyObj<GuestSessionService>;
  let authStoreSpy: jasmine.SpyObj<AuthStore>;

  const mockCartDto: CartDto = {
    id: 'cart-1',
    ownerType: 'guest',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        variantId: null,
        quantity: 2,
        unitPriceMinor: 5000,
        productNameSnapshot: { ar: 'كتاب الفقه', en: 'Fiqh Book' },
        imageSnapshot: 'https://example.com/img.jpg',
        addedAt: '2026-10-10T10:00:00Z',
      },
    ],
    itemsCount: 1,
    totalQuantity: 2,
    subtotalMinor: 10000,
    currency: 'EGP',
    version: 1,
  };

  beforeEach(() => {
    cartApiSpy = jasmine.createSpyObj<CartApi>('CartApi', [
      'getCart',
      'addItem',
      'updateItem',
      'removeItem',
      'mergeCart',
    ]);

    guestSessionSpy = jasmine.createSpyObj<GuestSessionService>(
      'GuestSessionService',
      [
        'hasActiveSession',
        'getSessionId',
        'getOrCreateSessionId',
        'setSessionId',
        'clearSessionId',
      ],
    );

    authStoreSpy = jasmine.createSpyObj<AuthStore>('AuthStore', [
      'isAuthenticated',
      'status',
      'user',
    ]);
    authStoreSpy.status.and.returnValue('anonymous');

    TestBed.configureTestingModule({
      providers: [
        CartStore,
        { provide: CartApi, useValue: cartApiSpy },
        { provide: GuestSessionService, useValue: guestSessionSpy },
        { provide: AuthStore, useValue: authStoreSpy },
      ],
    });

    store = TestBed.inject(CartStore);
  });

  it('should load cart successfully', (done) => {
    cartApiSpy.getCart.and.returnValue(of(mockCartDto));

    store.loadCart().subscribe((cart) => {
      expect(cart.itemsCount).toBe(1);
      expect(store.itemCount()).toBe(1);
      expect(store.totalQuantity()).toBe(2);
      expect(store.subtotal().amount).toBe(10000);
      expect(store.isLoading()).toBeFalse();
      expect(store.error()).toBeNull();
      done();
    });
  });

  it('should add item and update cart state', (done) => {
    const updatedCartDto: CartDto = {
      ...mockCartDto,
      itemsCount: 2,
      totalQuantity: 3,
      version: 2,
    };
    cartApiSpy.addItem.and.returnValue(of(updatedCartDto));

    store.addItem('prod-2', null, 1).subscribe((cart) => {
      expect(cart.version).toBe(2);
      expect(store.totalQuantity()).toBe(3);
      expect(store.isMutating()).toBeFalse();
      done();
    });
  });

  it('should update item quantity and refresh state', (done) => {
    const updatedCartDto: CartDto = {
      ...mockCartDto,
      totalQuantity: 5,
      version: 2,
    };
    cartApiSpy.updateItem.and.returnValue(of(updatedCartDto));

    store.updateQuantity('item-1', 5).subscribe((cart) => {
      expect(cart.totalQuantity).toBe(5);
      expect(store.totalQuantity()).toBe(5);
      done();
    });
  });

  it('should remove item and optimistically update state', (done) => {
    cartApiSpy.getCart.and.returnValue(of(mockCartDto));
    cartApiSpy.removeItem.and.returnValue(of(void 0));

    // First load cart
    store.loadCart().subscribe(() => {
      expect(store.items().length).toBe(1);

      // Now remove item
      store.removeItem('item-1').subscribe(() => {
        expect(store.items().length).toBe(0);
        expect(store.totalQuantity()).toBe(0);
        expect(store.isEmpty()).toBeTrue();
        done();
      });
    });
  });

  it('should mark cart as stale when 409 CART_VERSION_CONFLICT occurs', (done) => {
    const conflictError = new ApiError({
      code: ApiErrorCodes.CART_VERSION_CONFLICT,
      httpStatus: 409,
      message: 'Cart version conflict',
    });

    cartApiSpy.updateItem.and.returnValue(throwError(() => conflictError));
    cartApiSpy.getCart.and.returnValue(of(mockCartDto));

    store.updateQuantity('item-1', 10).subscribe({
      error: () => {
        expect(store.isStale()).toBeTrue();
        expect(store.isMutating()).toBeFalse();
        done();
      },
    });
  });

  it('should merge guest cart and show conflict modal if conflicts exist', (done) => {
    const mergeResult: CartMergeResultDto = {
      cart: mockCartDto,
      conflicts: [
        {
          productId: 'prod-1',
          variantId: null,
          reason: 'QUANTITY_INVALID' as const,
          message: 'Quantity adjusted to stock',
        },
      ],
    };
    cartApiSpy.mergeCart.and.returnValue(of(mergeResult));

    store.mergeGuestCart('sess-123').subscribe((cart) => {
      expect(cart).toBeDefined();
      expect(store.conflicts().length).toBe(1);
      expect(store.showConflictModal()).toBeTrue();
      expect(guestSessionSpy.clearSessionId).toHaveBeenCalled();

      // Dismiss modal
      store.dismissConflict();
      expect(store.showConflictModal()).toBeFalse();
      done();
    });
  });
});
