import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CheckoutStore } from './checkout.store';
import { CheckoutApi } from '../api/commerce/checkout-api.service';
import { CartStore } from '../cart/cart.store';
import { AuthStore } from '../auth/auth.store';
import { IdempotencyKeyService } from '../util/idempotency-key.service';
import { createMoney } from '../../domain/models/money.model';
import { ApiError } from '../errors/api-error';
import { ApiErrorCodes } from '../errors/error-codes';
import type { Cart } from '../../domain/models/cart.model';
import type {
  SafeOrderResponseDto,
  ShippingEstimateResponseDto,
  ValidateCouponResponseDto,
} from '../api/dto/checkout.dto';

describe('CheckoutStore', () => {
  let store: CheckoutStore;
  let checkoutApiSpy: jasmine.SpyObj<CheckoutApi>;
  let cartStoreSpy: jasmine.SpyObj<CartStore>;
  let authStoreSpy: jasmine.SpyObj<AuthStore>;
  let idempotencySpy: jasmine.SpyObj<IdempotencyKeyService>;

  const mockCart: Cart = {
    id: 'cart-1',
    ownerType: 'guest',
    items: [],
    itemsCount: 0,
    totalQuantity: 0,
    subtotal: createMoney(20000),
    currency: 'EGP',
    version: 1,
    expiresAt: null,
  };

  beforeEach(() => {
    checkoutApiSpy = jasmine.createSpyObj<CheckoutApi>('CheckoutApi', [
      'estimateShipping',
      'validateCoupon',
      'getSavedAddresses',
      'createOrder',
      'getPaymentProofUploadConfig',
      'submitPaymentProof',
    ]);
    checkoutApiSpy.estimateShipping.and.returnValue(
      of({
        costMinor: 4000,
        currency: 'EGP',
        serviceable: true,
        scope: 'governorate',
        pickupLocation: null,
      }),
    );
    checkoutApiSpy.getSavedAddresses.and.returnValue(of([]));

    cartStoreSpy = jasmine.createSpyObj<CartStore>('CartStore', [
      'items',
      'subtotal',
      'loadCart',
    ]);
    cartStoreSpy.items.and.returnValue([]);
    cartStoreSpy.subtotal.and.returnValue(createMoney(20000));

    authStoreSpy = jasmine.createSpyObj<AuthStore>('AuthStore', [
      'isAuthenticated',
      'user',
    ]);
    authStoreSpy.isAuthenticated.and.returnValue(false);
    authStoreSpy.user.and.returnValue(null);

    idempotencySpy = jasmine.createSpyObj<IdempotencyKeyService>(
      'IdempotencyKeyService',
      ['getOrCreateKey', 'clearKey'],
    );
    idempotencySpy.getOrCreateKey.and.returnValue('key-test-123');

    TestBed.configureTestingModule({
      providers: [
        CheckoutStore,
        { provide: CheckoutApi, useValue: checkoutApiSpy },
        { provide: CartStore, useValue: cartStoreSpy },
        { provide: AuthStore, useValue: authStoreSpy },
        { provide: IdempotencyKeyService, useValue: idempotencySpy },
      ],
    });

    store = TestBed.inject(CheckoutStore);
  });

  it('should initialize checkout with step information and generate idempotency key', () => {
    store.initCheckout();
    expect(store.step()).toBe('information');
    expect(idempotencySpy.getOrCreateKey).toHaveBeenCalledWith('order_submission');
  });

  it('should validate contact and address information', () => {
    store.initCheckout();
    expect(store.isInformationValid()).toBeFalse();

    store.setContact({ name: 'أحمد محمود', phone: '01012345678' });
    store.setAddress({
      governorate: 'Cairo',
      city: 'Cairo',
      street: 'Tahrir St',
    });

    expect(store.isInformationValid()).toBeTrue();
  });

  it('should calculate free shipping on pickup fulfillment', () => {
    store.setFulfillmentMethod('pickup');
    expect(store.shippingCost().amount).toBe(0);
    expect(store.shippingEstimate()?.serviceable).toBeTrue();
  });

  it('should call estimateShipping and update shipping cost on delivery', () => {
    const mockEstimate: ShippingEstimateResponseDto = {
      costMinor: 4000,
      currency: 'EGP',
      serviceable: true,
      scope: 'governorate',
      pickupLocation: null,
    };
    checkoutApiSpy.estimateShipping.and.returnValue(of(mockEstimate));

    store.setFulfillmentMethod('delivery');
    store.setAddress({ governorate: 'Giza', city: 'Giza', street: 'Pyramids' });

    expect(checkoutApiSpy.estimateShipping).toHaveBeenCalled();
  });

  it('should apply valid coupon and discount total amount', (done) => {
    const mockValidation: ValidateCouponResponseDto = {
      valid: true,
      couponId: 'coup-1',
      code: 'AZHARI10',
      discountType: 'percentage',
      value: 10,
      discountMinor: 2000, // 20 EGP
      scopeType: 'order',
      scopeIds: [],
      appliedTo: 'order',
    };
    checkoutApiSpy.validateCoupon.and.returnValue(of(mockValidation));

    store.applyCoupon('AZHARI10').subscribe((val) => {
      expect(val).toBeDefined();
      expect(val?.valid).toBeTrue();
      expect(store.discountAmount().amount).toBe(2000);
      expect(store.totalAmount().amount).toBe(18000);
      done();
    });
  });

  it('should submit order with idempotency key and clear it on success', (done) => {
    store.initCheckout();
    store.setContact({ name: 'محمد', phone: '01011112222' });
    store.setAddress({ governorate: 'Qena', city: 'Qena', street: 'Main' });
    store.setPaymentMethod('cod');

    const mockOrder: SafeOrderResponseDto = {
      reference: 'ORD-20261010-XYZ',
      customerId: null,
      customerSnapshot: { name: 'محمد', phone: '01011112222', email: null },
      items: [],
      totals: {
        productSubtotalMinor: 20000,
        shippingEstimateMinor: 0,
        shippingFinalMinor: null,
        discountMinor: 0,
        totalMinor: 20000,
        currency: 'EGP',
      },
      fulfillment: {
        method: 'delivery',
        addressSnapshot: {
          governorate: 'Qena',
          city: 'Qena',
          area: '',
          street: 'Main',
          building: '',
          apartment: '',
          landmark: '',
        },
        shippingStatus: 'pending',
        provider: null,
      },
      paymentMethodKey: 'cod',
      status: 'pending',
      paymentStatus: 'pending',
      couponSnapshot: null,
      submittedAt: '2026-10-10T10:00:00Z',
      acceptedAt: null,
      completedAt: null,
      cancelledAt: null,
      version: 1,
    };
    checkoutApiSpy.createOrder.and.returnValue(of(mockOrder));
    cartStoreSpy.loadCart.and.returnValue(of(mockCart));

    store.submitOrder().subscribe((order) => {
      expect(order.reference).toBe('ORD-20261010-XYZ');
      expect(store.step()).toBe('confirmation');
      expect(idempotencySpy.clearKey).toHaveBeenCalledWith('order_submission');
      done();
    });
  });

  it('should handle 409 PRICE_CHANGED conflict on submit order', (done) => {
    store.initCheckout();
    store.setContact({ name: 'محمد', phone: '01011112222' });
    store.setAddress({ governorate: 'Qena', city: 'Qena', street: 'Main' });

    const priceConflict = new ApiError({
      code: ApiErrorCodes.PRICE_CHANGED,
      httpStatus: 409,
      message: 'Prices changed',
    });
    checkoutApiSpy.createOrder.and.returnValue(throwError(() => priceConflict));
    cartStoreSpy.loadCart.and.returnValue(of(mockCart));

    store.submitOrder().subscribe({
      error: () => {
        expect(store.priceChangedNotice()).toBeTruthy();
        expect(store.isSubmitting()).toBeFalse();
        done();
      },
    });
  });
});
