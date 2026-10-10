import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { CartComponent } from './cart.component';
import { CartStore } from '../../core/cart/cart.store';
import { LocaleService } from '../../core/i18n/locale.service';
import { createMoney } from '../../domain/models/money.model';
import type { Cart, CartItem } from '../../domain/models/cart.model';

describe('CartComponent', () => {
  let fixture: ComponentFixture<CartComponent>;
  let cartStoreMock: Partial<CartStore>;

  const mockItem: CartItem = {
    id: 'item-1',
    productId: 'prod-1',
    variantId: null,
    quantity: 2,
    unitPrice: createMoney(5000),
    lineTotal: createMoney(10000),
    productName: { ar: 'كتاب البلاغة', en: 'Rhetoric Book' },
    imageSnapshot: null,
    addedAt: '2026-10-10T10:00:00Z',
  };

  const mockCart: Cart = {
    id: 'cart-1',
    ownerType: 'guest',
    items: [mockItem],
    itemsCount: 1,
    totalQuantity: 2,
    subtotal: createMoney(10000),
    currency: 'EGP',
    version: 1,
    expiresAt: null,
  };

  beforeEach(async () => {
    cartStoreMock = {
      cart: signal(mockCart),
      items: signal([mockItem]),
      itemCount: signal(1),
      totalQuantity: signal(2),
      subtotal: signal(createMoney(10000)),
      version: signal(1),
      isLoading: signal(false),
      isMutating: signal(false),
      error: signal(null),
      isStale: signal(false),
      conflicts: signal([]),
      showConflictModal: signal(false),
      isEmpty: signal(false),
      loadCart: jasmine.createSpy().and.returnValue(of(mockCart)),
      addItem: jasmine.createSpy().and.returnValue(of(mockCart)),
      updateQuantity: jasmine.createSpy().and.returnValue(of(mockCart)),
      removeItem: jasmine.createSpy().and.returnValue(of(undefined)),
      clearCart: jasmine.createSpy().and.returnValue(of(undefined)),
      dismissConflict: jasmine.createSpy(),
    };

    await TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [
        provideRouter([]),
        LocaleService,
        { provide: CartStore, useValue: cartStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
  });

  it('should render items, unit price, quantity stepper, and subtotal', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.az-cart-items')).toBeTruthy();
    expect(compiled.querySelector('.az-cart-item__title')?.textContent).toContain('كتاب البلاغة');
    expect(compiled.querySelector('.az-cart-summary')).toBeTruthy();
    expect(compiled.querySelector('.az-cart-summary__val--subtotal')?.textContent).toMatch(/١٠٠|100/);
  });

  it('should open remove confirmation dialog when clicking remove button', () => {
    fixture.detectChanges();
    const removeBtn = fixture.nativeElement.querySelector('.az-cart-item__remove-btn') as HTMLButtonElement;
    removeBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.isRemoveDialogOpen()).toBeTrue();
  });

  it('should open clear confirmation dialog when clicking clear cart button', () => {
    fixture.detectChanges();
    const clearBtn = fixture.nativeElement.querySelector('.az-cart-clear-btn') as HTMLButtonElement;
    clearBtn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.isClearDialogOpen()).toBeTrue();
  });

  it('should trigger updateQuantity on stepper value change', () => {
    fixture.componentInstance.onUpdateQuantity('item-1', 4);
    expect(cartStoreMock.updateQuantity).toHaveBeenCalledWith('item-1', 4);
  });
});
