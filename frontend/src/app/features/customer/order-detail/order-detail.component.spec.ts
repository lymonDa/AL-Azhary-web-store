import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { OrderDetailComponent } from './order-detail.component';
import { OrderDetailStore } from '../../../core/orders/order-detail.store';
import { LocaleService } from '../../../core/i18n/locale.service';
import { AppConfigStore } from '../../../core/config/app-config.store';
import { ToastService } from '../../../shared/overlay/toast/toast.service';
import { createMoney } from '../../../domain/models/money.model';
import type { CustomerOrder } from '../../../domain/models/order.model';

describe('OrderDetailComponent', () => {
  let component: OrderDetailComponent;
  let fixture: ComponentFixture<OrderDetailComponent>;
  let orderDetailStoreSpy: jasmine.SpyObj<OrderDetailStore>;
  let localeServiceSpy: jasmine.SpyObj<LocaleService>;
  let appConfigStoreSpy: jasmine.SpyObj<AppConfigStore>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

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
        quantity: 1,
        lineTotal: createMoney(10000),
      },
    ],
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
    orderDetailStoreSpy = jasmine.createSpyObj<OrderDetailStore>('OrderDetailStore', [
      'loadOrder',
      'loadPaymentDetails',
      'cancelOrder',
      'confirmCodOrder',
      'getTrackingSteps',
    ], {
      order: signal(mockOrder),
      payment: signal(null),
      isLoading: signal(false),
      isCancelling: signal(false),
      isConfirmingCod: signal(false),
      error: signal(null),
      notFound: signal(false),
      forbidden: signal(false),
      conflictMessage: signal(null),
    });

    orderDetailStoreSpy.loadOrder.and.returnValue(of(mockOrder));
    orderDetailStoreSpy.getTrackingSteps.and.returnValue([
      {
        key: 'submitted',
        labelAr: 'تم إنشاء الطلب',
        labelEn: 'Order Placed',
        isCompleted: true,
        isCurrent: false,
        timestamp: '2026-10-10T09:00:00Z',
      },
      {
        key: 'review',
        labelAr: 'مراجعة الطلب وتجهيزه',
        labelEn: 'Under Review',
        isCompleted: false,
        isCurrent: true,
      },
    ]);

    localeServiceSpy = jasmine.createSpyObj<LocaleService>('LocaleService', [], {
      isArabic: signal(true),
      direction: signal('rtl'),
      currentLocale: signal('ar'),
    });

    appConfigStoreSpy = jasmine.createSpyObj<AppConfigStore>('AppConfigStore', [], {
      whatsappNumber: signal('201012345678'),
    });

    toastServiceSpy = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error', 'info', 'warning', 'show']);

    await TestBed.configureTestingModule({
      imports: [OrderDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (k: string) => (k === 'reference' ? 'ORD-20261010-ABCD' : null) }),
            snapshot: {
              paramMap: { get: (k: string) => (k === 'reference' ? 'ORD-20261010-ABCD' : null) },
              queryParamMap: { get: () => null },
            },
          },
        },
        { provide: OrderDetailStore, useValue: orderDetailStoreSpy },
        { provide: LocaleService, useValue: localeServiceSpy },
        { provide: AppConfigStore, useValue: appConfigStoreSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render order details', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('ORD-20261010-ABCD');
    expect(fixture.nativeElement.textContent).toContain('مقدمة ابن خلدون');
  });

  it('should render tracking timeline', () => {
    expect(fixture.nativeElement.textContent).toContain('تم إنشاء الطلب');
    expect(fixture.nativeElement.textContent).toContain('مراجعة الطلب وتجهيزه');
  });

  it('should open cancel confirmation modal and cancel order', () => {
    component.openCancelModal();
    expect(component.showCancelModal()).toBe(true);

    orderDetailStoreSpy.cancelOrder.and.returnValue(of({
      ...mockOrder,
      status: 'cancelled_by_customer',
    }));

    component.cancelReason = 'تغيير الرأي';
    component.onConfirmCancel();

    expect(orderDetailStoreSpy.cancelOrder).toHaveBeenCalledWith('تغيير الرأي');
    expect(component.showCancelModal()).toBe(false);
  });
});
