import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { OrderReturnComponent } from './order-return.component';
import { OrderDetailStore } from '../../../core/orders/order-detail.store';
import { ReturnsApi } from '../../../core/api/commerce/returns-api.service';
import { LocaleService } from '../../../core/i18n/locale.service';
import { ToastService } from '../../../shared/overlay/toast/toast.service';
import { createMoney } from '../../../domain/models/money.model';
import type { CustomerOrder } from '../../../domain/models/order.model';
import type { SafeReturnRequestDto } from '../../../core/api/dto/returns.dto';

describe('OrderReturnComponent', () => {
  let component: OrderReturnComponent;
  let fixture: ComponentFixture<OrderReturnComponent>;
  let orderDetailStoreSpy: jasmine.SpyObj<OrderDetailStore>;
  let returnsApiSpy: jasmine.SpyObj<ReturnsApi>;
  let localeServiceSpy: jasmine.SpyObj<LocaleService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  const mockOrder: CustomerOrder = {
    reference: 'ORD-20261010-ABCD',
    customerId: 'cust-1',
    customerSnapshot: { name: 'أحمد', phone: '01012345678', email: null },
    items: [
      {
        productId: 'prod-1',
        variantId: null,
        name: { ar: 'مقدمة ابن خلدون', en: 'Muqaddimah' },
        imageSnapshot: null,
        unitPrice: createMoney(10000),
        quantity: 2,
        lineTotal: createMoney(20000),
      },
    ],
    totals: {
      productSubtotal: createMoney(20000),
      shippingEstimate: createMoney(4000),
      shippingFinal: null,
      discount: createMoney(0),
      total: createMoney(24000),
    },
    fulfillment: {
      method: 'delivery',
      addressSnapshot: null,
      shippingStatus: 'delivered',
      provider: null,
    },
    paymentMethodKey: 'cash_on_delivery',
    status: 'completed',
    paymentStatus: 'paid',
    couponSnapshot: null,
    submittedAt: '2026-10-10T09:00:00Z',
    acceptedAt: null,
    completedAt: '2026-10-10T12:00:00Z',
    cancelledAt: null,
    version: 1,
  };

  const mockReturnDto: SafeReturnRequestDto = {
    reference: 'RET-001',
    orderReference: 'ORD-20261010-ABCD',
    status: 'requested',
    customerNote: 'تلف بسيط',
    items: [
      {
        orderItemId: 'prod-1',
        quantity: 1,
        reason: 'damaged_item',
      },
    ],
    totalRefundAmountMinor: 10000,
    currency: 'EGP',
    version: 1,
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
  };

  beforeEach(async () => {
    orderDetailStoreSpy = jasmine.createSpyObj<OrderDetailStore>('OrderDetailStore', ['loadOrder'], {
      order: signal<CustomerOrder | null>(mockOrder),
      isLoading: signal(false),
    });
    orderDetailStoreSpy.loadOrder.and.returnValue(of(mockOrder));

    returnsApiSpy = jasmine.createSpyObj<ReturnsApi>('ReturnsApi', ['createReturn']);
    returnsApiSpy.createReturn.and.returnValue(of({ returnRequest: mockReturnDto }));

    localeServiceSpy = jasmine.createSpyObj<LocaleService>('LocaleService', [], {
      isArabic: signal(true),
      direction: signal('rtl'),
      currentLocale: signal('ar'),
    });

    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'info', 'warning', 'show']);

    await TestBed.configureTestingModule({
      imports: [OrderReturnComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (k: string) => (k === 'reference' ? 'ORD-20261010-ABCD' : null) }),
            snapshot: {
              paramMap: { get: (k: string) => (k === 'reference' ? 'ORD-20261010-ABCD' : null) },
            },
          },
        },
        { provide: OrderDetailStore, useValue: orderDetailStoreSpy },
        { provide: ReturnsApi, useValue: returnsApiSpy },
        { provide: LocaleService, useValue: localeServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(OrderReturnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display order reference and items', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('ORD-20261010-ABCD');
    expect(fixture.nativeElement.textContent).toContain('مقدمة ابن خلدون');
  });

  it('should submit return request and navigate to /account/returns', () => {
    component.form.patchValue({
      orderItemId: 'prod-1',
      quantity: 1,
      reason: 'damaged_item',
      customerNote: 'تلف بسيط',
    });

    component.onSubmit();

    expect(returnsApiSpy.createReturn).toHaveBeenCalledWith('ORD-20261010-ABCD', {
      items: [
        {
          orderItemId: 'prod-1',
          quantity: 1,
          reason: 'damaged_item',
        },
      ],
      customerNote: 'تلف بسيط',
    });
    expect(toastServiceSpy.success).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/account/returns']);
  });
});
