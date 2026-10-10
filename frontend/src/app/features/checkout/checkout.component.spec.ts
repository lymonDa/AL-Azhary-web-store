import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { CheckoutComponent } from './checkout.component';
import { CheckoutStore, SUPPORTED_PAYMENT_METHODS } from '../../core/checkout/checkout.store';
import { CartStore } from '../../core/cart/cart.store';
import { LocaleService } from '../../core/i18n/locale.service';
import { createMoney } from '../../domain/models/money.model';
import type { Cart } from '../../domain/models/cart.model';
import type { SubmittedOrder } from '../../domain/models/checkout.model';

describe('CheckoutComponent', () => {
  let fixture: ComponentFixture<CheckoutComponent>;
  let checkoutStoreMock: Partial<CheckoutStore>;
  let cartStoreMock: Partial<CartStore>;

  const mockOrder: SubmittedOrder = {
    reference: 'ORD-20261010-CONF',
    customerId: null,
    customerSnapshot: { name: 'عمر', phone: '01012345678', email: null },
    items: [],
    totals: {
      productSubtotal: createMoney(150),
      shippingEstimate: createMoney(40),
      shippingFinal: null,
      discount: createMoney(0),
      total: createMoney(190),
    },
    fulfillment: {
      method: 'delivery',
      addressSnapshot: null,
      shippingStatus: 'pending',
      provider: null,
    },
    paymentMethodKey: 'instapay',
    status: 'pending',
    paymentStatus: 'pending',
    couponSnapshot: null,
    submittedAt: '2026-10-10T10:00:00Z',
  };

  const mockCart: Cart = {
    id: 'cart-1',
    ownerType: 'guest',
    items: [],
    itemsCount: 0,
    totalQuantity: 0,
    subtotal: createMoney(150),
    currency: 'EGP',
    version: 1,
    expiresAt: null,
  };

  beforeEach(async () => {
    checkoutStoreMock = {
      step: signal('information'),
      contact: signal({ name: 'عمر', phone: '01012345678', email: '' }),
      fulfillmentMethod: signal('delivery'),
      address: signal({
        governorate: 'Qena',
        city: 'Qena',
        area: '',
        street: 'Main',
        building: '',
        apartment: '',
        landmark: '',
      }),
      savedAddresses: signal([]),
      selectedAddressId: signal(null),
      shippingEstimate: signal({
        cost: createMoney(40),
        currency: 'EGP',
        serviceable: true,
        scope: 'governorate',
        pickupLocation: null,
      }),
      shippingLoading: signal(false),
      shippingError: signal(null),
      paymentMethodKey: signal('instapay'),
      selectedPaymentMethod: signal(SUPPORTED_PAYMENT_METHODS[1]!),
      couponCode: signal(''),
      appliedCoupon: signal(null),
      couponLoading: signal(false),
      couponError: signal(null),
      isSubmitting: signal(false),
      submitError: signal(null),
      submittedOrder: signal(mockOrder),
      proofUploadConfig: signal(null),
      proofUploading: signal(false),
      proofSubmitted: signal(false),
      proofError: signal(null),
      priceChangedNotice: signal(null),
      availabilityConflictNotice: signal(null),
      items: signal([]),
      itemsSubtotal: signal(createMoney(150)),
      shippingCost: signal(createMoney(40)),
      discountAmount: signal(createMoney(0)),
      totalAmount: signal(createMoney(190)),
      isInformationValid: signal(true),
      initCheckout: jasmine.createSpy(),
      setStep: jasmine.createSpy(),
      setContact: jasmine.createSpy(),
      setFulfillmentMethod: jasmine.createSpy(),
      setAddress: jasmine.createSpy(),
      setPaymentMethod: jasmine.createSpy(),
      setCouponCode: jasmine.createSpy(),
      applyCoupon: jasmine.createSpy().and.returnValue(of(null)),
      removeCoupon: jasmine.createSpy(),
      submitOrder: jasmine.createSpy().and.returnValue(of(mockOrder)),
      uploadPaymentProof: jasmine.createSpy().and.returnValue(of(undefined)),
      dismissNotices: jasmine.createSpy(),
    };

    cartStoreMock = {
      cart: signal(mockCart),
      isEmpty: signal(false),
      loadCart: jasmine.createSpy().and.returnValue(of(mockCart)),
    };

    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideRouter([]),
        LocaleService,
        { provide: CheckoutStore, useValue: checkoutStoreMock },
        { provide: CartStore, useValue: cartStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
  });

  it('should render step wizard and step 1 information form', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.az-checkout-steps')).toBeTruthy();
    expect(compiled.querySelector('.az-checkout-card')).toBeTruthy();
    expect(compiled.querySelector('.az-fulfillment-options')).toBeTruthy();
    expect(compiled.querySelector('.az-checkout-totals-card')).toBeTruthy();
  });

  it('should switch fulfillment method when toggle clicked', () => {
    fixture.componentInstance.onSelectFulfillment('pickup');
    expect(checkoutStoreMock.setFulfillmentMethod).toHaveBeenCalledWith('pickup');
  });

  it('should navigate between wizard steps', () => {
    fixture.componentInstance.onGoToStep('payment');
    expect(checkoutStoreMock.setStep).toHaveBeenCalledWith('payment');
  });

  it('should trigger order submission', () => {
    fixture.componentInstance.onSubmitOrder();
    expect(checkoutStoreMock.submitOrder).toHaveBeenCalled();
  });
});
