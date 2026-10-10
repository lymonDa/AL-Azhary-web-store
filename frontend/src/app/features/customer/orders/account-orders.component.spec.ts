import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { AccountOrdersComponent } from './account-orders.component';
import { AccountStore } from '../../../core/account/account.store';
import { LocaleService } from '../../../core/i18n/locale.service';
import { createMoney } from '../../../domain/models/money.model';
import type { CustomerOrder } from '../../../domain/models/order.model';

describe('AccountOrdersComponent', () => {
  let component: AccountOrdersComponent;
  let fixture: ComponentFixture<AccountOrdersComponent>;
  let accountStoreSpy: jasmine.SpyObj<AccountStore>;
  let localeServiceSpy: jasmine.SpyObj<LocaleService>;
  let router: Router;

  const mockOrder: CustomerOrder = {
    reference: 'ORD-20261010-ABCD',
    customerId: 'cust-1',
    customerSnapshot: { name: 'أحمد', phone: '01012345678', email: null },
    items: [],
    totals: {
      productSubtotal: createMoney(10000),
      shippingEstimate: createMoney(4000),
      shippingFinal: null,
      discount: createMoney(0),
      total: createMoney(14000),
    },
    fulfillment: {
      method: 'delivery',
      addressSnapshot: null,
      shippingStatus: 'not_shipped',
      provider: null,
    },
    paymentMethodKey: 'cash_on_delivery',
    status: 'pending_review',
    paymentStatus: 'pending',
    couponSnapshot: null,
    submittedAt: '2026-10-10T09:00:00Z',
    acceptedAt: null,
    completedAt: null,
    cancelledAt: null,
    version: 1,
  };

  beforeEach(async () => {
    accountStoreSpy = jasmine.createSpyObj<AccountStore>('AccountStore', [
      'loadOrders',
    ], {
      orders: signal([mockOrder]),
      isLoadingOrders: signal(false),
      ordersError: signal(null),
    });

    localeServiceSpy = jasmine.createSpyObj<LocaleService>('LocaleService', [], {
      isArabic: signal(true),
      direction: signal('rtl'),
      currentLocale: signal('ar'),
    });

    await TestBed.configureTestingModule({
      imports: [AccountOrdersComponent],
      providers: [
        provideRouter([]),
        { provide: AccountStore, useValue: accountStoreSpy },
        { provide: LocaleService, useValue: localeServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(AccountOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render orders list', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('ORD-20261010-ABCD');
  });

  it('should navigate to order details on direct reference lookup', () => {
    component.searchQuery = 'ORD-20261010-SEARCH';
    component.onSearchSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/orders', 'ORD-20261010-SEARCH']);
  });
});
