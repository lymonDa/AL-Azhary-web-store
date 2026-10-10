import { Component, ChangeDetectionStrategy, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LocaleService } from '../../../core/i18n/locale.service';
import { OrderDetailStore } from '../../../core/orders/order-detail.store';
import { ReturnsApi } from '../../../core/api/commerce/returns-api.service';
import { ToastService } from '../../../shared/overlay/toast/toast.service';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';

@Component({
  selector: 'app-order-return',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    IconComponent,
    SkeletonComponent,
    MoneyPipe,
  ],
  template: `
    <div class="az-order-return" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">
      <div class="az-order-return__header">
        <a [routerLink]="['/orders', orderReference]" class="az-order-return__back-link">
          <app-icon name="arrow-right" [size]="18"></app-icon>
          <span>{{ isArabic() ? 'العودة لتفاصيل الطلب' : 'Back to Order' }}</span>
        </a>
        <h1 class="az-order-return__title">
          {{ isArabic() ? 'تقديم طلب إرجاع' : 'Request Item Return' }}
          <span class="font-mono text-primary">({{ orderReference }})</span>
        </h1>
        <p class="az-order-return__desc">
          {{ isArabic()
            ? 'يرجى تحديد الصنف المراد إرجاعه وسبب الإرجاع مع ذكر أي تفاصيل توضيحية لإدارة المكتبة.'
            : 'Select the item, quantity, and reason for your return request.'
          }}
        </p>
      </div>

      @if (orderStore.isLoading()) {
        <div class="az-order-return__skeleton">
          <app-skeleton width="100%" height="80px"></app-skeleton>
          <app-skeleton width="100%" height="200px" style="margin-top: 16px;"></app-skeleton>
        </div>
      } @else {
        @if (order(); as ord) {
        <div class="az-order-return__card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="az-order-return__form">
            <!-- Select Item -->
            <div class="az-order-return__field">
              <label for="orderItemId" class="az-order-return__label">
                {{ isArabic() ? 'اختر الكتاب / المصنف المراد إرجاعه' : 'Select Item' }} <span class="text-error">*</span>
              </label>
              <select id="orderItemId" formControlName="orderItemId" class="az-order-return__select">
                <option value="" disabled selected>{{ isArabic() ? '— اختر الصنف —' : '— Select Item —' }}</option>
                @for (it of ord.items; track it.productId) {
                  <option [value]="it.productId">
                    {{ isArabic() ? it.name.ar : (it.name.en || it.name.ar) }} ({{ it.quantity }} {{ isArabic() ? 'نسخ' : 'copies' }}) - {{ it.lineTotal | money }}
                  </option>
                }
              </select>
            </div>

            <!-- Quantity -->
            <div class="az-order-return__field">
              <label for="quantity" class="az-order-return__label">
                {{ isArabic() ? 'الكمية المراد إرجاعها' : 'Quantity' }} <span class="text-error">*</span>
              </label>
              <input id="quantity" type="number" formControlName="quantity" min="1" class="az-order-return__input" />
            </div>

            <!-- Return Reason -->
            <div class="az-order-return__field">
              <label for="reason" class="az-order-return__label">
                {{ isArabic() ? 'سبب الإرجاع' : 'Return Reason' }} <span class="text-error">*</span>
              </label>
              <select id="reason" formControlName="reason" class="az-order-return__select">
                <option value="damaged_item">{{ isArabic() ? 'تلف أو تمزق في الكتاب أثناء الشحن' : 'Damaged in transit' }}</option>
                <option value="wrong_item">{{ isArabic() ? 'استلام كتاب مختلف عن المطلوب' : 'Received wrong item' }}</option>
                <option value="defective">{{ isArabic() ? 'عيب طباعة أو صفحات ناقصة' : 'Defective printing / missing pages' }}</option>
                <option value="not_as_described">{{ isArabic() ? 'المحتوى غير مطابق للوصف' : 'Not as described' }}</option>
                <option value="other">{{ isArabic() ? 'سبب آخر' : 'Other' }}</option>
              </select>
            </div>

            <!-- Customer Note -->
            <div class="az-order-return__field">
              <label for="customerNote" class="az-order-return__label">
                {{ isArabic() ? 'ملاحظات إضافية توضيحية' : 'Additional Notes' }}
              </label>
              <textarea
                id="customerNote"
                formControlName="customerNote"
                class="az-order-return__textarea"
                rows="3"
                [placeholder]="isArabic() ? 'يرجى توضيح العيب أو سبب الإرجاع للمشرف الأكاديمي...' : 'Provide details...'"
              ></textarea>
            </div>

            <!-- Submit -->
            <div class="az-order-return__actions">
              <button
                type="submit"
                class="az-order-return__submit-btn"
                [disabled]="form.invalid || isSubmitting()"
              >
                @if (isSubmitting()) {
                  <app-icon name="loader" [size]="18" class="animate-spin"></app-icon>
                  <span>{{ isArabic() ? 'جاري الإرسال...' : 'Submitting...' }}</span>
                } @else {
                  <app-icon name="check" [size]="18"></app-icon>
                  <span>{{ isArabic() ? 'إرسال طلب الإرجاع' : 'Submit Return Request' }}</span>
                }
              </button>
            </div>
          </form>
        </div>
        }
      }
    </div>
  `,
  styleUrls: ['./order-return.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderReturnComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly localeService = inject(LocaleService);
  readonly orderStore = inject(OrderDetailStore);
  private readonly returnsApi = inject(ReturnsApi);
  private readonly toast = inject(ToastService);

  orderReference = '';
  readonly isArabic = computed(() => this.localeService.currentLocale() !== 'en');
  readonly order = computed(() => this.orderStore.order());
  readonly isSubmitting = signal<boolean>(false);

  readonly form = this.fb.group({
    orderItemId: ['', [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    reason: ['damaged_item', [Validators.required]],
    customerNote: [''],
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const ref = params.get('reference');
      if (ref) {
        this.orderReference = ref;
        this.orderStore.loadOrder(ref).subscribe();
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { orderItemId, quantity, reason, customerNote } = this.form.value;
    this.isSubmitting.set(true);

    this.returnsApi
      .createReturn(this.orderReference, {
        items: [
          {
            orderItemId: orderItemId!,
            quantity: Number(quantity) || 1,
            reason: reason!,
          },
        ],
        customerNote: customerNote ? customerNote.trim() : undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.toast.success(
            this.isArabic()
              ? 'تم تقديم طلب الإرجاع بنجاح وسيتواصل معك مشرف المكتبة.'
              : 'Return request submitted successfully.',
          );
          this.router.navigate(['/account/returns']);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toast.error(
            err?.message || (this.isArabic() ? 'تعذر تقديم طلب الإرجاع.' : 'Failed to submit return request.'),
          );
        },
      });
  }
}
