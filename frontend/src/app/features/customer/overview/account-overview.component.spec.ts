import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AccountOverviewComponent } from './account-overview.component';
import { AccountStore } from '../../../core/account/account.store';
import { LocaleService } from '../../../core/i18n/locale.service';
import { AppConfigStore } from '../../../core/config/app-config.store';
import { createMoney } from '../../../domain/models/money.model';
import type { CustomerOrder } from '../../../domain/models/order.model';

describe('AccountOverviewComponent', () => {
  let component: AccountOverviewComponent;
  let fixture: ComponentFixture<AccountOverviewComponent>;
  let accountStoreSpy: jasmine.SpyObj<AccountStore>;
  let localeServiceSpy: jasmine.SpyObj<LocaleService>;
  let appConfigStoreSpy: jasmine.SpyObj<AppConfigStore>;
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
      'loadProfile',
      'loadOrders',
      'loadPreorders',
    ], {
      profile: signal({
        id: 'usr-1',
        name: 'أحمد محمود',
        email: 'ahmed@example.com',
        phone: '01012345678',
        role: 'customer' as const,
        status: 'active' as const,
        emailVerifiedAt: '2026-01-01',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      }),
      isLoadingProfile: signal(false),
      orders: signal([mockOrder]),
      isLoadingOrders: signal(false),
      ordersError: signal(null),
      addresses: signal([]),
      preorders: signal([]),
    });
    accountStoreSpy.loadProfile.and.returnValue(of(accountStoreSpy.profile()!));

    localeServiceSpy = jasmine.createSpyObj<LocaleService>('LocaleService', [], {
      isArabic: signal(true),
      direction: signal('rtl'),
      currentLocale: signal('ar'),
    });

    appConfigStoreSpy = jasmine.createSpyObj<AppConfigStore>('AppConfigStore', [], {
      whatsappNumber: signal('201012345678'),
    });

    await TestBed.configureTestingModule({
      imports: [AccountOverviewComponent],
      providers: [
        provideRouter([]),
        { provide: AccountStore, useValue: accountStoreSpy },
        { provide: LocaleService, useValue: localeServiceSpy },
        { provide: AppConfigStore, useValue: appConfigStoreSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(AccountOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display customer greeting', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('أحمد محمود');
  });

  it('should display recent orders list', () => {
    expect(fixture.nativeElement.textContent).toContain('ORD-20261010-ABCD');
  });

  it('should navigate to order details on direct reference lookup', () => {
    component.searchReference = 'ORD-20261010-TEST';
    component.onTrackSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/orders', 'ORD-20261010-TEST']);
  });
});
