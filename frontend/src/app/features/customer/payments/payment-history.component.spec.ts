import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { PaymentHistoryComponent } from './payment-history.component';
import { AccountStore } from '../../../core/account/account.store';
import { LocaleService } from '../../../core/i18n/locale.service';
import { createMoney } from '../../../domain/models/money.model';
import type { CustomerOrder } from '../../../domain/models/order.model';

describe('PaymentHistoryComponent', () => {
  let component: PaymentHistoryComponent;
  let fixture: ComponentFixture<PaymentHistoryComponent>;
  let accountStoreSpy: jasmine.SpyObj<AccountStore>;
  let localeServiceSpy: jasmine.SpyObj<LocaleService>;

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
    });

    localeServiceSpy = jasmine.createSpyObj<LocaleService>('LocaleService', [], {
      isArabic: signal(true),
      direction: signal('rtl'),
      currentLocale: signal('ar'),
    });

    await TestBed.configureTestingModule({
      imports: [PaymentHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: AccountStore, useValue: accountStoreSpy },
        { provide: LocaleService, useValue: localeServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render payment transactions list', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('ORD-20261010-ABCD');
  });
});
