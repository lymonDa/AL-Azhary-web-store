import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { CheckoutApi } from '../api/commerce/checkout-api.service';
import { CartStore } from '../cart/cart.store';
import { AuthStore } from '../auth/auth.store';
import { IdempotencyKeyService } from '../util/idempotency-key.service';
import { ApiError } from '../errors/api-error';
import { ApiErrorCodes } from '../errors/error-codes';
import {
  mapAddressDtoToDomain,
  mapCouponValidationDtoToDomain,
  mapSafeOrderResponseDtoToDomain,
  mapShippingEstimateDtoToDomain,
} from '../api/mappers/checkout.mapper';
import { createMoney, type Money } from '../../domain/models/money.model';
import type {
  CheckoutAddress,
  CheckoutContact,
  CouponValidation,
  FulfillmentMethod,
  PaymentMethodOption,
  SavedCustomerAddress,
  ShippingEstimate,
  SubmittedOrder,
} from '../../domain/models/checkout.model';
import type {
  PaymentProofFileDto,
  ShippingEstimateRequestDto,
  SignedUploadConfigDto,
} from '../api/dto/checkout.dto';

export type CheckoutStep =
  | 'information'
  | 'payment'
  | 'review'
  | 'confirmation';

export const SUPPORTED_PAYMENT_METHODS: readonly PaymentMethodOption[] = [
  {
    key: 'cod',
    name: {
      ar: 'الدفع عند الاستلام',
      en: 'Cash on Delivery (COD)',
    },
    type: 'cash_on_delivery',
    proofRequired: false,
    instructions: {
      ar: 'يتم سداد المبلغ نقداً لمندوب الشحن عند استلام الطلب.',
      en: 'Pay in cash to the delivery representative upon receiving your order.',
    },
  },
  {
    key: 'instapay',
    name: {
      ar: 'إنستاباي (InstaPay)',
      en: 'InstaPay',
    },
    type: 'instant_payment',
    proofRequired: true,
    instructions: {
      ar: 'قم بالتحويل عبر تطبيق إنستاباي إلى العنوان: alazhari@instapay ثم ارفع صورة إيصال التحويل.',
      en: 'Transfer via InstaPay to: alazhari@instapay then upload screenshot of the receipt.',
    },
    details: {
      ipa: 'alazhari@instapay',
    },
  },
  {
    key: 'vodafone_cash',
    name: {
      ar: 'فودافون كاش',
      en: 'Vodafone Cash',
    },
    type: 'digital_wallet',
    proofRequired: true,
    instructions: {
      ar: 'قم بتحويل المبلغ إلى رقم فودافون كاش الخاص بالمكتبة ثم ارفع صورة إيصال التحويل.',
      en: 'Transfer to library Vodafone Cash number then upload screenshot of the receipt.',
    },
  },
  {
    key: 'orange_cash',
    name: {
      ar: 'أورنج كاش',
      en: 'Orange Cash',
    },
    type: 'digital_wallet',
    proofRequired: true,
    instructions: {
      ar: 'قم بتحويل المبلغ إلى محفظة أورنج كاش الخاصة بالمكتبة ثم ارفع صورة إيصال التحويل.',
      en: 'Transfer to library Orange Cash wallet then upload screenshot of the receipt.',
    },
  },
  {
    key: 'etisalat_cash',
    name: {
      ar: 'اتصالات كاش',
      en: 'Etisalat Cash',
    },
    type: 'digital_wallet',
    proofRequired: true,
    instructions: {
      ar: 'قم بتحويل المبلغ إلى محفظة اتصالات كاش الخاصة بالمكتبة ثم ارفع صورة إيصال التحويل.',
      en: 'Transfer to library Etisalat Cash wallet then upload screenshot of the receipt.',
    },
  },
  {
    key: 'we_pay',
    name: {
      ar: 'وي باي (WE Pay)',
      en: 'WE Pay',
    },
    type: 'digital_wallet',
    proofRequired: true,
    instructions: {
      ar: 'قم بتحويل المبلغ إلى محفظة WE Pay الخاصة بالمكتبة ثم ارفع صورة إيصال التحويل.',
      en: 'Transfer to library WE Pay wallet then upload screenshot of the receipt.',
    },
  },
];

