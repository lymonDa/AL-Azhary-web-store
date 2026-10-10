import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OrdersApi } from './orders-api.service';
import { ApiClient } from '../base/api-client';
import type { SafeCustomerPaymentResponseDto, SafeOrderResponseDto } from '../dto/checkout.dto';
import type { CustomerOrdersResponseDto } from '../dto/order.dto';

describe('OrdersApi', () => {
  let service: OrdersApi;
  let apiClientSpy: jasmine.SpyObj<ApiClient>;

  const mockOrderDto: SafeOrderResponseDto = {
    reference: 'ORD-20261010-ABCD',
    customerId: 'cust-1',
    customerSnapshot: {
      name: 'أحمد محمود',
      phone: '01012345678',
      email: 'ahmed@example.com',
    },
    items: [
      {
        productId: 'prod-1',
        variantId: null,
        nameSnapshot: { ar: 'مقدمة ابن خلدون' },
        imageSnapshot: null,
        categorySnapshot: null,
        attributesSnapshot: {},
        quantity: 1,
        unitPriceMinor: 10000,
        lineTotalMinor: 10000,
        availabilityAtSubmission: 'in_stock',
        stockItemKey: 'stock-1',
      },
    ],
    totals: {
      productSubtotalMinor: 10000,
      shippingEstimateMinor: 4000,
      shippingFinalMinor: null,
      discountMinor: 0,
      totalMinor: 14000,
      currency: 'EGP',
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

  beforeEach(() => {
    apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', [
      'getData',
      'postData',
    ]);

    TestBed.configureTestingModule({
      providers: [
        OrdersApi,
        { provide: ApiClient, useValue: apiClientSpy },
      ],
    });

    service = TestBed.inject(OrdersApi);
  });

  it('should fetch order by reference via GET /orders/:reference without guest token', (done) => {
    apiClientSpy.getData.and.returnValue(of(mockOrderDto));

    service.getOrder('ORD-20261010-ABCD').subscribe((res) => {
      expect(res).toEqual(mockOrderDto);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/orders/ORD-20261010-ABCD', { headers: undefined });
      done();
    });
  });

  it('should pass x-guest-token header when guest token is provided', (done) => {
    apiClientSpy.getData.and.returnValue(of(mockOrderDto));

    service.getOrder('ORD-20261010-ABCD', 'guest-token-123').subscribe((res) => {
      expect(res).toEqual(mockOrderDto);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/orders/ORD-20261010-ABCD', {
        headers: { 'x-guest-token': 'guest-token-123' },
      });
      done();
    });
  });

  it('should cancel order via POST /orders/:reference/cancel', (done) => {
    const cancelledOrder: SafeOrderResponseDto = {
      ...mockOrderDto,
      status: 'cancelled_by_customer',
      version: 2,
    };
    apiClientSpy.postData.and.returnValue(of(cancelledOrder));

    service.cancelOrder('ORD-20261010-ABCD', 1, 'طلب بالخطأ').subscribe((res) => {
      expect(res.status).toBe('cancelled_by_customer');
      expect(apiClientSpy.postData).toHaveBeenCalledWith(
        '/orders/ORD-20261010-ABCD/cancel',
        { expectedVersion: 1, reason: 'طلب بالخطأ' },
        { headers: undefined },
      );
      done();
    });
  });

  it('should confirm COD order via POST /orders/:reference/confirm-cod', (done) => {
    const confirmedOrder: SafeOrderResponseDto = {
      ...mockOrderDto,
      status: 'confirmed',
      version: 2,
    };
    apiClientSpy.postData.and.returnValue(of(confirmedOrder));

    service.confirmCodOrder('ORD-20261010-ABCD', 1).subscribe((res) => {
      expect(res.status).toBe('confirmed');
      expect(apiClientSpy.postData).toHaveBeenCalledWith(
        '/orders/ORD-20261010-ABCD/confirm-cod',
        { expectedVersion: 1 },
        { headers: undefined },
      );
      done();
    });
  });

  it('should fetch payment details via GET /orders/:reference/payment', (done) => {
    const mockPayment: SafeCustomerPaymentResponseDto = {
      paymentId: 'pay-1',
      ownerType: 'order',
      ownerId: 'ORD-20261010-ABCD',
      methodKey: 'instapay',
      methodSnapshot: {
        key: 'instapay',
        name: { ar: 'إنستاباي' },
        type: 'instant_payment',
        proofRequired: true,
      },
      amountDueMinor: 14000,
      currency: 'EGP',
      status: 'pending',
      proofRequired: true,
      proofSubmissionCount: 1,
      confirmedAt: null,
      rejectedAt: null,
      version: 1,
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-10T10:00:00Z',
      proofs: [],
    };
    apiClientSpy.getData.and.returnValue(of(mockPayment));

    service.getPaymentDetails('ORD-20261010-ABCD').subscribe((res) => {
      expect(res).toEqual(mockPayment);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/orders/ORD-20261010-ABCD/payment', { headers: undefined });
      done();
    });
  });

  it('should fetch customer orders via GET /orders', (done) => {
    const mockList: CustomerOrdersResponseDto = {
      items: [mockOrderDto],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    apiClientSpy.getData.and.returnValue(of(mockList));

    service.getCustomerOrders({ page: 1, limit: 20 }).subscribe((res) => {
      expect(res).toEqual(mockList);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/orders', {
        params: jasmine.anything(),
      });
      done();
    });
  });
});
