import { Component, ChangeDetectionStrategy, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocaleService } from '../../../core/i18n/locale.service';
import { AccountStore } from '../../../core/account/account.store';
import { PreordersApi } from '../../../core/api/commerce/preorders-api.service';
import { ToastService } from '../../../shared/overlay/toast/toast.service';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/status/status-badge.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { DatePipe } from '../../../shared/pipes/date.pipe';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import type { CustomerPreorder } from '../../../domain/models/preorder.model';

@Component({
  selector: 'app-account-pre-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    StatusBadgeComponent,
    SkeletonComponent,
    EmptyStateComponent,
    DatePipe,
    MoneyPipe,
  ],
  template: `
    <div class="az-preorders" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">
      <div class="az-preorders__header">
        <h1 class="az-preorders__title">{{ isArabic() ? 'الحجز المسبق' : 'My Pre-Orders' }}</h1>
        <p class="az-preorders__desc">
          {{ isArabic()
            ? 'متابعة طلبات حجز المصنفات التراثية والكتب تحت الطبع أو التوفير بالمكتبة.'
            : 'Track reservations for forthcoming and awaiting-reprint editions.'
          }}
        </p>
      </div>

      @if (accountStore.isLoadingPreorders()) {
        <div class="az-preorders__skeleton-list">
          <div class="az-preorders__card-skeleton">
            <app-skeleton width="180px" height="24px"></app-skeleton>
            <app-skeleton width="100%" height="40px" style="margin-top: 12px;"></app-skeleton>
          </div>
          <div class="az-preorders__card-skeleton">
            <app-skeleton width="180px" height="24px"></app-skeleton>
            <app-skeleton width="100%" height="40px" style="margin-top: 12px;"></app-skeleton>
          </div>
        </div>
      } @else if (preorders().length > 0) {
        <div class="az-preorders__list">
          @for (item of preorders(); track item.reference) {
            <div class="az-preorders__card">
              <div class="az-preorders__card-head">
                <div class="az-preorders__meta">
                  <span class="az-preorders__ref font-mono" dir="ltr">{{ item.reference }}</span>
                  <span class="az-preorders__date">{{ item.createdAt | appDate:'datetime' }}</span>
                </div>
                <app-status-badge kind="preorder" [status]="item.status"></app-status-badge>
              </div>

              <div class="az-preorders__card-body">
                <div class="az-preorders__product">
                  @if (item.productSnapshot.image) {
                    <img [src]="item.productSnapshot.image" [alt]="item.productSnapshot.name.ar" class="az-preorders__thumb" />
                  } @else {
                    <div class="az-preorders__thumb-placeholder">
                      <app-icon name="bookmark" [size]="20"></app-icon>
                    </div>
                  }
                  <div class="az-preorders__details">
                    <span class="az-preorders__name font-semibold">
                      {{ isArabic() ? item.productSnapshot.name.ar : (item.productSnapshot.name.en || item.productSnapshot.name.ar) }}
                    </span>
                    @if (item.productSnapshot.variantLabel) {
                      <span class="az-preorders__variant">
                        {{ isArabic() ? item.productSnapshot.variantLabel.ar : (item.productSnapshot.variantLabel.en || item.productSnapshot.variantLabel.ar) }}
                      </span>
                    }
                    <div class="az-preorders__pricing">
                      <span class="az-preorders__qty font-mono">×{{ item.quantity }}</span>
                      <span class="az-preorders__dot">•</span>
                      <span class="az-preorders__price font-semibold">{{ item.price | money }}</span>
                    </div>
                  </div>
                </div>

                @if (item.expectedAvailabilityAt) {
                  <div class="az-preorders__availability-notice">
                    <app-icon name="calendar" [size]="16"></app-icon>
                    <span>
                      {{ isArabic() ? 'التاريخ المتوقع لتوفر النسخ بالمكتبة: ' : 'Expected availability: ' }}
                      <strong>{{ item.expectedAvailabilityAt | appDate:'date' }}</strong>
                    </span>
                  </div>
                }

                @if (item.rejectionReason) {
                  <div class="az-preorders__reason-notice">
                    <span class="font-semibold">{{ isArabic() ? 'سبب الرفض: ' : 'Rejection Reason: ' }}</span>
                    <span>{{ item.rejectionReason }}</span>
                  </div>
                }
              </div>

              <!-- Cancellation if in requested / admin_review status -->
              @if (canCancel(item.status)) {
                <div class="az-preorders__card-foot">
                  <button
                    type="button"
                    class="az-preorders__cancel-btn"
                    (click)="openCancelModal(item)"
                  >
                    <app-icon name="x" [size]="16"></app-icon>
                    <span>{{ isArabic() ? 'إلغاء طلب الحجز' : 'Cancel Reservation' }}</span>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <app-empty-state
          icon="🔖"
          [title]="isArabic() ? 'لا توجد حجوزات مسبقة' : 'No pre-orders found'"
          [description]="isArabic() ? 'يمكنك حجز الكتب والمصنفات غير المتوفرة حالياً من صفحات تفاصيل المنتجات.' : 'You can pre-order out-of-stock titles directly from product pages.'"
          [actionText]="isArabic() ? 'تصفح الكتب' : 'Browse Books'"
          actionRoute="/shop"
        ></app-empty-state>
      }

      <!-- CANCEL PREORDER CONFIRMATION MODAL -->
      @if (preorderToCancel(); as target) {
        <div class="az-preorders__modal-backdrop">
          <button
            type="button"
            class="az-preorders__modal-dismiss"
            tabindex="-1"
            aria-hidden="true"
            (click)="closeCancelModal()"
          ></button>
          <div class="az-preorders__modal" role="dialog" aria-modal="true">
            <div class="az-preorders__modal-header">
              <h2 class="az-preorders__modal-title">{{ isArabic() ? 'تأكيد إلغاء الحجز' : 'Cancel Pre-Order' }}</h2>
              <button type="button" class="az-preorders__modal-close" (click)="closeCancelModal()" aria-label="Close">
                <app-icon name="x" [size]="20"></app-icon>
              </button>
            </div>
            <div class="az-preorders__modal-body">
              <p class="az-preorders__modal-desc">
                {{ isArabic()
                  ? 'هل أنت متأكد من رغبتك في إلغاء حجز هذا المصنف؟'
                  : 'Are you sure you want to cancel this pre-order reservation?'
                }}
              </p>
              <div class="az-preorders__modal-item font-semibold">
                {{ target.productSnapshot.name.ar }} ({{ target.reference }})
              </div>
            </div>
            <div class="az-preorders__modal-actions">
              <button type="button" class="az-preorders__modal-btn az-preorders__modal-btn--secondary" (click)="closeCancelModal()">
                {{ isArabic() ? 'تراجع' : 'Back' }}
              </button>
              <button
                type="button"
                class="az-preorders__modal-btn az-preorders__modal-btn--danger"
                [disabled]="isCancelling()"
                (click)="confirmCancel(target.reference)"
              >
                @if (isCancelling()) {
                  <span>{{ isArabic() ? 'جاري الإلغاء...' : 'Cancelling...' }}</span>
                } @else {
                  <span>{{ isArabic() ? 'نعم، إلغاء الحجز' : 'Confirm Cancel' }}</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./pre-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPreOrdersComponent implements OnInit {
  private readonly localeService = inject(LocaleService);
  readonly accountStore = inject(AccountStore);
  private readonly preordersApi = inject(PreordersApi);
  private readonly toast = inject(ToastService);

  readonly isArabic = computed(() => this.localeService.currentLocale() !== 'en');
  readonly preorders = computed(() => this.accountStore.preorders());

  readonly preorderToCancel = signal<CustomerPreorder | null>(null);
  readonly isCancelling = signal<boolean>(false);

  ngOnInit(): void {
    this.accountStore.loadPreorders();
  }

  canCancel(status: string): boolean {
    return status === 'requested' || status === 'admin_review' || status === 'pending';
  }

  openCancelModal(item: CustomerPreorder): void {
    this.preorderToCancel.set(item);
  }

  closeCancelModal(): void {
    this.preorderToCancel.set(null);
    this.isCancelling.set(false);
  }

  confirmCancel(reference: string): void {
    this.isCancelling.set(true);
    this.preordersApi.cancelPreorder(reference).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.closeCancelModal();
        this.accountStore.loadPreorders();
        this.toast.success(
          this.isArabic() ? 'تم إلغاء طلب الحجز بنجاح.' : 'Pre-order reservation cancelled.',
        );
      },
      error: (err) => {
        this.isCancelling.set(false);
        this.toast.error(
          err?.message || (this.isArabic() ? 'تعذر إلغاء الحجز.' : 'Failed to cancel pre-order.'),
        );
      },
    });
  }
}