interface CheckoutStoreState {
  readonly step: CheckoutStep;
  readonly contact: CheckoutContact;
  readonly fulfillmentMethod: FulfillmentMethod;
  readonly address: CheckoutAddress;
  readonly savedAddresses: SavedCustomerAddress[];
  readonly selectedAddressId: string | null;
  readonly shippingEstimate: ShippingEstimate | null;
  readonly shippingLoading: boolean;
  readonly shippingError: string | null;
  readonly paymentMethodKey: string;
  readonly couponCode: string;
  readonly appliedCoupon: CouponValidation | null;
  readonly couponLoading: boolean;
  readonly couponError: string | null;
  readonly isSubmitting: boolean;
  readonly submitError: string | null;
  readonly submittedOrder: SubmittedOrder | null;
  readonly idempotencyKey: string;
  readonly proofUploadConfig: SignedUploadConfigDto | null;
  readonly proofUploading: boolean;
  readonly proofSubmitted: boolean;
  readonly proofError: string | null;
  readonly priceChangedNotice: string | null;
  readonly availabilityConflictNotice: string | null;
}

const INITIAL_STATE: CheckoutStoreState = {
  step: 'information',
  contact: { name: '', phone: '', email: '' },
  fulfillmentMethod: 'delivery',
  address: {
    governorate: 'Qena',
    city: 'Qena',
    area: '',
    street: '',
    building: '',
    apartment: '',
    landmark: '',
  },
  savedAddresses: [],
  selectedAddressId: null,
  shippingEstimate: null,
  shippingLoading: false,
  shippingError: null,
  paymentMethodKey: 'cod',
  couponCode: '',
  appliedCoupon: null,
  couponLoading: false,
  couponError: null,
  isSubmitting: false,
  submitError: null,
  submittedOrder: null,
  idempotencyKey: '',
  proofUploadConfig: null,
  proofUploading: false,
  proofSubmitted: false,
  proofError: null,
  priceChangedNotice: null,
  availabilityConflictNotice: null,
};

@Injectable({
  providedIn: 'root',
})
export class CheckoutStore {
  private readonly checkoutApi = inject(CheckoutApi);
  private readonly cartStore = inject(CartStore);
  private readonly authStore = inject(AuthStore);
  private readonly idempotencyService = inject(IdempotencyKeyService);

  private readonly stateSignal = signal<CheckoutStoreState>(INITIAL_STATE);

  readonly state = this.stateSignal.asReadonly();
  readonly step = computed(() => this.stateSignal().step);
  readonly contact = computed(() => this.stateSignal().contact);
  readonly fulfillmentMethod = computed(() => this.stateSignal().fulfillmentMethod);
  readonly address = computed(() => this.stateSignal().address);
  readonly savedAddresses = computed(() => this.stateSignal().savedAddresses);
  readonly selectedAddressId = computed(() => this.stateSignal().selectedAddressId);
  readonly shippingEstimate = computed(() => this.stateSignal().shippingEstimate);
  readonly shippingLoading = computed(() => this.stateSignal().shippingLoading);
  readonly shippingError = computed(() => this.stateSignal().shippingError);
  readonly paymentMethodKey = computed(() => this.stateSignal().paymentMethodKey);
  readonly couponCode = computed(() => this.stateSignal().couponCode);
  readonly appliedCoupon = computed(() => this.stateSignal().appliedCoupon);
  readonly couponLoading = computed(() => this.stateSignal().couponLoading);
  readonly couponError = computed(() => this.stateSignal().couponError);
  readonly isSubmitting = computed(() => this.stateSignal().isSubmitting);
  readonly submitError = computed(() => this.stateSignal().submitError);
  readonly submittedOrder = computed(() => this.stateSignal().submittedOrder);
  readonly proofUploadConfig = computed(() => this.stateSignal().proofUploadConfig);
  readonly proofUploading = computed(() => this.stateSignal().proofUploading);
  readonly proofSubmitted = computed(() => this.stateSignal().proofSubmitted);
  readonly proofError = computed(() => this.stateSignal().proofError);
  readonly priceChangedNotice = computed(() => this.stateSignal().priceChangedNotice);
  readonly availabilityConflictNotice = computed(() => this.stateSignal().availabilityConflictNotice);

  readonly items = computed(() => this.cartStore.items());
  readonly itemsSubtotal = computed(() => this.cartStore.subtotal());

  readonly shippingCost = computed<Money>(() => {
    if (this.fulfillmentMethod() === 'pickup') {
      return createMoney(0);
    }
    const estimate = this.shippingEstimate();
    return estimate ? estimate.cost : createMoney(0);
  });

  readonly discountAmount = computed<Money>(() => {
    const coupon = this.appliedCoupon();
    return coupon ? coupon.discountAmount : createMoney(0);
  });

