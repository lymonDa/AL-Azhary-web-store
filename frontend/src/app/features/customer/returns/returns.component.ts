import { Component, ChangeDetectionStrategy, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../../core/i18n/locale.service';
import { AccountStore } from '../../../core/account/account.store';
import { StatusBadgeComponent } from '../../../shared/status/status-badge.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { DatePipe } from '../../../shared/pipes/date.pipe';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';

@Component({
  selector: 'app-account-returns',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatusBadgeComponent,
    SkeletonComponent,
    EmptyStateComponent,
    DatePipe,
    MoneyPipe,
  ],
  template: `
    <div class="az-returns" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">
      <div class="az-returns__header">
        <h1 class="az-returns__title">{{ isArabic() ? 'طلبات الإرجاع والاسترداد' : 'Returns & Refunds' }}</h1>
        <p class="az-returns__desc">
          {{ isArabic()
            ? 'متابعة طلبات إرجاع الكتب المستلمة في حال وجود عيب طباعة أو استلام صنف غير مطابق.'
            : 'Track return requests and refund status for eligible items.'
          }}
        </p>
      </div>

      @if (accountStore.isLoadingReturns()) {
        <div class="az-returns__skeleton-list">
          <div class="az-returns__card-skeleton">
            <app-skeleton width="180px" height="24px"></app-skeleton>
            <app-skeleton width="100%" height="40px" style="margin-top: 12px;"></app-skeleton>
          </div>
          <div class="az-returns__card-skeleton">
            <app-skeleton width="180px" height="24px"></app-skeleton>
            <app-skeleton width="100%" height="40px" style="margin-top: 12px;"></app-skeleton>
          </div>
        </div>
      } @else if (returns().length > 0) {
        <div class="az-returns__list">
          @for (ret of returns(); track ret.reference) {
            <div class="az-returns__card">
              <div class="az-returns__card-head">
                <div class="az-returns__meta">
                  <span class="az-returns__ref font-mono" dir="ltr">{{ ret.reference }}</span>
                  <span class="az-returns__order-link">
                    {{ isArabic() ? 'الطلب المرتبط: ' : 'Order: ' }}
                    <a [routerLink]="['/orders', ret.orderReference]" class="font-mono font-semibold">{{ ret.orderReference }}</a>
                  </span>
                  <span class="az-returns__date">{{ ret.createdAt | appDate:'datetime' }}</span>
                </div>
                <app-status-badge kind="return" [status]="ret.status"></app-status-badge>
              </div>

              <div class="az-returns__card-body">
                <div class="az-returns__items-count">
                  <span class="az-returns__sub-label">{{ isArabic() ? 'عدد الأصناف المراد إرجاعها:' : 'Items to return:' }}</span>
                  <span class="font-bold">{{ ret.items.length }}</span>
                </div>

                @if (ret.totalRefundAmount.amount > 0) {
                  <div class="az-returns__refund-amount">
                    <span class="az-returns__sub-label">{{ isArabic() ? 'مبلغ الاسترداد المقدر:' : 'Estimated Refund:' }}</span>
                    <span class="font-bold text-primary">{{ ret.totalRefundAmount | money }}</span>
                  </div>
                }

                @if (ret.customerNote) {
                  <div class="az-returns__note">
                    <span class="az-returns__sub-label">{{ isArabic() ? 'ملاحظة العميل:' : 'Customer Note:' }}</span>
                    <span>{{ ret.customerNote }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <app-empty-state
          icon="📦"
          [title]="isArabic() ? 'لا توجد طلبات إرجاع' : 'No return requests'"
          [description]="isArabic() ? 'يمكنك تقديم طلب إرجاع لأي طلب مكتمل من خلال صفحة تفاصيل الطلب.' : 'You can initiate returns from completed order pages.'"
          [actionText]="isArabic() ? 'عرض طلباتي' : 'View Orders'"
          actionRoute="/account/orders"
        ></app-empty-state>
      }
    </div>
  `,
  styleUrls: ['./returns.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountReturnsComponent implements OnInit {
  private readonly localeService = inject(LocaleService);
  readonly accountStore = inject(AccountStore);

  readonly isArabic = computed(() => this.localeService.currentLocale() !== 'en');
  readonly returns = computed(() => this.accountStore.returns());

  ngOnInit(): void {
    this.accountStore.loadReturns();
  }
}
