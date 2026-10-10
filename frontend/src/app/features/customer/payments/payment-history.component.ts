import { Component, ChangeDetectionStrategy, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../../core/i18n/locale.service';
import { AccountStore } from '../../../core/account/account.store';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/status/status-badge.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { DatePipe } from '../../../shared/pipes/date.pipe';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    StatusBadgeComponent,
    SkeletonComponent,
    EmptyStateComponent,
    DatePipe,
    MoneyPipe,
  ],
  template: `
    <div class="az-payments" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">
      <div class="az-payments__header">
        <h1 class="az-payments__title">{{ isArabic() ? 'سجل المدفوعات' : 'Payment History' }}</h1>
        <p class="az-payments__desc">
          {{ isArabic()
            ? 'سجل المعاملات المالية، والتحويلات البنكية وإشعارات الدفع الخاصة بطلباتك.'
            : 'Payment receipts and verification records for your orders.'
          }}
        </p>
      </div>

      @if (accountStore.isLoadingOrders()) {
        <div class="az-payments__skeleton-list">
          <div class="az-payments__card-skeleton">
            <app-skeleton width="140px" height="20px"></app-skeleton>
            <app-skeleton width="80px" height="20px"></app-skeleton>
          </div>
          <div class="az-payments__card-skeleton">
            <app-skeleton width="140px" height="20px"></app-skeleton>
            <app-skeleton width="80px" height="20px"></app-skeleton>
          </div>
        </div>
      } @else if (orders().length > 0) {
        <div class="az-payments__table-card">
          <table class="az-payments__table" role="table">
            <thead>
              <tr>
                <th scope="col">{{ isArabic() ? 'رقم الطلب' : 'Order Ref' }}</th>
                <th scope="col">{{ isArabic() ? 'طريقة الدفع' : 'Method' }}</th>
                <th scope="col">{{ isArabic() ? 'المبلغ' : 'Amount' }}</th>
                <th scope="col">{{ isArabic() ? 'حالة السداد' : 'Payment Status' }}</th>
                <th scope="col">{{ isArabic() ? 'التاريخ' : 'Date' }}</th>
                <th scope="col">{{ isArabic() ? 'الإجراء' : 'Action' }}</th>
              </tr>
            </thead>
            <tbody>
              @for (ord of orders(); track ord.reference) {
                <tr>
                  <td>
                    <span class="font-mono font-bold text-primary" dir="ltr">{{ ord.reference }}</span>
                  </td>
                  <td>{{ getMethodLabel(ord.paymentMethodKey) }}</td>
                  <td class="font-bold">{{ ord.totals.total | money }}</td>
                  <td>
                    <app-status-badge kind="payment" [status]="ord.paymentStatus"></app-status-badge>
                  </td>
                  <td class="text-xs">{{ ord.submittedAt | appDate:'date' }}</td>
                  <td>
                    <a [routerLink]="['/orders', ord.reference]" class="az-payments__link">
                      <span>{{ isArabic() ? 'التفاصيل' : 'Details' }}</span>
                      <app-icon name="arrow-left" [size]="14"></app-icon>
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <app-empty-state
          icon="💳"
          [title]="isArabic() ? 'لا توجد مدفوعات مسجلة' : 'No payments found'"
          [description]="isArabic() ? 'لم تسجل أي عمليات دفع أو إشعارات حتى الآن.' : 'No payment records available.'"
          [actionText]="isArabic() ? 'تصفح الكتب' : 'Browse Catalog'"
          actionRoute="/shop"
        ></app-empty-state>
      }
    </div>
  `,
  styleUrls: ['./payment-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentHistoryComponent implements OnInit {
  private readonly localeService = inject(LocaleService);
  readonly accountStore = inject(AccountStore);

  readonly isArabic = computed(() => this.localeService.currentLocale() !== 'en');
  readonly orders = computed(() => this.accountStore.orders());

  ngOnInit(): void {
    this.accountStore.loadOrders();
  }

  getMethodLabel(key: string): string {
    if (key === 'cash_on_delivery') return this.isArabic() ? 'الدفع عند الاستلام' : 'COD';
    if (key === 'instant_payment') return this.isArabic() ? 'إنستاباي فوري' : 'InstaPay';
    if (key === 'digital_wallet') return this.isArabic() ? 'محفظة إلكترونية' : 'E-Wallet';
    return key;
  }
}