  readonly totalAmount = computed<Money>(() => {
    const sub = this.itemsSubtotal().amount;
    const disc = this.discountAmount().amount;
    const ship = this.shippingCost().amount;
    const finalAmount = Math.max(0, sub - disc + ship);
    return createMoney(finalAmount);
  });

  readonly selectedPaymentMethod = computed<PaymentMethodOption>(() => {
    const key = this.paymentMethodKey();
    const found = SUPPORTED_PAYMENT_METHODS.find((m) => m.key === key);
    return found ?? SUPPORTED_PAYMENT_METHODS[0]!;
  });

  readonly isInformationValid = computed(() => {
    const c = this.contact();
    const isContactValid = c.name.trim().length >= 2 && c.phone.trim().length >= 8;
    if (this.fulfillmentMethod() === 'pickup') {
      return isContactValid;
    }
    const a = this.address();
    return (
      isContactValid &&
      a.governorate.trim().length > 0 &&
      a.city.trim().length > 0 &&
      a.street.trim().length > 0
    );
  });

  /**
   * Initializes checkout state, loads customer profile if authenticated,
   * generates checkout idempotency key, and fetches initial shipping estimate.
   */
  initCheckout(): void {
    const user = this.authStore.user();
    const contact: CheckoutContact = {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      email: user?.email ?? '',
    };

    const actionScope = 'order_submission';
    const idempotencyKey = this.idempotencyService.getOrCreateKey(actionScope);

    this.stateSignal.set({
      ...INITIAL_STATE,
      contact,
      idempotencyKey,
    });

    if (this.authStore.isAuthenticated()) {
      this.loadSavedAddresses();
    }

    this.calculateShippingEstimate();
  }

  setStep(step: CheckoutStep): void {
    this.stateSignal.update((s) => ({ ...s, step }));
  }

  setContact(partial: Partial<CheckoutContact>): void {
    this.stateSignal.update((s) => ({
      ...s,
      contact: { ...s.contact, ...partial },
    }));
  }

  setFulfillmentMethod(method: FulfillmentMethod): void {
    this.stateSignal.update((s) => ({ ...s, fulfillmentMethod: method }));
    this.calculateShippingEstimate();
  }

  setAddress(partial: Partial<CheckoutAddress>): void {
    this.stateSignal.update((s) => ({
      ...s,
      selectedAddressId: null,
      address: { ...s.address, ...partial },
    }));
    this.calculateShippingEstimate();
  }

  selectSavedAddress(addressId: string): void {
    const found = this.savedAddresses().find((a) => a.id === addressId);
    if (!found) {
      return;
    }

    const updatedAddress: CheckoutAddress = {
      governorate: found.governorate,
      city: found.city,
      area: found.area || '',
      street: found.street,
      building: found.buildingNumber || '',
      apartment: found.apartment || '',
      landmark: found.landmark || '',
    };

    this.stateSignal.update((s) => ({
      ...s,
      selectedAddressId: addressId,
      address: updatedAddress,
      contact: {
        ...s.contact,
        name: found.recipientName || s.contact.name,
        phone: found.recipientPhone || s.contact.phone,
      },
    }));

    this.calculateShippingEstimate();
  }

  setPaymentMethod(key: string): void {
    this.stateSignal.update((s) => ({ ...s, paymentMethodKey: key }));
  }

  setCouponCode(code: string): void {
    this.stateSignal.update((s) => ({ ...s, couponCode: code, couponError: null }));
  }

  /**
   * Calculates shipping estimate based on current fulfillment method and address.
   */
  calculateShippingEstimate(): void {
    const method = this.fulfillmentMethod();
    if (method === 'pickup') {
      this.stateSignal.update((s) => ({
        ...s,
        shippingEstimate: {
          cost: createMoney(0),
          currency: 'EGP',
          serviceable: true,
          scope: 'pickup',
          pickupLocation: {
            ar: 'مكتبة الأزهري - قنا',
            en: 'Al-Azhary Library - Qena',
            address: 'شارع المحطة، بجوار مسجد سيدي عبد الرحيم القنائي، قنا، مصر',
          },
        },
        shippingLoading: false,
        shippingError: null,
      }));
      return;
    }

    const addr = this.address();
    if (!addr.governorate) {
      return;
    }

    this.stateSignal.update((s) => ({
      ...s,
      shippingLoading: true,
      shippingError: null,
    }));

    const payload: ShippingEstimateRequestDto = {
      method: 'delivery',
      governorate: addr.governorate,
      ...(addr.city ? { city: addr.city } : {}),
      ...(addr.area ? { area: addr.area } : {}),
    };

    this.checkoutApi
      .estimateShipping(payload)
      .pipe(
        map((dto) => mapShippingEstimateDtoToDomain(dto)),
        tap((estimate) => {
          this.stateSignal.update((s) => ({
            ...s,
            shippingEstimate: estimate,
            shippingLoading: false,
            shippingError: null,
          }));
        }),
        catchError((err: unknown) => {
          const message =
            ApiError.isApiError(err) && err.message
              ? err.message
              : 'خدمة التوصيل غير متوفرة حالياً لهذه المنطقة.';
          this.stateSignal.update((s) => ({
            ...s,
            shippingLoading: false,
            shippingError: message,
          }));
          return of(null);
        }),
      )
      .subscribe();
  }

