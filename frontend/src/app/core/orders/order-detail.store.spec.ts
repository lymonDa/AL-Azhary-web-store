import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { OrderDetailStore } from './order-detail.store';
import { OrdersApi } from '../api/commerce/orders-api.service';
import { ApiError } from '../errors/api-error';
import { ApiErrorCodes } from '../errors/error-codes';
import type { SafeCustomerPaymentResponseDto, SafeOrderResponseDto } from '../api/dto/checkout.dto';

describe('OrderDetailStore', () => {
  let store: OrderDetailStore;
  let ordersApiSpy: jasmine.SpyObj<OrdersApi>;

  const mockOrderDto: SafeOrderResponseDto = {
    reference: 'ORD-20261010-ABCD',
    customerId: 'cust-1',
    customerSnapshot: { name: 'أحمد', phone: '01012345678', email: null },
    items: [
      {
        productId: 'prod-1',
        variantId: null,
        nameSnapshot: { ar: 'مقدمة ابن خلدون' },
        imageSnapshot: null,
        categorySnapshot: null,
        attributesSnapshot: {},
        quantity: 2,
        unitPriceMinor: 5000,
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

  const mockPaymentDto: SafeCustomerPaymentResponseDto = {
    paymentId: 'pay-1',
    ownerType: 'order',
    ownerId: 'ORD-20261010-ABCD',
    methodKey: 'cash_on_delivery',
    methodSnapshot: {
      key: 'cash_on_delivery',
      name: { ar: 'الدفع عند الاستلام' },
      type: 'cash_on_delivery',
      proofRequired: false,
    },
    amountDueMinor: 14000,
    currency: 'EGP',
    status: 'pending',
    proofRequired: false,
    proofSubmissionCount: 0,
    confirmedAt: null,
    rejectedAt: null,
    version: 1,
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
    proofs: [],
  };

  beforeEach(() => {
    ordersApiSpy = jasmine.createSpyObj<OrdersApi>('OrdersApi', [
      'getOrder',
      'cancelOrder',
      'confirmCodOrder',
      'getPaymentDetails',
    ]);

    ordersApiSpy.getOrder.and.returnValue(of(mockOrderDto));
    ordersApiSpy.getPaymentDetails.and.returnValue(of(mockPaymentDto));

    TestBed.configureTestingModule({
      providers: [
        OrderDetailStore,
        { provide: OrdersApi, useValue: ordersApiSpy },
      ],
    });

    store = TestBed.inject(OrderDetailStore);
  });

  it('should load order and expose correct status', (done) => {
    store.loadOrder('ORD-20261010-ABCD').subscribe({
      next: (order) => {
        expect(order).not.toBeNull();
        expect(order.reference).toBe('ORD-20261010-ABCD');
        expect(order.status).toBe('pending_review');
        done();
      },
    });
  });

  it('should compute getTrackingSteps correctly', (done) => {
    store.loadOrder('ORD-20261010-ABCD').subscribe({
      next: () => {
        const steps = store.getTrackingSteps();
        expect(steps.length).toBeGreaterThan(0);
        expect(steps[0]?.key).toBe('submitted');
        expect(steps[0]?.isCompleted).toBe(true);
        done();
      },
    });
  });

  it('should cancel order with version and reason', (done) => {
    store.loadOrder('ORD-20261010-ABCD').subscribe(() => {
      const cancelledDto: SafeOrderResponseDto = {
        ...mockOrderDto,
        status: 'cancelled_by_customer',
        version: 2,
      };
      ordersApiSpy.cancelOrder.and.returnValue(of(cancelledDto));

      store.cancelOrder('سبب شخصي').subscribe({
        next: (order) => {
          expect(order.status).toBe('cancelled_by_customer');
          expect(ordersApiSpy.cancelOrder).toHaveBeenCalledWith(
            'ORD-20261010-ABCD',
            1,
            'سبب شخصي',
            undefined,
          );
          done();
        },
      });
    });
  });

  it('should refresh order on 409 ORDER_STATE_CONFLICT error during cancel', (done) => {
    store.loadOrder('ORD-20261010-ABCD').subscribe(() => {
      const conflictError = new ApiError({
        httpStatus: 409,
        code: ApiErrorCodes.ORDER_STATE_CONFLICT,
        message: 'Order was updated concurrently',
      });
      ordersApiSpy.cancelOrder.and.returnValue(throwError(() => conflictError));

      const refreshedDto: SafeOrderResponseDto = {
        ...mockOrderDto,
        status: 'accepted',
        version: 2,
      };
      ordersApiSpy.getOrder.and.returnValue(of(refreshedDto));

      store.cancelOrder('سبب شخصي').subscribe({
        error: (err) => {
          expect(err.code).toBe(ApiErrorCodes.ORDER_STATE_CONFLICT);
          expect(ordersApiSpy.getOrder).toHaveBeenCalled();
          done();
        },
      });
    });
  });

  it('should confirm COD order when order is in customer_confirmation_required state', (done) => {
    const codOrderDto: SafeOrderResponseDto = {
      ...mockOrderDto,
      status: 'customer_confirmation_required',
    };
    ordersApiSpy.getOrder.and.returnValue(of(codOrderDto));

    store.loadOrder('ORD-20261010-ABCD').subscribe(() => {
      const confirmedDto: SafeOrderResponseDto = {
        ...codOrderDto,
        status: 'confirmed',
        version: 2,
      };
      ordersApiSpy.confirmCodOrder.and.returnValue(of(confirmedDto));

      store.confirmCodOrder().subscribe({
        next: (order) => {
          expect(order.status).toBe('confirmed');
          expect(ordersApiSpy.confirmCodOrder).toHaveBeenCalledWith(
            'ORD-20261010-ABCD',
            1,
            undefined,
          );
          done();
        },
      });
    });
  });
});
