import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CheckoutApi } from './checkout-api.service';
import { ApiClient } from '../base/api-client';
import type {
  AddressDto,
  CreateOrderRequestDto,
  SafeOrderResponseDto,
  ShippingEstimateResponseDto,
  ValidateCouponResponseDto,
} from '../dto/checkout.dto';

describe('CheckoutApi', () => {
  let service: CheckoutApi;
  let apiClientSpy: jasmine.SpyObj<ApiClient>;

  beforeEach(() => {
    apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', [
      'getData',
      'postData',
    ]);

    TestBed.configureTestingModule({
      providers: [
        CheckoutApi,
        { provide: ApiClient, useValue: apiClientSpy },
      ],
    });

    service = TestBed.inject(CheckoutApi);
  });

  it('should call POST /checkout/shipping-estimate and return estimate', (done) => {
    const mockEstimate: ShippingEstimateResponseDto = {
      costMinor: 4500,
      currency: 'EGP',
      serviceable: true,
      scope: 'governorate',
      pickupLocation: null,
    };
    apiClientSpy.postData.and.returnValue(of(mockEstimate));

    const req = { method: 'delivery' as const, governorate: 'Cairo' };
    service.estimateShipping(req).subscribe((res) => {
      expect(res).toEqual(mockEstimate);
      expect(apiClientSpy.postData).toHaveBeenCalledWith('/checkout/shipping-estimate', req);
      done();
    });
  });

  it('should call POST /checkout/validate-coupon and return validation', (done) => {
    const mockValidation: ValidateCouponResponseDto = {
      valid: true,
      couponId: 'coup-1',
      code: 'AZHARI10',
      discountType: 'percentage',
      value: 10,
      discountMinor: 1000,
      scopeType: 'order',
      scopeIds: [],
      appliedTo: 'order',
    };
    apiClientSpy.postData.and.returnValue(of(mockValidation));

    const req = { code: 'AZHARI10', subtotalMinor: 10000 };
    service.validateCoupon(req).subscribe((res) => {
      expect(res).toEqual(mockValidation);
      expect(apiClientSpy.postData).toHaveBeenCalledWith('/checkout/validate', req);
      done();
    });
  });

  it('should call GET /addresses and return saved addresses', (done) => {
    const mockAddresses: AddressDto[] = [
      {
        id: 'addr-1',
        recipientName: 'أحمد',
        recipientPhone: '01012345678',
        governorate: 'Qena',
        city: 'Qena',
        area: 'Central',
        street: 'Main St',
        buildingNumber: '5',
        isDefault: true,
      },
    ];
    apiClientSpy.getData.and.returnValue(of(mockAddresses));

    service.getSavedAddresses().subscribe((res) => {
      expect(res).toEqual(mockAddresses);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/addresses');
      done();
    });
  });

  it('should call POST /orders and return created order with idempotency header', (done) => {
    const mockOrder: SafeOrderResponseDto = {
      reference: 'ORD-20261010-ABCD',
      customerId: null,
      customerSnapshot: { name: 'علي', phone: '01098765432', email: null },
      items: [],
      totals: {
        productSubtotalMinor: 10000,
        shippingEstimateMinor: 4500,
        shippingFinalMinor: null,
        discountMinor: 0,
        totalMinor: 14500,
        currency: 'EGP',
      },
      fulfillment: {
        method: 'delivery',
        addressSnapshot: {
          governorate: 'Qena',
          city: 'Qena',
          area: 'Center',
          street: 'School St',
          building: '1',
          apartment: '2',
          landmark: '',
        },
        shippingStatus: 'pending',
        provider: null,
      },
      paymentMethodKey: 'cod',
      status: 'pending',
      paymentStatus: 'pending',
      couponSnapshot: null,
      submittedAt: '2026-10-10T11:00:00Z',
      acceptedAt: null,
      completedAt: null,
      cancelledAt: null,
      version: 1,
    };
    apiClientSpy.postData.and.returnValue(of(mockOrder));

    const createDto: CreateOrderRequestDto = {
      contact: { name: 'علي', phone: '01098765432' },
      fulfillment: {
        method: 'delivery',
        address: {
          governorate: 'Qena',
          city: 'Qena',
          area: 'Center',
          street: 'School St',
          building: '1',
          apartment: '2',
          landmark: '',
        },
      },
      paymentMethodKey: 'cod',
      idempotencyKey: 'idemp-xyz-123',
    };

    service.createOrder(createDto).subscribe((res) => {
      expect(res).toEqual(mockOrder);
      expect(apiClientSpy.postData).toHaveBeenCalledWith('/orders', createDto, {
        headers: { 'Idempotency-Key': 'idemp-xyz-123' },
      });
      done();
    });
  });
});