  /**
   * Validates and applies a coupon code.
   */
  applyCoupon(couponCode?: string): Observable<CouponValidation | null> {
    if (couponCode !== undefined) {
      this.stateSignal.update((s) => ({ ...s, couponCode }));
    }
    const code = (couponCode ?? this.couponCode()).trim();
    if (!code) {
      this.stateSignal.update((s) => ({
        ...s,
        couponError: 'يرجى إدخال كود الخصم.',
      }));
      return of(null);
    }

    this.stateSignal.update((s) => ({
      ...s,
      couponLoading: true,
      couponError: null,
    }));

    return this.checkoutApi
      .validateCoupon({
        code,
        subtotalMinor: this.itemsSubtotal().amount,
      })
      .pipe(
        map((dto) => mapCouponValidationDtoToDomain(dto)),
        tap((validation) => {
          this.stateSignal.update((s) => ({
            ...s,
            appliedCoupon: validation,
            couponLoading: false,
            couponError: null,
          }));
        }),
        catchError((err: unknown) => {
          const message =
            ApiError.isApiError(err) && err.message
              ? err.message
              : 'كود الخصم غير صالح أو منتهي الصلاحية.';
          this.stateSignal.update((s) => ({
            ...s,
            couponLoading: false,
            couponError: message,
          }));
          return of(null);
        }),
      );
  }

  removeCoupon(): void {
    this.stateSignal.update((s) => ({
      ...s,
      couponCode: '',
      appliedCoupon: null,
      couponError: null,
    }));
  }

  /**
   * Submits the order with the current cart, contact, fulfillment, and payment selections.
   * Handles price changes and availability conflicts without silent modifications.
   */
  submitOrder(): Observable<SubmittedOrder> {
    this.stateSignal.update((s) => ({
      ...s,
      isSubmitting: true,
      submitError: null,
      priceChangedNotice: null,
      availabilityConflictNotice: null,
    }));

    const state = this.stateSignal();
    const idempotencyKey = state.idempotencyKey;

    const payload = {
      contact: {
        name: state.contact.name.trim(),
        phone: state.contact.phone.trim(),
        email: state.contact.email.trim() ? state.contact.email.trim() : null,
      },
      fulfillment: {
        method: state.fulfillmentMethod,
        address:
          state.fulfillmentMethod === 'delivery'
            ? {
                governorate: state.address.governorate.trim(),
                city: state.address.city.trim(),
                area: state.address.area.trim() || null,
                street: state.address.street.trim(),
                building: state.address.building.trim() || null,
                apartment: state.address.apartment.trim() || null,
                landmark: state.address.landmark.trim() || null,
              }
            : null,
      },
      paymentMethodKey: state.paymentMethodKey,
      couponCode: state.appliedCoupon ? state.appliedCoupon.code : null,
      idempotencyKey,
    };

    return this.checkoutApi.createOrder(payload).pipe(
      map((dto) => mapSafeOrderResponseDtoToDomain(dto)),
      tap((order) => {
        // Order placed successfully: clear idempotency key
        this.idempotencyService.clearKey('order_submission');

        this.stateSignal.update((s) => ({
          ...s,
          isSubmitting: false,
          submittedOrder: order,
          step: 'confirmation',
          submitError: null,
        }));

        // Cart is cleared server-side upon order creation; update local cart
        this.cartStore.loadCart().subscribe();
      }),
      catchError((err: unknown) => {
        this.handleSubmitError(err);
        return throwError(() => err);
      }),
    );
  }

  /**
   * Fetches signed Cloudinary upload config for payment proof.
   */
  loadPaymentProofConfig(): Observable<SignedUploadConfigDto> {
    const order = this.submittedOrder();
    if (!order) {
      return throwError(() => new Error('No active submitted order found.'));
    }

    return this.checkoutApi
      .getPaymentProofUploadConfig(order.reference, order.guestAccessToken)
      .pipe(
        tap((config) => {
          this.stateSignal.update((s) => ({ ...s, proofUploadConfig: config }));
        }),
      );
  }

