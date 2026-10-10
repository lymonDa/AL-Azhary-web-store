import { Component, ChangeDetectionStrategy, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocaleService } from '../../../core/i18n/locale.service';
import { AccountStore } from '../../../core/account/account.store';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/status/status-badge.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { DatePipe } from '../../../shared/pipes/date.pipe';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';

@Component({
  selector: 'app-account-orders',
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
    <div class="az-orders" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">
      <div class="az-orders__header">
        <div class="az-orders__title-wrap">
          <h1 class="az-orders__title">{{ isArabic() ? 'طلباتي' : 'My Orders' }}</h1>
          <p class="az-orders__desc">
            {{ isArabic() ? 'سجل طلبات الكتب والمصنفات التراثية ومتابعة الشحن والتوصيل.' : 'History of book purchases and live order tracking.' }}
          </p>
        </div>
      </div>

      <!-- Quick Reference Lookup Box -->
      <div class="az-orders__lookup-box">
        <form (ngSubmit)="onSearchSubmit()" class="az-orders__lookup-form">
          <div class="az-orders__lookup-input-wrap">
            <app-icon name="search" [size]="18" class="az-orders__lookup-icon"></app-icon>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              name="searchQuery"
              class="az-orders__lookup-input"
              [placeholder]="isArabic() ? 'البحث أو المتابعة المباشرة برقم الطلب (مثال: AZ-2026-10001)...' : 'Search or track directly by order reference...'"
              dir="ltr"
            />
          </div>
          <button type="submit" class="az-orders__lookup-btn" [disabled]="!searchQuery.trim()">
            <span>{{ isArabic() ? 'متابعة' : 'Track' }}</span>
          </button>
        </form>
      </div>

      <!-- Orders List / Skeletons / Empty State -->
      @if (accountStore.isLoadingOrders()) {
        <div class="az-orders__list">
          <div class="az-orders__card-skeleton">
            <app-skeleton width="140px" height="24px"></app-skeleton>
            <app-skeleton width="220px" height="18px" style="margin-top: 8px;"></app-skeleton>
            <app-skeleton width="100%" height="48px" style="margin-top: 16px;"></app-skeleton>
          </div>
          <div class="az-orders__card-skeleton">
            <app-skeleton width="140px" height="24px"></app-skeleton>
            <app-skeleton width="220px" height="18px" style="margin-top: 8px;"></app-skeleton>
            <app-skeleton width="100%" height="48px" style="margin-top: 16px;"></app-skeleton>
          </div>
        </div>
      } @else if (orders().length > 0) {
        <div class="az-orders__list">
          @for (order of filteredOrders(); track order.reference) {
            <div class="az-orders__card">
              <div class="az-orders__card-header">
                <div class="az-orders__card-meta">
                  <span class="az-orders__ref font-mono" dir="ltr">{{ order.reference }}</span>
                  <span class="az-orders__date">{{ order.submittedAt | appDate:'datetime' }}</span>
                </div>
                <div class="az-orders__badges">
                  <!-- Separate Order & Payment Status Badges (Section 10) -->
                  <app-status-badge kind="order" [status]="order.status"></app-status-badge>
                  <app-status-badge kind="payment" [status]="order.paymentStatus"></app-status-badge>
                </div>
              </div>

              <!-- Items summary preview -->
              <div class="az-orders__card-items">
                <ul class="az-orders__items-list" role="list">
                  @for (item of order.items; track item.productId) {
                    <li class="az-orders__item-row">
                      <span class="az-orders__item-title">
                        {{ isArabic() ? item.name.ar : (item.name.en || item.name.ar) }}
                      </span>
                      <span class="az-orders__item-qty font-mono">×{{ item.quantity }}</span>
                      <span class="az-orders__item-total">{{ item.lineTotal | money }}</span>
                    </li>
                  }
                </ul>
              </div>

              <!-- Card Footer: Totals and Details Button -->
              <div class="az-orders__card-footer">
                <div class="az-orders__totals-summary">
                  <span class="az-orders__totals-label">{{ isArabic() ? 'إجمالي الطلب:' : 'Order Total:' }}</span>
                  <span class="az-orders__totals-amount font-bold">{{ order.totals.total | money }}</span>
                  <span class="az-orders__method-pill">
                    {{ order.fulfillment.method === 'pickup'
                      ? (isArabic() ? 'استلام من المكتبة' : 'Library Pickup')
                      : (isArabic() ? 'توصيل' : 'Delivery')
                    }}
                  </span>
                </div>

                <div class="az-orders__actions">
                  <a [routerLink]="['/orders', order.reference]" class="az-orders__details-btn">
                    <span>{{ isArabic() ? 'عرض التفاصيل والتتبع' : 'Details & Tracking' }}</span>
                    <app-icon name="arrow-left" [size]="16"></app-icon>
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <app-empty-state
          icon="📦"
          [title]="isArabic() ? 'لا توجد طلبات مسجلة' : 'No orders found'"
          [description]="isArabic() ? 'لم تسجل أي طلبات حتى الآن، أو يمكنك إدخال رقم الطلب المرجعي بالأعلى للاطلاع المباشر على تفاصيله.' : 'No orders in your account yet.'"
          [actionText]="isArabic() ? 'تصفح الكتب' : 'Browse Catalog'"
          actionRoute="/shop"
        ></app-empty-state>
      }
    </div>
  `,
  styleUrls: ['./account-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountOrdersComponent implements OnInit {
  private readonly localeService = inject(LocaleService);
  readonly accountStore = inject(AccountStore);
  private readonly router = inject(Router);

  searchQuery = '';

  readonly isArabic = computed(() => this.localeService.currentLocale() !== 'en');
  readonly orders = computed(() => this.accountStore.orders());

  readonly filteredOrders = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.orders();
    return this.orders().filter((o) =>
      o.reference.toLowerCase().includes(q) ||
      o.items.some((it) => it.name.ar.toLowerCase().includes(q) || (it.name.en?.toLowerCase().includes(q))),
    );
  });

  ngOnInit(): void {
    this.accountStore.loadOrders();
  }

  onSearchSubmit(): void {
    const q = this.searchQuery.trim();
    if (q) {
      // If it looks like a full order reference, navigate directly to order detail page
      if (q.toUpperCase().startsWith('AZ-') || q.length > 6) {
        this.router.navigate(['/orders', q]);
      }
    }
  }
}
