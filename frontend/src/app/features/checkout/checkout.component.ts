import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CheckoutStore,
  SUPPORTED_PAYMENT_METHODS,
  type CheckoutStep,
} from '../../core/checkout/checkout.store';
import { CartStore } from '../../core/cart/cart.store';
import { LocaleService } from '../../core/i18n/locale.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { FormFieldComponent } from '../../shared/forms/form-field/form-field.component';
import { TextInputComponent } from '../../shared/forms/input/text-input.component';
import {
  SelectComponent,
  type SelectOption,
} from '../../shared/forms/select/select.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ToastService } from '../../shared/overlay/toast/toast.service';
import type { FulfillmentMethod } from '../../domain/models/checkout.model';

const EGYPT_GOVERNORATES: readonly { value: string; labelAr: string; labelEn: string }[] = [
  { value: 'Qena', labelAr: 'قنا', labelEn: 'Qena' },
  { value: 'Cairo', labelAr: 'القاهرة', labelEn: 'Cairo' },
  { value: 'Giza', labelAr: 'الجيزة', labelEn: 'Giza' },
  { value: 'Alexandria', labelAr: 'الإسكندرية', labelEn: 'Alexandria' },
  { value: 'Luxor', labelAr: 'الأقصر', labelEn: 'Luxor' },
  { value: 'Aswan', labelAr: 'أسوان', labelEn: 'Aswan' },
  { value: 'Asyut', labelAr: 'أسيوط', labelEn: 'Asyut' },
  { value: 'Sohag', labelAr: 'سوهاج', labelEn: 'Sohag' },
  { value: 'Beni Suef', labelAr: 'بني سويف', labelEn: 'Beni Suef' },
  { value: 'Minya', labelAr: 'المنيا', labelEn: 'Minya' },
  { value: 'Faiyum', labelAr: 'الفيوم', labelEn: 'Faiyum' },
  { value: 'Dakahlia', labelAr: 'الدقهلية', labelEn: 'Dakahlia' },
  { value: 'Sharqia', labelAr: 'الشرقية', labelEn: 'Sharqia' },
  { value: 'Gharbia', labelAr: 'الغربية', labelEn: 'Gharbia' },
  { value: 'Monufia', labelAr: 'المنوفية', labelEn: 'Monufia' },
  { value: 'Qalyubia', labelAr: 'القليوبية', labelEn: 'Qalyubia' },
  { value: 'Kafr El Sheikh', labelAr: 'كفر الشيخ', labelEn: 'Kafr El Sheikh' },
  { value: 'Damietta', labelAr: 'دمياط', labelEn: 'Damietta' },
  { value: 'Port Said', labelAr: 'بورسعيد', labelEn: 'Port Said' },
  { value: 'Ismailia', labelAr: 'الإسماعيلية', labelEn: 'Ismailia' },
  { value: 'Suez', labelAr: 'السويس', labelEn: 'Suez' },
  { value: 'Red Sea', labelAr: 'البحر الأحمر', labelEn: 'Red Sea' },
  { value: 'Matrouh', labelAr: 'مطروح', labelEn: 'Matrouh' },
  { value: 'New Valley', labelAr: 'الوادي الجديد', labelEn: 'New Valley' },
  { value: 'North Sinai', labelAr: 'شمال سيناء', labelEn: 'North Sinai' },
  { value: 'South Sinai', labelAr: 'جنوب سيناء', labelEn: 'South Sinai' },
];

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MoneyPipe,
    ButtonComponent,
    IconComponent,
    FormFieldComponent,
    TextInputComponent,
    SelectComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="az-checkout-page" [attr.dir]="direction()">
      <div class="az-checkout-page__container">
        <!-- BREADCRUMBS -->
        <nav
          class="az-breadcrumbs"
          [attr.aria-label]="isArabic() ? 'مسار التنقل' : 'Breadcrumbs'"
        >
          <ol class="az-breadcrumbs__list">
            <li class="az-breadcrumbs__item">
              <a routerLink="/" class="az-breadcrumbs__link">
                {{ isArabic() ? 'الرئيسية' : 'Home' }}
              </a>
            </li>
            <li class="az-breadcrumbs__separator" aria-hidden="true">/</li>
            <li class="az-breadcrumbs__item">
              <a routerLink="/cart" class="az-breadcrumbs__link">
                {{ isArabic() ? 'سلة التسوق' : 'Cart' }}
              </a>
            </li>
            <li class="az-breadcrumbs__separator" aria-hidden="true">/</li>
            <li class="az-breadcrumbs__item az-breadcrumbs__item--active" aria-current="page">
              {{ isArabic() ? 'إتمام الطلب' : 'Checkout' }}
            </li>
          </ol>
        </nav>

        <!-- EMPTY CART STATE (if not already submitted) -->
        @if (cartStore.isEmpty() && checkoutStore.step() !== 'confirmation') {
          <app-empty-state
            icon="🛒"
            [title]="isArabic() ? 'لا توجد منتجات لإتمام الطلب' : 'No items to checkout'"
            [description]="
              isArabic()
                ? 'سلة التسوق الخاصة بك فارغة. يرجى إضافة كتب أو منتجات أولاً.'
                : 'Your shopping cart is empty. Please add items before checking out.'
            "
            [actionText]="isArabic() ? 'تصفح المتجر' : 'Browse Shop'"
            actionRoute="/shop"
          />
        } @else {
          <!-- STEP INDICATOR WIZARD -->
          @if (checkoutStore.step() !== 'confirmation') {
            <div class="az-checkout-steps" role="navigation" [attr.aria-label]="isArabic() ? 'مراحل إتمام الطلب' : 'Checkout steps'">
              <button
                type="button"
                class="az-checkout-step"
                [class.az-checkout-step--active]="checkoutStore.step() === 'information'"
                [class.az-checkout-step--completed]="
                  checkoutStore.step() === 'payment' || checkoutStore.step() === 'review'
                "
                (click)="onGoToStep('information')"
              >
                <span class="az-checkout-step__badge">1</span>
                <span class="az-checkout-step__label">
                  {{ isArabic() ? 'بيانات الشحن' : 'Shipping Info' }}
                </span>
              </button>

              <div class="az-checkout-steps__divider" aria-hidden="true"></div>

              <button
                type="button"
                class="az-checkout-step"
                [class.az-checkout-step--active]="checkoutStore.step() === 'payment'"
                [class.az-checkout-step--completed]="checkoutStore.step() === 'review'"
                [disabled]="!checkoutStore.isInformationValid()"
                (click)="onGoToStep('payment')"
              >
                <span class="az-checkout-step__badge">2</span>
                <span class="az-checkout-step__label">
                  {{ isArabic() ? 'طريقة الدفع' : 'Payment Method' }}
                </span>
              </button>

              <div class="az-checkout-steps__divider" aria-hidden="true"></div>

              <button
                type="button"
                class="az-checkout-step"
                [class.az-checkout-step--active]="checkoutStore.step() === 'review'"
                [disabled]="!checkoutStore.isInformationValid()"
                (click)="onGoToStep('review')"
              >
                <span class="az-checkout-step__badge">3</span>
                <span class="az-checkout-step__label">
                  {{ isArabic() ? 'مراجعة وتأكيد' : 'Review & Confirm' }}
                </span>
              </button>
            </div>
          }

          <!-- REVALIDATION CONFLICT ALERTS -->
          @if (checkoutStore.priceChangedNotice()) {
            <div class="az-checkout-alert az-checkout-alert--warning" role="alert">
              <app-icon name="alert-triangle" [size]="20" />
              <div class="az-checkout-alert__content">
                <p class="az-checkout-alert__text">
                  {{ checkoutStore.priceChangedNotice() }}
                </p>
                <button
                  type="button"
                  class="az-checkout-alert__action"
                  (click)="checkoutStore.dismissNotices()"
                >
                  {{ isArabic() ? 'موافق ومتابعة' : 'Acknowledge & Continue' }}
                </button>
              </div>
            </div>
          }

          @if (checkoutStore.availabilityConflictNotice()) {
            <div class="az-checkout-alert az-checkout-alert--danger" role="alert">
              <app-icon name="x-circle" [size]="20" />
              <div class="az-checkout-alert__content">
                <p class="az-checkout-alert__text">
                  {{ checkoutStore.availabilityConflictNotice() }}
                </p>
                <button
                  type="button"
                  class="az-checkout-alert__action"
                  (click)="checkoutStore.dismissNotices()"
                >
                  {{ isArabic() ? 'العودة للسلة لتحديث الكميات' : 'Return to cart to update' }}
                </button>
              </div>
            </div>
          }

          <!-- MAIN CHECKOUT CONTENT -->
          <div class="az-checkout-layout">
            <!-- LEFT MAIN: FORM STEPS -->
            <main class="az-checkout-main">
              <!-- STEP 1: INFORMATION & FULFILLMENT -->
              @if (checkoutStore.step() === 'information') {
                <section class="az-checkout-card" aria-labelledby="step-1-title">
                  <h2 id="step-1-title" class="az-checkout-card__title">
                    <app-icon name="truck" [size]="22" />
                    {{ isArabic() ? 'بيانات التواصل وطريقة الاستلام' : 'Contact & Fulfillment' }}
                  </h2>

                  <!-- CONTACT INFO -->
                  <div class="az-checkout-section">
                    <h3 class="az-checkout-section__title">
                      {{ isArabic() ? 'بيانات العميل' : 'Customer Details' }}
                    </h3>

                    <div class="az-checkout-form-grid">
                      <app-form-field
                        [label]="isArabic() ? 'الاسم الكامل' : 'Full Name'"
                        [required]="true"
                      >
                        <app-text-input
                          [ngModel]="checkoutStore.contact().name"
                          (ngModelChange)="onUpdateContact('name', $event)"
                          [placeholder]="isArabic() ? 'مثال: محمد أحمد' : 'e.g. Mohamed Ahmed'"
                          autocomplete="name"
                        />
                      </app-form-field>

                      <app-form-field
                        [label]="isArabic() ? 'رقم الهاتف' : 'Phone Number'"
                        [required]="true"
                        [hint]="isArabic() ? 'رقم هاتف مصري متاح للتواصل' : 'Egyptian phone number'"
                      >
                        <app-text-input
                          type="tel"
                          [ngModel]="checkoutStore.contact().phone"
                          (ngModelChange)="onUpdateContact('phone', $event)"
                          placeholder="01xxxxxxxxx"
                          autocomplete="tel"
                        />
                      </app-form-field>

                      <app-form-field
                        [label]="isArabic() ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'"
                        [hint]="isArabic() ? 'لاستلام إشعار تأكيد الطلب' : 'To receive order confirmation'"
                      >
                        <app-text-input
                          type="email"
                          [ngModel]="checkoutStore.contact().email"
                          (ngModelChange)="onUpdateContact('email', $event)"
                          placeholder="example@domain.com"
                          autocomplete="email"
                        />
                      </app-form-field>
                    </div>
                  </div>

                  <!-- FULFILLMENT METHOD TOGGLE -->
                  <div class="az-checkout-section">
                    <h3 class="az-checkout-section__title">
                      {{ isArabic() ? 'طريقة الاستلام' : 'Fulfillment Method' }}
                    </h3>

                    <div class="az-fulfillment-options" role="radiogroup">
                      <label
                        class="az-fulfillment-card"
                        [class.az-fulfillment-card--selected]="checkoutStore.fulfillmentMethod() === 'delivery'"
                      >
                        <input
                          type="radio"
                          name="fulfillment"
                          value="delivery"
                          [checked]="checkoutStore.fulfillmentMethod() === 'delivery'"
                          (change)="onSelectFulfillment('delivery')"
                          class="az-visually-hidden"
                        />
                        <div class="az-fulfillment-card__icon">
                          <app-icon name="truck" [size]="24" />
                        </div>
                        <div class="az-fulfillment-card__info">
                          <strong class="az-fulfillment-card__name">
                            {{ isArabic() ? 'شحن وتوصيل للمنزل' : 'Home Delivery' }}
                          </strong>
                          <span class="az-fulfillment-card__desc">
                            {{ isArabic() ? 'توصيل عبر شركة الشحن حتى باب المنزل' : 'Delivery directly to your address' }}
                          </span>
                        </div>
                      </label>

                      <label
                        class="az-fulfillment-card"
                        [class.az-fulfillment-card--selected]="checkoutStore.fulfillmentMethod() === 'pickup'"
                      >
                        <input
                          type="radio"
                          name="fulfillment"
                          value="pickup"
                          [checked]="checkoutStore.fulfillmentMethod() === 'pickup'"
                          (change)="onSelectFulfillment('pickup')"
                          class="az-visually-hidden"
                        />
                        <div class="az-fulfillment-card__icon">
                          <app-icon name="store" [size]="24" />
                        </div>
                        <div class="az-fulfillment-card__info">
                          <strong class="az-fulfillment-card__name">
                            {{ isArabic() ? 'استلام مجاني من الفرع' : 'Free Branch Pickup' }}
                          </strong>
                          <span class="az-fulfillment-card__desc">
                            {{ isArabic() ? 'الاستلام مباشرة من مقر المكتبة بقنا' : 'Direct pickup from Qena branch' }}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- DELIVERY ADDRESS FORM -->
                  @if (checkoutStore.fulfillmentMethod() === 'delivery') {
                    <div class="az-checkout-section">
                      <h3 class="az-checkout-section__title">
                        {{ isArabic() ? 'عنوان التوصيل' : 'Delivery Address' }}
                      </h3>

                      <!-- SAVED ADDRESSES SELECTOR (IF LOGGED IN) -->
                      @if (checkoutStore.savedAddresses().length > 0) {
                        <div class="az-saved-addresses">
                          <span class="az-saved-addresses__label">
                            {{ isArabic() ? 'اختر من العناوين المحفوظة:' : 'Select from saved addresses:' }}
                          </span>
                          <div class="az-saved-addresses__grid">
                            @for (addr of checkoutStore.savedAddresses(); track addr.id) {
                              <button
                                type="button"
                                class="az-saved-addr-chip"
                                [class.az-saved-addr-chip--selected]="checkoutStore.selectedAddressId() === addr.id"
                                (click)="checkoutStore.selectSavedAddress(addr.id)"
                              >
                                <strong>{{ addr.label || addr.city }}</strong>
                                <span>{{ addr.governorate }} - {{ addr.street }}</span>
                              </button>
                            }
                          </div>
                        </div>
                      }

                      <div class="az-checkout-form-grid">
                        <app-form-field
                          [label]="isArabic() ? 'المحافظة' : 'Governorate'"
                          [required]="true"
                        >
                          <app-select
                            [ngModel]="checkoutStore.address().governorate"
                            (ngModelChange)="onUpdateAddress('governorate', $event)"
                            [options]="governorateOptions()"
                          />
                        </app-form-field>

                        <app-form-field
                          [label]="isArabic() ? 'المدينة / المركز' : 'City'"
                          [required]="true"
                        >
                          <app-text-input
                            [ngModel]="checkoutStore.address().city"
                            (ngModelChange)="onUpdateAddress('city', $event)"
                            [placeholder]="isArabic() ? 'مثال: قنا' : 'e.g. Qena'"
                          />
                        </app-form-field>

                        <app-form-field
                          [label]="isArabic() ? 'المنطقة / الحي' : 'Area / District'"
                        >
                          <app-text-input
                            [ngModel]="checkoutStore.address().area"
                            (ngModelChange)="onUpdateAddress('area', $event)"
                            [placeholder]="isArabic() ? 'مثال: شؤون قنا' : 'e.g. Central District'"
                          />
                        </app-form-field>

                        <app-form-field
                          [label]="isArabic() ? 'اسم الشارع' : 'Street Name'"
                          [required]="true"
                        >
                          <app-text-input
                            [ngModel]="checkoutStore.address().street"
                            (ngModelChange)="onUpdateAddress('street', $event)"
                            [placeholder]="isArabic() ? 'اسم الشارع الرئيسي والفرعي' : 'Street name'"
                          />
                        </app-form-field>

                        <app-form-field
                          [label]="isArabic() ? 'رقم العقار / العمارة' : 'Building No.'"
                        >
                          <app-text-input
                            [ngModel]="checkoutStore.address().building"
                            (ngModelChange)="onUpdateAddress('building', $event)"
                            placeholder="12"
                          />
                        </app-form-field>

                        <app-form-field
                          [label]="isArabic() ? 'رقم الشقة / الدور' : 'Apartment / Floor'"
                        >
                          <app-text-input
                            [ngModel]="checkoutStore.address().apartment"
                            (ngModelChange)="onUpdateAddress('apartment', $event)"
                            placeholder="3"
                          />
                        </app-form-field>
                      </div>

                      <!-- SHIPPING SERVICEABILITY STATUS -->
                      @if (checkoutStore.shippingLoading()) {
                        <p class="az-shipping-status az-shipping-status--loading">
                          <app-icon name="spinner" [size]="16" />
                          {{ isArabic() ? 'جاري حساب تكلفة الشحن...' : 'Calculating shipping fee...' }}
                        </p>
                      } @else if (checkoutStore.shippingEstimate()) {
                        @if (checkoutStore.shippingEstimate()!.serviceable) {
                          <div class="az-shipping-status az-shipping-status--available">
                            <app-icon name="check-circle-2" [size]="18" />
                            <span>
                              {{
                                isArabic()
                                  ? 'التوصيل متاح لمحافظة ' +
                                    checkoutStore.address().governorate +
                                    ' بقيمة: '
                                  : 'Delivery available for ' +
                                    checkoutStore.address().governorate +
                                    ': '
                              }}
                              <strong>{{ checkoutStore.shippingCost() | money }}</strong>
                            </span>
                          </div>
                        } @else {
                          <div class="az-shipping-status az-shipping-status--unserviceable" role="alert">
                            <app-icon name="alert-triangle" [size]="18" />
                            <span>
                              {{
                                isArabic()
                                  ? 'عذراً، هذه المنطقة غير مشمولة بالتوصيل حالياً. يمكنك اختيار الاستلام من الفرع مجاناً.'
                                  : 'Sorry, this area is not serviceable for delivery currently. You may choose branch pickup.'
                              }}
                            </span>
                          </div>
                        }
                      }
                    </div>
                  } @else {
                    <!-- PICKUP DETAILS INFO -->
                    <div class="az-pickup-info">
                      <div class="az-pickup-info__header">
                        <app-icon name="store" [size]="20" />
                        <strong>{{ isArabic() ? 'مقر الاستلام:' : 'Pickup Location:' }}</strong>
                      </div>
                      <p class="az-pickup-info__name">
                        {{
                          isArabic()
                            ? checkoutStore.shippingEstimate()?.pickupLocation?.ar || 'مكتبة الأزهري - قنا'
                            : checkoutStore.shippingEstimate()?.pickupLocation?.en || 'Al-Azhary Library - Qena'
                        }}
                      </p>
                      <p class="az-pickup-info__address">
                        {{
                          checkoutStore.shippingEstimate()?.pickupLocation?.address ||
                            'شارع المحطة، بجوار مسجد سيدي عبد الرحيم القنائي، قنا، مصر'
                        }}
                      </p>
                      <span class="az-pickup-info__badge">
                        {{ isArabic() ? 'شحن مجاني (0 ج.م)' : 'Free Pickup (0 EGP)' }}
                      </span>
                    </div>
                  }

                  <div class="az-checkout-card__actions">
                    <app-button
                      variant="primary"
                      size="lg"
                      [disabled]="!checkoutStore.isInformationValid() || isDeliveryUnserviceable()"
                      (clicked)="onGoToStep('payment')"
                    >
                      {{ isArabic() ? 'المتابعة لاختيار طريقة الدفع' : 'Proceed to Payment' }}
                      <app-icon [name]="isArabic() ? 'chevron-left' : 'chevron-right'" [size]="18" />
                    </app-button>
                  </div>
                </section>
              }

              <!-- STEP 2: PAYMENT METHOD SELECTION -->
              @else if (checkoutStore.step() === 'payment') {
                <section class="az-checkout-card" aria-labelledby="step-2-title">
                  <h2 id="step-2-title" class="az-checkout-card__title">
                    <app-icon name="wallet-cards" [size]="22" />
                    {{ isArabic() ? 'اختر طريقة الدفع' : 'Payment Method' }}
                  </h2>

                  <div class="az-payment-methods" role="radiogroup">
                    @for (method of paymentMethods; track method.key) {
                      <label
                        class="az-payment-method-card"
                        [class.az-payment-method-card--selected]="checkoutStore.paymentMethodKey() === method.key"
                      >
                        <div class="az-payment-method-card__top">
                          <input
                            type="radio"
                            name="paymentMethod"
                            [value]="method.key"
                            [checked]="checkoutStore.paymentMethodKey() === method.key"
                            (change)="checkoutStore.setPaymentMethod(method.key)"
                            class="az-payment-method-card__radio"
                          />
                          <div class="az-payment-method-card__title-row">
                            <strong class="az-payment-method-card__title">
                              {{ isArabic() ? method.name.ar : method.name.en }}
                            </strong>
                            @if (method.proofRequired) {
                              <span class="az-payment-method-card__proof-badge">
                                {{ isArabic() ? 'يتطلب إيصال تحويل' : 'Receipt required' }}
                              </span>
                            }
                          </div>
                        </div>

                        <p class="az-payment-method-card__instructions">
                          {{ isArabic() ? method.instructions.ar : method.instructions.en }}
                        </p>

                        @if (method.details?.['ipa']) {
                          <div class="az-payment-method-card__detail">
                            <span class="az-payment-method-card__detail-label">
                              {{ isArabic() ? 'عنوان الدفع اللحظي (IPA):' : 'InstaPay IPA:' }}
                            </span>
                            <code class="az-payment-method-card__code">
                              {{ method.details?.['ipa'] }}
                            </code>
                          </div>
                        }
                      </label>
                    }
                  </div>

                  <div class="az-checkout-card__actions az-checkout-card__actions--between">
                    <app-button
                      variant="secondary"
                      size="md"
                      (clicked)="onGoToStep('information')"
                    >
                      <app-icon [name]="isArabic() ? 'chevron-right' : 'chevron-left'" [size]="16" />
                      {{ isArabic() ? 'العودة لبيانات الشحن' : 'Back to Shipping' }}
                    </app-button>

                    <app-button
                      variant="primary"
                      size="lg"
                      (clicked)="onGoToStep('review')"
                    >
                      {{ isArabic() ? 'متابعة لمراجعة الطلب' : 'Proceed to Review' }}
                      <app-icon [name]="isArabic() ? 'chevron-left' : 'chevron-right'" [size]="18" />
                    </app-button>
                  </div>
                </section>
              }

              <!-- STEP 3: REVIEW & ORDER SUBMISSION -->
              @else if (checkoutStore.step() === 'review') {
                <section class="az-checkout-card" aria-labelledby="step-3-title">
                  <h2 id="step-3-title" class="az-checkout-card__title">
                    <app-icon name="clipboard-check" [size]="22" />
                    {{ isArabic() ? 'مراجعة وتأكيد الطلب' : 'Review & Submit Order' }}
                  </h2>

                  <!-- SUMMARY BOXES -->
                  <div class="az-review-summary-grid">
                    <!-- FULFILLMENT SUMMARY -->
                    <div class="az-review-box">
                      <div class="az-review-box__header">
                        <strong class="az-review-box__title">
                          <app-icon name="truck" [size]="16" />
                          {{ isArabic() ? 'الشحن والاستلام' : 'Fulfillment' }}
                        </strong>
                        <button
                          type="button"
                          class="az-review-box__edit"
                          (click)="onGoToStep('information')"
                        >
                          {{ isArabic() ? 'تعديل' : 'Edit' }}
                        </button>
                      </div>
                      <p class="az-review-box__line">
                        <strong>{{ checkoutStore.contact().name }}</strong> ({{ checkoutStore.contact().phone }})
                      </p>
                      @if (checkoutStore.fulfillmentMethod() === 'delivery') {
                        <p class="az-review-box__line">
                          {{ checkoutStore.address().governorate }}, {{ checkoutStore.address().city }},
                          {{ checkoutStore.address().street }}
                        </p>
                      } @else {
                        <p class="az-review-box__line">
                          {{ isArabic() ? 'استلام من الفرع بقنا' : 'Branch Pickup in Qena' }}
                        </p>
                      }
                    </div>

                    <!-- PAYMENT SUMMARY -->
                    <div class="az-review-box">
                      <div class="az-review-box__header">
                        <strong class="az-review-box__title">
                          <app-icon name="wallet-cards" [size]="16" />
                          {{ isArabic() ? 'طريقة الدفع' : 'Payment Method' }}
                        </strong>
                        <button
                          type="button"
                          class="az-review-box__edit"
                          (click)="onGoToStep('payment')"
                        >
                          {{ isArabic() ? 'تعديل' : 'Edit' }}
                        </button>
                      </div>
                      <p class="az-review-box__line">
                        {{
                          isArabic()
                            ? checkoutStore.selectedPaymentMethod().name.ar
                            : checkoutStore.selectedPaymentMethod().name.en
                        }}
                      </p>
                      @if (checkoutStore.selectedPaymentMethod().proofRequired) {
                        <span class="az-review-box__badge">
                          {{ isArabic() ? 'سيُطلب رفع الإيصال بعد تأكيد الطلب' : 'Receipt upload required after submit' }}
                        </span>
                      }
                    </div>
                  </div>

                  <!-- ORDER ITEMS TABLE -->
                  <div class="az-review-items">
                    <h3 class="az-review-items__title">
                      {{ isArabic() ? 'المنتجات المطلوبة' : 'Ordered Items' }}
                    </h3>

                    <div class="az-review-items__list">
                      @for (item of checkoutStore.items(); track item.id) {
                        <div class="az-review-item">
                          <span class="az-review-item__qty">{{ item.quantity }}x</span>
                          <div class="az-review-item__name">
                            <span>{{ isArabic() ? item.productName.ar : (item.productName.en || item.productName.ar) }}</span>
                          </div>
                          <span class="az-review-item__price">{{ item.lineTotal | money }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- SUBMISSION ERROR BANNER -->
                  @if (checkoutStore.submitError()) {
                    <div class="az-checkout-alert az-checkout-alert--danger" role="alert">
                      <app-icon name="alert-circle" [size]="20" />
                      <div class="az-checkout-alert__content">
                        <p class="az-checkout-alert__text">{{ checkoutStore.submitError() }}</p>
                      </div>
                    </div>
                  }

                  <div class="az-checkout-card__actions az-checkout-card__actions--between">
                    <app-button
                      variant="secondary"
                      size="md"
                      [disabled]="checkoutStore.isSubmitting()"
                      (clicked)="onGoToStep('payment')"
                    >
                      <app-icon [name]="isArabic() ? 'chevron-right' : 'chevron-left'" [size]="16" />
                      {{ isArabic() ? 'العودة لاختيار الدفع' : 'Back to Payment' }}
                    </app-button>

                    <app-button
                      variant="primary"
                      size="lg"
                      [loading]="checkoutStore.isSubmitting()"
                      [disabled]="checkoutStore.isSubmitting()"
                      (clicked)="onSubmitOrder()"
                    >
                      <app-icon name="badge-check" [size]="20" />
                      {{ isArabic() ? 'تأكيد وإرسال الطلب الآن' : 'Confirm & Place Order' }}
                    </app-button>
                  </div>
                </section>
              }

              <!-- STEP 4: CONFIRMATION SUCCESS STATE -->
              @else if (checkoutStore.step() === 'confirmation' && checkoutStore.submittedOrder()) {
                <section class="az-confirmation-card" aria-labelledby="confirmation-title">
                  <div class="az-confirmation-card__icon" aria-hidden="true">
                    <app-icon name="check-circle-2" [size]="48" />
                  </div>

                  <h1 id="confirmation-title" class="az-confirmation-card__title">
                    {{ isArabic() ? 'تم استلام طلبك بنجاح!' : 'Order Placed Successfully!' }}
                  </h1>

                  <p class="az-confirmation-card__subtitle">
                    {{
                      isArabic()
                        ? 'شكراً لتسوقك من مكتبة الأزهري. تم تسجيل طلبك وسيقوم فريقنا بمراجعته وتجهيزه في أقرب وقت.'
                        : 'Thank you for shopping with Al-Azhary Library. Your order has been received and our team is preparing it.'
                    }}
                  </p>

                  <!-- ORDER REFERENCE BADGE -->
                  <div class="az-order-reference-box">
                    <span class="az-order-reference-box__label">
                      {{ isArabic() ? 'رقم الطلب المرجعي:' : 'Order Reference:' }}
                    </span>
                    <strong class="az-order-reference-box__code">
                      {{ checkoutStore.submittedOrder()!.reference }}
                    </strong>
                    <button
                      type="button"
                      class="az-order-reference-box__copy"
                      (click)="onCopyOrderReference()"
                    >
                      <app-icon name="clipboard-check" [size]="16" />
                      {{ isArabic() ? 'نسخ' : 'Copy' }}
                    </button>
                  </div>

                  <!-- PAYMENT PROOF UPLOAD WORKFLOW (IF REQUIRED) -->
                  @if (isProofRequired()) {
                    <div class="az-proof-workflow" aria-labelledby="proof-title">
                      <h2 id="proof-title" class="az-proof-workflow__title">
                        <app-icon name="upload" [size]="20" />
                        {{ isArabic() ? 'رفع إيصال أو صورة التحويل' : 'Upload Payment Receipt / Proof' }}
                      </h2>

                      <p class="az-proof-workflow__desc">
                        {{
                          isArabic()
                            ? 'نظراً لاختيارك الدفع الإلكتروني (' +
                              checkoutStore.selectedPaymentMethod().name.ar +
                              ')، يرجى رفع صورة إيصال التحويل لإتمام تأكيد الدفع.'
                            : 'Because you selected electronic payment, please upload screenshot of transfer receipt.'
                        }}
                      </p>

                      @if (checkoutStore.proofSubmitted()) {
                        <div class="az-proof-success" role="status">
                          <app-icon name="check-circle-2" [size]="20" />
                          <span>
                            {{ isArabic() ? 'تم رفع إيصال الدفع بنجاح. سنقوم بمراجعته مع الطلب.' : 'Payment proof uploaded successfully!' }}
                          </span>
                        </div>
                      } @else {
                        <div class="az-proof-dropzone">
                          <input
                            type="file"
                            accept="image/*"
                            (change)="onProofFileSelected($event)"
                            class="az-proof-dropzone__input"
                            id="proof-file-input"
                            [disabled]="checkoutStore.proofUploading()"
                          />
                          <label for="proof-file-input" class="az-proof-dropzone__label">
                            <app-icon name="upload" [size]="32" />
                            <span>
                              {{
                                selectedProofFile()
                                  ? selectedProofFile()!.name
                                  : isArabic()
                                    ? 'اضغط لاختيار صورة إيصال التحويل'
                                    : 'Click to select receipt image'
                              }}
                            </span>
                          </label>
                        </div>

                        @if (selectedProofFile()) {
                          <div class="az-proof-actions">
                            <app-button
                              variant="primary"
                              size="md"
                              [loading]="checkoutStore.proofUploading()"
                              (clicked)="onUploadProof()"
                            >
                              {{ isArabic() ? 'تأكيد ورفع الإيصال الآن' : 'Upload Receipt Now' }}
                            </app-button>
                          </div>
                        }

                        @if (checkoutStore.proofError()) {
                          <p class="az-proof-error" role="alert">
                            {{ checkoutStore.proofError() }}
                          </p>
                        }
                      }
                    </div>
                  }

                  <!-- NEXT ACTIONS -->
                  <div class="az-confirmation-card__actions">
                    <app-button
                      routerLink="/shop"
                      variant="primary"
                      size="lg"
                    >
                      <app-icon name="shopping-bag" [size]="20" />
                      {{ isArabic() ? 'العودة لمواصلة التسوق' : 'Continue Shopping' }}
                    </app-button>
                  </div>
                </section>
              }
            </main>

            <!-- RIGHT SIDEBAR: ORDER TOTALS & COUPON -->
            @if (checkoutStore.step() !== 'confirmation') {
              <aside class="az-checkout-sidebar" [attr.aria-label]="isArabic() ? 'ملخص الحساب والتكلفة' : 'Order totals summary'">
                <div class="az-checkout-totals-card">
                  <h3 class="az-checkout-totals-card__title">
                    {{ isArabic() ? 'ملخص الحساب' : 'Order Summary' }}
                  </h3>

                  <!-- COUPON CODE FIELD -->
                  <div class="az-coupon-box">
                    <label class="az-coupon-box__label" for="coupon-code-input">
                      {{ isArabic() ? 'هل لديك قسيمة خصم؟' : 'Have a discount coupon?' }}
                    </label>

                    @if (!checkoutStore.appliedCoupon()) {
                      <div class="az-coupon-box__row">
                        <app-text-input
                          id="coupon-code-input"
                          [ngModel]="checkoutStore.couponCode()"
                          (ngModelChange)="checkoutStore.setCouponCode($event)"
                          [placeholder]="isArabic() ? 'رمز القسيمة' : 'Coupon code'"
                        />
                        <app-button
                          variant="secondary"
                          size="md"
                          [loading]="checkoutStore.couponLoading()"
                          [disabled]="!checkoutStore.couponCode().trim() || checkoutStore.couponLoading()"
                          (clicked)="onApplyCoupon()"
                        >
                          {{ isArabic() ? 'تطبيق' : 'Apply' }}
                        </app-button>
                      </div>

                      @if (checkoutStore.couponError()) {
                        <p class="az-coupon-box__error" role="alert">
                          {{ checkoutStore.couponError() }}
                        </p>
                      }
                    } @else {
                      <div class="az-coupon-applied">
                        <div class="az-coupon-applied__info">
                          <app-icon name="check-circle-2" [size]="16" />
                          <span>{{ checkoutStore.appliedCoupon()!.code }}</span>
                          <small>({{ checkoutStore.appliedCoupon()!.discountAmount | money }})</small>
                        </div>
                        <button
                          type="button"
                          class="az-coupon-applied__remove"
                          (click)="checkoutStore.removeCoupon()"
                        >
                          {{ isArabic() ? 'إزالة' : 'Remove' }}
                        </button>
                      </div>
                    }
                  </div>

                  <hr class="az-checkout-divider" />

                  <!-- TOTALS BREAKDOWN -->
                  <div class="az-checkout-breakdown">
                    <div class="az-checkout-breakdown__row">
                      <span>{{ isArabic() ? 'المجموع الفرعي' : 'Subtotal' }}</span>
                      <strong>{{ checkoutStore.itemsSubtotal() | money }}</strong>
                    </div>

                    @if (checkoutStore.appliedCoupon()) {
                      <div class="az-checkout-breakdown__row az-checkout-breakdown__row--discount">
                        <span>{{ isArabic() ? 'الخصم' : 'Discount' }}</span>
                        <strong>-{{ checkoutStore.discountAmount() | money }}</strong>
                      </div>
                    }

                    <div class="az-checkout-breakdown__row">
                      <span>{{ isArabic() ? 'الشحن' : 'Shipping' }}</span>
                      @if (checkoutStore.fulfillmentMethod() === 'pickup') {
                        <strong class="az-text-success">{{ isArabic() ? 'مجاني (استلام من الفرع)' : 'Free (Pickup)' }}</strong>
                      } @else if (checkoutStore.shippingLoading()) {
                        <span>...</span>
                      } @else {
                        <strong>{{ checkoutStore.shippingCost() | money }}</strong>
                      }
                    </div>

                    <hr class="az-checkout-divider" />

                    <div class="az-checkout-breakdown__row az-checkout-breakdown__row--total">
                      <span>{{ isArabic() ? 'الإجمالي النهائي' : 'Final Total' }}</span>
                      <strong class="az-checkout-breakdown__total-val">
                        {{ checkoutStore.totalAmount() | money }}
                      </strong>
                    </div>
                  </div>
                </div>
              </aside>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './checkout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutComponent implements OnInit {
  readonly checkoutStore = inject(CheckoutStore);
  readonly cartStore = inject(CartStore);
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly isArabic = this.localeService.isArabic;
  readonly direction = this.localeService.direction;
  readonly paymentMethods = SUPPORTED_PAYMENT_METHODS;

  readonly selectedProofFile = signal<File | null>(null);

  readonly governorateOptions = computed<SelectOption[]>(() => {
    return EGYPT_GOVERNORATES.map((g) => ({
      value: g.value,
      label: this.isArabic() ? g.labelAr : g.labelEn,
    }));
  });

  readonly isDeliveryUnserviceable = computed(() => {
    if (this.checkoutStore.fulfillmentMethod() === 'pickup') {
      return false;
    }
    const estimate = this.checkoutStore.shippingEstimate();
    return estimate !== null && !estimate.serviceable;
  });

  readonly isProofRequired = computed(() => {
    return this.checkoutStore.selectedPaymentMethod().proofRequired;
  });

  ngOnInit(): void {
    // If cart is not yet loaded, load it
    if (!this.cartStore.cart()) {
      this.cartStore.loadCart().subscribe();
    }
    // Initialize checkout state
    this.checkoutStore.initCheckout();
  }

  onGoToStep(step: CheckoutStep): void {
    this.checkoutStore.setStep(step);
  }

  onUpdateContact(field: 'name' | 'phone' | 'email', value: string): void {
    this.checkoutStore.setContact({ [field]: value });
  }

  onSelectFulfillment(method: FulfillmentMethod): void {
    this.checkoutStore.setFulfillmentMethod(method);
  }

  onUpdateAddress(field: string, value: string): void {
    this.checkoutStore.setAddress({ [field]: value });
  }

  onApplyCoupon(): void {
    const code = this.checkoutStore.couponCode().trim();
    if (!code) {
      return;
    }
    this.checkoutStore.applyCoupon(code).subscribe({
      next: (res) => {
        if (res && res.valid) {
          const msg = this.isArabic()
            ? 'تم تطبيق قسيمة الخصم بنجاح!'
            : 'Coupon applied successfully!';
          this.toast.success(msg);
        }
      },
      error: () => {
        /* error handled in store */
      },
    });
  }

  onSubmitOrder(): void {
    this.checkoutStore.submitOrder().subscribe({
      next: () => {
        const msg = this.isArabic()
          ? 'تم تأكيد طلبك بنجاح!'
          : 'Order submitted successfully!';
        this.toast.success(msg);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => {
        const msg = this.isArabic()
          ? 'تعذر إرسال الطلب. يرجى مراجعة البيانات والمحاولة مرة أخرى.'
          : 'Failed to submit order. Please review and try again.';
        this.toast.error(msg);
      },
    });
  }

  onCopyOrderReference(): void {
    const order = this.checkoutStore.submittedOrder();
    if (!order) {
      return;
    }
    navigator.clipboard.writeText(order.reference);
    const msg = this.isArabic() ? 'تم نسخ رقم الطلب.' : 'Order reference copied.';
    this.toast.success(msg);
  }

  onProofFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files && target.files.length > 0 ? (target.files[0] ?? null) : null;
    this.selectedProofFile.set(file);
  }

  onUploadProof(): void {
    const file = this.selectedProofFile();
    if (!file) {
      return;
    }
    this.checkoutStore.uploadPaymentProof(file).subscribe({
      next: () => {
        const msg = this.isArabic()
          ? 'تم رفع إيصال التحويل بنجاح.'
          : 'Payment proof uploaded successfully.';
        this.toast.success(msg);
        this.selectedProofFile.set(null);
      },
      error: () => {
        const msg = this.isArabic()
          ? 'تعذر رفع الإيصال. يرجى المحاولة مرة أخرى.'
          : 'Failed to upload proof. Please retry.';
        this.toast.error(msg);
      },
    });
  }
}