  /**
   * Submits uploaded payment proof file metadata.
   */
  submitPaymentProof(
    file: PaymentProofFileDto,
    customerNote?: string,
  ): Observable<void> {
    const order = this.submittedOrder();
    if (!order) {
      return throwError(() => new Error('No active submitted order found.'));
    }

    this.stateSignal.update((s) => ({
      ...s,
      proofUploading: true,
      proofError: null,
    }));

    return this.checkoutApi
      .submitPaymentProof(
        order.reference,
        {
          files: [file],
          customerNote: customerNote || null,
        },
        order.guestAccessToken,
      )
      .pipe(
        tap(() => {
          this.stateSignal.update((s) => ({
            ...s,
            proofUploading: false,
            proofSubmitted: true,
            proofError: null,
          }));
        }),
        map(() => undefined),
        catchError((err: unknown) => {
          const message =
            ApiError.isApiError(err) && err.message
              ? err.message
              : 'فشل إرسال إيصال الدفع. يرجى إعادة المحاولة.';
          this.stateSignal.update((s) => ({
            ...s,
            proofUploading: false,
            proofError: message,
          }));
          return throwError(() => err);
        }),
      );
  }

  /**
   * Uploads payment proof file.
   */
  uploadPaymentProof(file: File): Observable<void> {
    const order = this.submittedOrder();
    if (!order) {
      return throwError(() => new Error('No active submitted order found.'));
    }

    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const format = (['png', 'jpeg', 'jpg', 'webp'].includes(ext) ? ext : 'png') as
      | 'png'
      | 'jpeg'
      | 'jpg'
      | 'webp';

    const proofFile: PaymentProofFileDto = {
      cloudinaryPublicId: `payment_proofs/${order.reference}_${Date.now()}`,
      resourceType: 'image',
      format,
      bytes: file.size,
    };

    return this.submitPaymentProof(proofFile);
  }

  dismissConflictNotices(): void {
    this.stateSignal.update((s) => ({
      ...s,
      priceChangedNotice: null,
      availabilityConflictNotice: null,
    }));
  }

  dismissNotices(): void {
    this.dismissConflictNotices();
  }

  private loadSavedAddresses(): void {
    this.checkoutApi
      .getSavedAddresses()
      .pipe(
        map((dtos) => dtos.map(mapAddressDtoToDomain)),
        tap((addresses) => {
          this.stateSignal.update((s) => ({ ...s, savedAddresses: addresses }));

          // Automatically select default address if available
          const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
          if (defaultAddr && !this.stateSignal().address.street) {
            this.selectSavedAddress(defaultAddr.id);
          }
        }),
        catchError(() => of([])),
      )
      .subscribe();
  }

  private handleSubmitError(err: unknown): void {
    if (ApiError.isApiError(err)) {
      if (err.code === ApiErrorCodes.PRICE_CHANGED) {
        this.stateSignal.update((s) => ({
          ...s,
          isSubmitting: false,
          priceChangedNotice:
            'تغيرت أسعار بعض المنتجات في السلة أثناء إتمام الطلب. يرجى مراجعة الأسعار المحدثة.',
          submitError: 'تم تحديث الأسعار، يرجى المراجعة والمتابعة.',
        }));
        this.cartStore.loadCart().subscribe();
        return;
      }

      if (err.code === ApiErrorCodes.AVAILABILITY_CHANGED) {
        this.stateSignal.update((s) => ({
          ...s,
          isSubmitting: false,
          availabilityConflictNotice:
            'بعض المنتجات في السلة نفدت من المخزون أو لم تعد متاحة للشراء.',
          submitError: 'تعذر إتمام الطلب نظراً لتغير توفر بعض المنتجات.',
        }));
        this.cartStore.loadCart().subscribe();
        return;
      }

      if (err.code === ApiErrorCodes.CART_EMPTY) {
        this.stateSignal.update((s) => ({
          ...s,
          isSubmitting: false,
          submitError: 'السلة فارغة. يرجى إضافة كتب إلى السلة أولاً.',
        }));
        return;
      }

      if (err.message) {
        this.stateSignal.update((s) => ({
          ...s,
          isSubmitting: false,
          submitError: err.message,
        }));
        return;
      }
    }

    this.stateSignal.update((s) => ({
      ...s,
      isSubmitting: false,
      submitError: 'فشل إرسال الطلب بسبب خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
    }));
  }
}
