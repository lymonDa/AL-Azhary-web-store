import { Component, ChangeDetectionStrategy, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocaleService } from '../../../core/i18n/locale.service';
import { AccountStore } from '../../../core/account/account.store';
import { AppConfigStore } from '../../../core/config/app-config.store';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/status/status-badge.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { DatePipe } from '../../../shared/pipes/date.pipe';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';

@Component({
  selector: 'app-account-overview',
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
    <div class="az-overview" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">
      <!-- 1. GREETING BANNER -->
      <section class="az-overview__banner">
        <div class="az-overview__banner-content">
          <div class="az-overview__greeting-row">
            <h1 class="az-overview__greeting">
              {{ isArabic() ? 'مرحباً، ' : 'Welcome, ' }}
              @if (accountStore.isLoadingProfile() && !profile()) {
                <app-skeleton width="180px" height="28px" style="display: inline-block; vertical-align: middle;"></app-skeleton>
              } @else {
                <span>{{ profile()?.name || (isArabic() ? 'قارئنا الكريم' : 'Valued Patron') }}</span>
              }
            </h1>
            <span class="az-overview__verified-pill">
              <app-icon name="check" [size]="14"></app-icon>
              <span>{{ isArabic() ? 'حساب موثق' : 'Verified Account' }}</span>
            </span>
          </div>

          <p class="az-overview__subtitle">
            {{ isArabic() ? 'مكتبة الأزهري — الصرح العلمي والتراثي بقنا' : 'Al-Azhari Library — Scholarly Heritage in Qena' }}
          </p>

          <div class="az-overview__meta-chips">
            <div class="az-overview__chip">
              <span class="az-overview__chip-label">{{ isArabic() ? 'رقم العميل:' : 'Patron ID:' }}</span>
              <span class="az-overview__chip-val font-mono">{{ patronId() }}</span>
            </div>
            <div class="az-overview__chip">
              <app-icon name="phone" [size]="14"></app-icon>
              <span dir="ltr">{{ profile()?.phone || '—' }}</span>
            </div>
          </div>
        </div>

        <div class="az-overview__banner-actions">
          @if (whatsappUrl()) {
            <a
              [href]="whatsappUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="az-overview__whatsapp-btn"
            >
              <app-icon name="message-circle" [size]="18"></app-icon>
              <span>{{ isArabic() ? 'دعم واتساب الفوري' : 'WhatsApp Support' }}</span>
            </a>
          }
          <a routerLink="/account/profile" class="az-overview__edit-btn">
            <app-icon name="user" [size]="18"></app-icon>
            <span>{{ isArabic() ? 'تعديل البيانات' : 'Edit Profile' }}</span>
          </a>
        </div>
      </section>

      <!-- 2. QUICK SHORTCUTS GRID -->
      <section class="az-overview__shortcuts" aria-label="Account Shortcuts">
        <a routerLink="/account/orders" class="az-overview__shortcut-card">
          <div class="az-overview__shortcut-icon az-overview__shortcut-icon--primary">
            <app-icon name="package" [size]="22"></app-icon>
          </div>
          <div class="az-overview__shortcut-text">
            <span class="az-overview__shortcut-title">{{ isArabic() ? 'طلبات الكتب' : 'Book Orders' }}</span>
            <span class="az-overview__shortcut-desc">{{ isArabic() ? 'متابعة الشحن والتوصيل' : 'Track shipping & delivery' }}</span>
          </div>
        </a>

        <a routerLink="/account/pre-orders" class="az-overview__shortcut-card">
          <div class="az-overview__shortcut-icon az-overview__shortcut-icon--secondary">
            <app-icon name="bookmark" [size]="22"></app-icon>
          </div>
          <div class="az-overview__shortcut-text">
            <span class="az-overview__shortcut-title">{{ isArabic() ? 'الحجز المسبق' : 'Pre-Orders' }}</span>
            <span class="az-overview__shortcut-desc">{{ isArabic() ? 'حجوزات المصنفات القادمة' : 'Upcoming book reservations' }}</span>
          </div>
        </a>

        <a routerLink="/account/addresses" class="az-overview__shortcut-card">
          <div class="az-overview__shortcut-icon az-overview__shortcut-icon--info">
            <app-icon name="map-pin" [size]="22"></app-icon>
          </div>
          <div class="az-overview__shortcut-text">
            <span class="az-overview__shortcut-title">{{ isArabic() ? 'دفتر العناوين' : 'Saved Addresses' }}</span>
            <span class="az-overview__shortcut-desc">{{ isArabic() ? 'عناوين التوصيل والاستلام' : 'Delivery destinations' }}</span>
          </div>
        </a>

        <a routerLink="/account/payments" class="az-overview__shortcut-card">
          <div class="az-overview__shortcut-icon az-overview__shortcut-icon--success">
            <app-icon name="credit-card" [size]="22"></app-icon>
          </div>
          <div class="az-overview__shortcut-text">
            <span class="az-overview__shortcut-title">{{ isArabic() ? 'سجل المدفوعات' : 'Payment History' }}</span>
            <span class="az-overview__shortcut-desc">{{ isArabic() ? 'إشعارات التحويل والمحافظ' : 'Transfer & wallet receipts' }}</span>
          </div>
        </a>
      </section>

      <!-- 3. DIRECT ORDER TRACKING LOOKUP TOOL -->
      <section class="az-overview__lookup-card">
        <div class="az-overview__lookup-header">
          <app-icon name="search" [size]="20" class="text-primary"></app-icon>
          <h2 class="az-overview__lookup-title">{{ isArabic() ? 'متابعة طلب برقم الإشارة' : 'Track Order by Reference' }}</h2>
        </div>
        <p class="az-overview__lookup-desc">
          {{ isArabic() ? 'أدخل رقم الطلب المرجعي (مثل AZ-2026-XXXXX) للاطلاع المباشر على تفاصيل الشحن والجدول الزمني.' : 'Enter your order reference code to track live delivery timeline.' }}
        </p>
        <form (ngSubmit)="onTrackSubmit()" class="az-overview__lookup-form">
          <input
            type="text"
            [(ngModel)]="searchReference"
            name="searchReference"
            class="az-overview__lookup-input"
            [placeholder]="isArabic() ? 'رقم الطلب (مثال: AZ-2026-10001)' : 'Order reference (e.g. AZ-2026-10001)'"
            required
            dir="ltr"
          />
          <button type="submit" class="az-overview__lookup-btn" [disabled]="!searchReference.trim()">
            <app-icon name="arrow-right" [size]="18"></app-icon>
            <span>{{ isArabic() ? 'متابعة الطلب' : 'Track Order' }}</span>
          </button>
        </form>
      </section>

      <!-- 4. RECENT ORDERS SECTION -->
      <section class="az-overview__orders-section">
        <div class="az-overview__section-header">
          <div class="az-overview__section-title-wrap">
            <h2 class="az-overview__section-title">{{ isArabic() ? 'الطلبات الأخيرة' : 'Recent Orders' }}</h2>
            <span class="az-overview__section-badge">{{ orders().length }}</span>
          </div>
          <a routerLink="/account/orders" class="az-overview__view-all-link">
            <span>{{ isArabic() ? 'عرض كل الطلبات' : 'View all orders' }}</span>
            <app-icon name="chevron-left" [size]="16"></app-icon>
          </a>
        </div>

        @if (accountStore.isLoadingOrders()) {
          <div class="az-overview__skeleton-list">
            <div class="az-overview__order-card-skeleton">
              <app-skeleton width="140px" height="20px"></app-skeleton>
              <app-skeleton width="80px" height="24px"></app-skeleton>
            </div>
            <div class="az-overview__order-card-skeleton">
              <app-skeleton width="140px" height="20px"></app-skeleton>
              <app-skeleton width="80px" height="24px"></app-skeleton>
            </div>
          </div>
        } @else if (orders().length > 0) {
          <div class="az-overview__orders-list">
            @for (order of recentOrders(); track order.reference) {
              <div class="az-overview__order-card">
                <div class="az-overview__order-main">
                  <div class="az-overview__order-head">
                    <span class="az-overview__order-ref font-mono" dir="ltr">{{ order.reference }}</span>
                    <app-status-badge kind="order" [status]="order.status"></app-status-badge>
                  </div>
                  <div class="az-overview__order-sub">
                    <span class="az-overview__order-date">
                      {{ order.submittedAt | appDate:'datetime' }}
                    </span>
                    <span class="az-overview__dot">•</span>
                    <span class="az-overview__order-items">
                      {{ order.items.length }} {{ isArabic() ? 'أصناف' : 'items' }}
                    </span>
                    <span class="az-overview__dot">•</span>
                    <span class="az-overview__order-total font-semibold">
                      {{ order.totals.total | money }}
                    </span>
                  </div>
                </div>
                <div class="az-overview__order-action">
                  <a [routerLink]="['/orders', order.reference]" class="az-overview__order-link">
                    <span>{{ isArabic() ? 'التفاصيل' : 'Details' }}</span>
                    <app-icon name="arrow-left" [size]="16"></app-icon>
                  </a>
                </div>
              </div>
            }
          </div>
        } @else {
          <app-empty-state
            icon="📦"
            [title]="isArabic() ? 'لا توجد طلبات سابقة حتى الآن' : 'No previous orders yet'"
            [description]="isArabic() ? 'تصفح المتجر والمصنفات التراثية وأضف ما ترغب به إلى السلة.' : 'Explore our catalog and physical Islamic publications.'"
            [actionText]="isArabic() ? 'تصفح الكتب' : 'Browse Catalog'"
            actionRoute="/shop"
          ></app-empty-state>
        }
      </section>
    </div>
  `,
  styleUrls: ['./account-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountOverviewComponent implements OnInit {
  private readonly localeService = inject(LocaleService);
  readonly accountStore = inject(AccountStore);
  private readonly appConfigStore = inject(AppConfigStore);
  private readonly router = inject(Router);

  searchReference = '';

  readonly isArabic = computed(() => this.localeService.currentLocale() !== 'en');
  readonly profile = computed(() => this.accountStore.profile());
  readonly orders = computed(() => this.accountStore.orders());
  readonly recentOrders = computed(() => this.orders().slice(0, 3));

  readonly patronId = computed(() => {
    const id = this.profile()?.id;
    return id ? `AZ-${id.substring(id.length - 6).toUpperCase()}` : 'AZ-CUSTOMER';
  });

  readonly whatsappUrl = computed(() => {
    const phone = this.appConfigStore.whatsappNumber();
    return phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}` : null;
  });

  ngOnInit(): void {
    this.accountStore.loadProfile().subscribe();
    this.accountStore.loadOrders();
    this.accountStore.loadPreorders();
  }

  onTrackSubmit(): void {
    const ref = this.searchReference.trim();
    if (ref) {
      this.router.navigate(['/orders', ref]);
    }
  }
}
