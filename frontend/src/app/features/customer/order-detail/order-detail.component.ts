import { Component, ChangeDetectionStrategy, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocaleService } from '../../../core/i18n/locale.service';
import { OrderDetailStore } from '../../../core/orders/order-detail.store';
import { AppConfigStore } from '../../../core/config/app-config.store';
import { ToastService } from '../../../shared/overlay/toast/toast.service';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/status/status-badge.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { DatePipe } from '../../../shared/pipes/date.pipe';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    IconComponent,
    StatusBadgeComponent,
    SkeletonComponent,
    EmptyStateComponent,
    DatePipe,
    MoneyPipe,
  ],
  template: `
    <div class="az-order-detail" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">
      <!-- Loading State -->
      @if (orderStore.isLoading()) {
        <div class="az-order-detail__skeleton">
          <app-skeleton width="240px" height="32px"></app-skeleton>
          <app-skeleton width="160px" height="20px" style="margin-top: 8px;"></app-skeleton>
          <div class="az-order-detail__skeleton-grid">
            <app-skeleton width="100%" height="240px"></app-skeleton>
            <app-skeleton width="100%" height="240px"></app-skeleton>
          </div>
        </div>
      } @else if (orderStore.notFound()) {
        <app-empty-state
          icon="🔍"
          [title]="isArabic() ? 'لم يتم العثور على الطلب' : 'Order Not Found'"
          [description]="isArabic() ? 'تأكد من صحة رقم الطلب المدخل أو الرابط.' : 'Please verify the order reference code.'"
          [actionText]="isArabic() ? 'العودة لطلباتي' : 'Back to Orders'"
          actionRoute="/account/orders"
        ></app-empty-state>
      } @else if (orderStore.forbidden()) {
        <app-empty-state
          icon="🔒"
          [title]="isArabic() ? 'غير مصرح بالاطلاع على هذا الطلب' : 'Access Restricted'"
          [description]="isArabic() ? 'هذا الطلب غير مسجل تحت حسابك أو يتطلب رمز وصول صالح.' : 'You do not have permission to view this order.'"
          [actionText]="isArabic() ? 'العودة للحساب' : 'Back to Account'"
          actionRoute="/account"
        ></app-empty-state>
      } @else {
        @if (order(); as ord) {
        <!-- State Conflict Banner if detected -->
        @if (orderStore.conflictMessage(); as msg) {
          <div class="az-order-detail__conflict-alert" role="alert">
            <app-icon name="alert-triangle" [size]="20" class="text-warning"></app-icon>
            <span class="az-order-detail__conflict-text">{{ msg }}</span>
          </div>
        }

        <!-- Top Header & Reference -->
        <header class="az-order-detail__header">
          <div class="az-order-detail__header-main">
            <div class="az-order-detail__ref-row">
              <span class="az-order-detail__ref font-mono" dir="ltr">{{ ord.reference }}</span>
              <div class="az-order-detail__badges">
                <app-status-badge kind="order" [status]="ord.status"></app-status-badge>
                <app-status-badge kind="payment" [status]="ord.paymentStatus"></app-status-badge>
                <app-status-badge kind="shipping" [status]="ord.fulfillment.shippingStatus"></app-status-badge>
              </div>
            </div>
            <p class="az-order-detail__submitted-date">
              <span class="az-order-detail__date-label">{{ isArabic() ? 'تاريخ التقديم:' : 'Submitted on:' }}</span>
              <span class="font-semibold">{{ ord.submittedAt | appDate:'datetime' }}</span>
            </p>
          </div>

          <!-- Top Action Buttons -->
          <div class="az-order-detail__header-actions">
            @if (whatsappOrderUrl(); as waUrl) {
              <a
                [href]="waUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="az-order-detail__wa-btn"
                [attr.aria-label]="isArabic() ? 'استفسار عن الطلب عبر واتساب' : 'Inquire on WhatsApp'"
              >
                <app-icon name="message-circle" [size]="18"></app-icon>
                <span>{{ isArabic() ? 'استفسار واتساب' : 'WhatsApp Support' }}</span>
              </a>
            }

            <!-- COD Customer Confirmation Action (Section 14) -->
            @if (canConfirmCod()) {
              <button
                type="button"
                class="az-order-detail__confirm-cod-btn"
                [disabled]="orderStore.isConfirmingCod()"
                (click)="openCodConfirmModal()"
              >
                <app-icon name="check-circle" [size]="18"></app-icon>
                <span>{{ isArabic() ? 'تأكيد طلب الدفع عند الاستلام' : 'Confirm Cash-on-Delivery' }}</span>
              </button>
            }

            <!-- Cancellation Action (Section 13: strictly pending_review only) -->
            @if (canCancelOrder()) {
              <button
                type="button"
                class="az-order-detail__cancel-btn"
                [disabled]="orderStore.isCancelling()"
                (click)="openCancelModal()"
              >
                <app-icon name="x-circle" [size]="18"></app-icon>
                <span>{{ isArabic() ? 'إلغاء الطلب' : 'Cancel Order' }}</span>
              </button>
            }

            <!-- Return Action (if completed) -->
            @if (canInitiateReturn()) {
              <a [routerLink]="['/orders', ord.reference, 'return']" class="az-order-detail__return-btn">
                <app-icon name="rotate-ccw" [size]="18"></app-icon>
                <span>{{ isArabic() ? 'طلب إرجاع صنف' : 'Request Return' }}</span>
              </a>
            }
          </div>
        </header>

        <!-- Main Layout: 2 Columns on Desktop -->
        <div class="az-order-detail__layout">
          <!-- LEFT / MAIN COLUMN: Items & Summary -->
          <div class="az-order-detail__main-col">
            <!-- 1. ORDER ITEMS CARD -->
            <section class="az-order-detail__section-card">
              <div class="az-order-detail__section-head">
                <h2 class="az-order-detail__section-title">
                  {{ isArabic() ? 'محتويات الطلب' : 'Order Items' }}
                  <span class="az-order-detail__items-count">({{ ord.items.length }})</span>
                </h2>
              </div>

              <div class="az-order-detail__items-table-wrap">
                <table class="az-order-detail__items-table" role="table">
                  <thead>
                    <tr>
                      <th scope="col">{{ isArabic() ? 'المصنف / الكتاب' : 'Item' }}</th>
                      <th scope="col">{{ isArabic() ? 'سعر الوحدة' : 'Unit Price' }}</th>
                      <th scope="col">{{ isArabic() ? 'الكمية' : 'Qty' }}</th>
                      <th scope="col">{{ isArabic() ? 'الإجمالي' : 'Total' }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of ord.items; track item.productId) {
                      <tr>
                        <td>
                          <div class="az-order-detail__item-info">
                            @if (item.imageSnapshot) {
                              <img [src]="item.imageSnapshot" [alt]="item.name.ar" class="az-order-detail__item-thumb" />
                            } @else {
                              <div class="az-order-detail__item-thumb-placeholder">
                                <app-icon name="book" [size]="20"></app-icon>
                              </div>
                            }
                            <div class="az-order-detail__item-names">
                              <span class="az-order-detail__item-title font-semibold">
                                {{ isArabic() ? item.name.ar : (item.name.en || item.name.ar) }}
                              </span>
                              @if (item.stockItemKey) {
                                <span class="az-order-detail__item-sku font-mono" dir="ltr">SKU: {{ item.stockItemKey }}</span>
                              }
                            </div>
                          </div>
                        </td>
                        <td>{{ item.unitPrice | money }}</td>
                        <td class="font-mono">×{{ item.quantity }}</td>
                        <td class="font-semibold">{{ item.lineTotal | money }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>

            <!-- 2. TOTALS BREAKDOWN -->
            <section class="az-order-detail__section-card">
              <div class="az-order-detail__section-head">
                <h2 class="az-order-detail__section-title">{{ isArabic() ? 'ملخص الحساب والتكلفة' : 'Order Summary' }}</h2>
              </div>

              <div class="az-order-detail__totals-rows">
                <div class="az-order-detail__total-row">
                  <span class="az-order-detail__total-label">{{ isArabic() ? 'المجموع الفرعي للكتب:' : 'Product Subtotal:' }}</span>
                  <span class="az-order-detail__total-val">{{ ord.totals.productSubtotal | money }}</span>
                </div>

                <div class="az-order-detail__total-row">
                  <span class="az-order-detail__total-label">
                    {{ isArabic() ? 'تكلفة التوصيل والشحن:' : 'Shipping Cost:' }}
                    @if (ord.totals.shippingFinal !== null && ord.totals.shippingFinal.amount !== ord.totals.shippingEstimate.amount) {
                      <span class="az-order-detail__cost-note">
                        ({{ isArabic() ? 'تم التعديل الفعلي بالمكتبة' : 'Final adjusted' }})
                      </span>
                    }
                  </span>
                  <span class="az-order-detail__total-val">
                    {{ (ord.totals.shippingFinal || ord.totals.shippingEstimate) | money }}
                  </span>
                </div>

                @if (ord.totals.discount.amount > 0) {
                  <div class="az-order-detail__total-row az-order-detail__total-row--discount">
                    <span class="az-order-detail__total-label">
                      {{ isArabic() ? 'الخصم المطبق:' : 'Coupon Discount:' }}
                      @if (ord.couponSnapshot?.code) {
                        <span class="font-mono">({{ ord.couponSnapshot?.code }})</span>
                      }
                    </span>
                    <span class="az-order-detail__total-val">-{{ ord.totals.discount | money }}</span>
                  </div>
                }

                <div class="az-order-detail__total-row az-order-detail__total-row--final">
                  <span class="az-order-detail__final-label">{{ isArabic() ? 'المبلغ الإجمالي النهائي:' : 'Final Grand Total:' }}</span>
                  <span class="az-order-detail__final-val font-bold">{{ ord.totals.total | money }}</span>
                </div>
              </div>
            </section>

            <!-- 3. FULFILLMENT & RECIPIENT SNAPSHOT -->
            <section class="az-order-detail__section-card">
              <div class="az-order-detail__section-head">
                <h2 class="az-order-detail__section-title">{{ isArabic() ? 'بيانات الاستلام والتسليم' : 'Fulfillment Details' }}</h2>
              </div>

              <div class="az-order-detail__fulfillment-grid">
                <div class="az-order-detail__fulfillment-item">
                  <span class="az-order-detail__sub-label">{{ isArabic() ? 'طريقة الاستلام:' : 'Method:' }}</span>
                  <span class="az-order-detail__fulfillment-val font-semibold">
                    {{ ord.fulfillment.method === 'pickup'
                      ? (isArabic() ? 'استلام شخصي من مقر مكتبة الأزهري بقنا' : 'Pickup at Al-Azhari Library (Qena)')
                      : (isArabic() ? 'شحن وتوصيل للمنزل' : 'Home Delivery')
                    }}
                  </span>
                </div>

                <div class="az-order-detail__fulfillment-item">
                  <span class="az-order-detail__sub-label">{{ isArabic() ? 'اسم المستلم:' : 'Recipient:' }}</span>
                  <span class="az-order-detail__fulfillment-val font-semibold">{{ ord.customerSnapshot.name }}</span>
                </div>

                <div class="az-order-detail__fulfillment-item">
                  <span class="az-order-detail__sub-label">{{ isArabic() ? 'رقم هاتف التواصل:' : 'Phone:' }}</span>
                  <span class="az-order-detail__fulfillment-val font-mono" dir="ltr">{{ ord.customerSnapshot.phone }}</span>
                </div>

                @if (ord.fulfillment.addressSnapshot; as addr) {
                  <div class="az-order-detail__fulfillment-item az-order-detail__fulfillment-item--full">
                    <span class="az-order-detail__sub-label">{{ isArabic() ? 'عنوان التسليم المسجل:' : 'Delivery Address:' }}</span>
                    <span class="az-order-detail__fulfillment-val">
                      {{ addr.governorate }}، {{ addr.city }}، {{ addr.street }}
                      @if (addr.building) { ، مبنى {{ addr.building }} }
                      @if (addr.apartment) { ، شقة {{ addr.apartment }} }
                      @if (addr.landmark) { — (علامة مميزة: {{ addr.landmark }}) }
                    </span>
                  </div>
                }
              </div>
            </section>
          </div>

          <!-- RIGHT / SIDEBAR COLUMN: Tracking Timeline & Payment -->
          <div class="az-order-detail__side-col">
            <!-- 1. ORDER TRACKING TIMELINE (Sections 11 & 12) -->
            <section class="az-order-detail__section-card az-order-detail__timeline-card">
              <div class="az-order-detail__section-head">
                <h2 class="az-order-detail__section-title">{{ isArabic() ? 'الجدول الزمني ومراحل الطلب' : 'Tracking Timeline' }}</h2>
              </div>

              <!-- Terminal cancellation alert if cancelled -->
              @if (ord.status === 'cancelled') {
                <div class="az-order-detail__terminal-alert az-order-detail__terminal-alert--cancelled">
                  <app-icon name="ban" [size]="20"></app-icon>
                  <div>
                    <span class="font-bold">{{ isArabic() ? 'تم إلغاء الطلب' : 'Order Cancelled' }}</span>
                    @if (ord.cancelledAt) {
                      <div class="text-xs">{{ ord.cancelledAt | appDate:'datetime' }}</div>
                    }
                  </div>
                </div>
              } @else if (ord.status === 'rejected') {
                <div class="az-order-detail__terminal-alert az-order-detail__terminal-alert--rejected">
                  <app-icon name="x-circle" [size]="20"></app-icon>
                  <div>
                    <span class="font-bold">{{ isArabic() ? 'تم رفض الطلب' : 'Order Rejected' }}</span>
                  </div>
                </div>
              }

              <!-- Chronological Timeline Steps -->
              <div class="az-order-detail__timeline">
                @for (step of trackingSteps(); track step.key; let last = $last) {
                  <div
                    class="az-order-detail__timeline-step"
                    [class.az-order-detail__timeline-step--completed]="step.isCompleted"
                    [class.az-order-detail__timeline-step--current]="step.isCurrent"
                    [class.az-order-detail__timeline-step--last]="last"
                  >
                    <div class="az-order-detail__timeline-marker">
                      @if (step.isCompleted && !step.isCurrent) {
                        <app-icon name="check" [size]="14"></app-icon>
                      } @else if (step.isCurrent) {
                        <span class="az-order-detail__timeline-pulse"></span>
                      }
                    </div>
                    <div class="az-order-detail__timeline-body">
                      <span class="az-order-detail__timeline-step-title font-semibold">
                        {{ isArabic() ? step.labelAr : step.labelEn }}
                      </span>
                      @if (step.timestamp) {
                        <span class="az-order-detail__timeline-time">
                          {{ step.timestamp | appDate:'datetime' }}
                        </span>
                      }
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- 2. PAYMENT DETAILS & INSTRUCTIONS -->
            <section class="az-order-detail__section-card">
              <div class="az-order-detail__section-head">
                <h2 class="az-order-detail__section-title">{{ isArabic() ? 'بيانات وطريقة الدفع' : 'Payment Details' }}</h2>
              </div>

              <div class="az-order-detail__payment-info">
                <div class="az-order-detail__payment-method">
                  <span class="az-order-detail__sub-label">{{ isArabic() ? 'طريقة الدفع:' : 'Payment Method:' }}</span>
                  <span class="font-semibold">{{ paymentMethodName() }}</span>
                </div>

                @if (payment(); as pay) {
                  <div class="az-order-detail__proofs-count">
                    <span class="az-order-detail__sub-label">{{ isArabic() ? 'عدد إشعارات الدفع المرفوعة:' : 'Proof Submissions:' }}</span>
                    <span class="font-mono font-bold">{{ pay.proofSubmissionCount }}</span>
                  </div>

                  @if (pay.proofs && pay.proofs.length > 0) {
                    <div class="az-order-detail__proof-history">
                      <span class="az-order-detail__proof-history-title font-semibold">
                        {{ isArabic() ? 'سجل الإشعارات المرفوعة:' : 'Submission History:' }}
                      </span>
                      @for (p of pay.proofs; track p.submissionNumber) {
                        <div class="az-order-detail__proof-entry">
                          <div class="az-order-detail__proof-meta">
                            <span>#{{ p.submissionNumber }} ({{ p.filesCount }} {{ isArabic() ? 'ملف' : 'files' }})</span>
                            <span class="text-xs">{{ p.createdAt | appDate:'datetime' }}</span>
                          </div>
                          <app-status-badge kind="payment" [status]="p.status"></app-status-badge>
                        </div>
                      }
                    </div>
                  }
                }
              </div>
            </section>
          </div>
        </div>
        }
      }

      <!-- CANCEL ORDER CONFIRMATION MODAL -->
      @if (showCancelModal()) {
        <div class="az-order-detail__modal-backdrop">
          <button
            type="button"
            class="az-order-detail__modal-dismiss"
            tabindex="-1"
            aria-hidden="true"
            (click)="closeCancelModal()"
          ></button>
          <div class="az-order-detail__modal" role="dialog" aria-modal="true">
            <div class="az-order-detail__modal-header">
              <h2 class="az-order-detail__modal-title">{{ isArabic() ? 'تأكيد إلغاء الطلب' : 'Confirm Order Cancellation' }}</h2>
              <button type="button" class="az-order-detail__modal-close" (click)="closeCancelModal()" aria-label="Close">
                <app-icon name="x" [size]="20"></app-icon>
              </button>
            </div>
            <div class="az-order-detail__modal-body">
              <p class="az-order-detail__modal-desc">
                {{ isArabic()
                  ? 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟ يتاح الإلغاء فقط أثناء مرحلة المراجعة قبل قبول الطلب من إدارة المكتبة.'
                  : 'Are you sure you want to cancel this order? This action is only permitted while pending review.'
                }}
              </p>
              <div class="az-order-detail__field" style="margin-top: 1rem;">
                <label for="cancelReason" class="az-order-detail__sub-label">
                  {{ isArabic() ? 'سبب الإلغاء (اختياري):' : 'Reason for cancellation (optional):' }}
                </label>
                <textarea
                  id="cancelReason"
                  [(ngModel)]="cancelReason"
                  class="az-order-detail__textarea"
                  rows="3"
                  [placeholder]="isArabic() ? 'اكتب سبب الإلغاء إن رغبت...' : 'Provide cancellation reason if any...'"
                ></textarea>
              </div>
            </div>
            <div class="az-order-detail__modal-actions">
              <button type="button" class="az-order-detail__modal-cancel-btn" (click)="closeCancelModal()">
                {{ isArabic() ? 'تراجع' : 'Back' }}
              </button>
              <button
                type="button"
                class="az-order-detail__modal-delete-btn"
                [disabled]="orderStore.isCancelling()"
                (click)="onConfirmCancel()"
              >
                @if (orderStore.isCancelling()) {
                  <span>{{ isArabic() ? 'جاري الإلغاء...' : 'Cancelling...' }}</span>
                } @else {
                  <span>{{ isArabic() ? 'تأكيد الإلغاء' : 'Confirm Cancellation' }}</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- COD CUSTOMER CONFIRMATION MODAL -->
      @if (showCodModal()) {
        <div class="az-order-detail__modal-backdrop">
          <button
            type="button"
            class="az-order-detail__modal-dismiss"
            tabindex="-1"
            aria-hidden="true"
            (click)="closeCodModal()"
          ></button>
          <div class="az-order-detail__modal" role="dialog" aria-modal="true">
            <div class="az-order-detail__modal-header">
              <h2 class="az-order-detail__modal-title">{{ isArabic() ? 'تأكيد استلام طلب الدفع عند الاستلام' : 'Confirm Cash-on-Delivery Order' }}</h2>
              <button type="button" class="az-order-detail__modal-close" (click)="closeCodModal()" aria-label="Close">
                <app-icon name="x" [size]="20"></app-icon>
              </button>
            </div>
            <div class="az-order-detail__modal-body">
              <p class="az-order-detail__modal-desc">
                {{ isArabic()
                  ? 'بالنقر على تأكيد، فإنك تؤكد رغبتك وجديتك في استلام شحنة الكتب وسداد قيمتها عند التسليم لمندوب التوصيل.'
                  : 'By confirming, you agree to receive the order and pay the full cash amount upon delivery.'
                }}
              </p>
            </div>
            <div class="az-order-detail__modal-actions">
              <button type="button" class="az-order-detail__modal-cancel-btn" (click)="closeCodModal()">
                {{ isArabic() ? 'إلغاء' : 'Cancel' }}
              </button>
              <button
                type="button"
                class="az-order-detail__modal-action-btn"
                [disabled]="orderStore.isConfirmingCod()"
                (click)="onConfirmCod()"
              >
                @if (orderStore.isConfirmingCod()) {
                  <span>{{ isArabic() ? 'جاري التأكيد...' : 'Confirming...' }}</span>
                } @else {
                  <span>{{ isArabic() ? 'نعم، أؤكد الطلب' : 'Yes, Confirm Order' }}</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./order-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly localeService = inject(LocaleService);
  readonly orderStore = inject(OrderDetailStore);
  private readonly appConfigStore = inject(AppConfigStore);
  private readonly toast = inject(ToastService);

  readonly isArabic = computed(() => this.localeService.currentLocale() !== 'en');
  readonly order = computed(() => this.orderStore.order());
  readonly payment = computed(() => this.orderStore.payment());
  readonly trackingSteps = computed(() => this.orderStore.getTrackingSteps());

  readonly showCancelModal = signal<boolean>(false);
  cancelReason = '';

  readonly showCodModal = signal<boolean>(false);

  readonly canCancelOrder = computed(() => {
    return this.order()?.status === 'pending_review';
  });

  readonly canConfirmCod = computed(() => {
    return this.order()?.status === 'customer_confirmation_required';
  });

  readonly canInitiateReturn = computed(() => {
    return this.order()?.status === 'completed';
  });

  readonly paymentMethodName = computed(() => {
    const key = this.order()?.paymentMethodKey;
    if (key === 'cash_on_delivery') return this.isArabic() ? 'الدفع نقداً عند الاستلام' : 'Cash on Delivery';
    if (key === 'instant_payment') return this.isArabic() ? 'تحويل فوري (إنستاباي / إنستاباي بنكي)' : 'InstaPay Instant Transfer';
    if (key === 'digital_wallet') return this.isArabic() ? 'محفظة إلكترونية (فودافون كاش، أورنج، اتصالات)' : 'E-Wallet';
    return key || '—';
  });

  readonly whatsappOrderUrl = computed(() => {
    const ord = this.order();
    const phone = this.appConfigStore.whatsappNumber();
    if (!ord || !phone) return null;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      this.isArabic()
        ? `السلام عليكم، بخصوص طلبي من مكتبة الأزهري برقم: ${ord.reference}`
        : `Hello, inquiring about my Al-Azhari Library order ref: ${ord.reference}`,
    );
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const reference = params.get('reference');
      const guestToken = this.route.snapshot.queryParamMap.get('token') || undefined;
      if (reference) {
        this.orderStore.loadOrder(reference, guestToken).subscribe();
      }
    });
  }

  openCancelModal(): void {
    this.cancelReason = '';
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
  }

  onConfirmCancel(): void {
    this.orderStore.cancelOrder(this.cancelReason.trim() || undefined).subscribe({
      next: () => {
        this.closeCancelModal();
        this.toast.success(
          this.isArabic() ? 'تم إلغاء الطلب بنجاح.' : 'Order cancelled successfully.',
        );
      },
      error: (err) => {
        this.toast.error(
          err?.message || (this.isArabic() ? 'تعذر إلغاء الطلب.' : 'Failed to cancel order.'),
        );
      },
    });
  }

  openCodConfirmModal(): void {
    this.showCodModal.set(true);
  }

  closeCodModal(): void {
    this.showCodModal.set(false);
  }

  onConfirmCod(): void {
    this.orderStore.confirmCodOrder().subscribe({
      next: () => {
        this.closeCodModal();
        this.toast.success(
          this.isArabic() ? 'تم تأكيد طلب الدفع عند الاستلام بنجاح!' : 'COD order confirmed!',
        );
      },
      error: (err) => {
        this.toast.error(
          err?.message || (this.isArabic() ? 'تعذر تأكيد الطلب.' : 'Failed to confirm COD order.'),
        );
      },
    });
  }
}
