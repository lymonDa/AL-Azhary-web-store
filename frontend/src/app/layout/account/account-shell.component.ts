import { Component, ChangeDetectionStrategy, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { LocaleService } from '../../core/i18n/locale.service';
import { AuthStore } from '../../core/auth/auth.store';
import { AccountStore } from '../../core/account/account.store';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';

export interface AccountNavItem {
  readonly route: string;
  readonly labelAr: string;
  readonly labelEn: string;
  readonly icon: string;
  readonly exact?: boolean;
}

@Component({
  selector: 'app-account-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IconComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="az-account-shell" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">
      <div class="az-account-shell__container">
        <!-- Sidebar Navigation (Desktop & Tablet) -->
        <aside class="az-account-shell__sidebar" aria-label="Customer Account Navigation">
          <!-- Customer Identity Card -->
          <div class="az-account-shell__user-card">
            <div class="az-account-shell__avatar" aria-hidden="true">
              <app-icon name="user" [size]="24"></app-icon>
            </div>
            <div class="az-account-shell__user-info">
              @if (accountStore.isLoadingProfile() && !profile()) {
                <app-skeleton width="120px" height="18px"></app-skeleton>
                <app-skeleton width="160px" height="14px" style="margin-top: 4px;"></app-skeleton>
              } @else {
                <span class="az-account-shell__user-name">{{ userName() }}</span>
                <span class="az-account-shell__user-contact">{{ userContact() }}</span>
              }
            </div>
          </div>

          <!-- Navigation Links -->
          <nav class="az-account-shell__nav">
            <ul class="az-account-shell__nav-list" role="list">
              @for (item of navItems; track item.route) {
                <li class="az-account-shell__nav-item">
                  <a
                    [routerLink]="item.route"
                    routerLinkActive="az-account-shell__nav-link--active"
                    [routerLinkActiveOptions]="{ exact: !!item.exact }"
                    class="az-account-shell__nav-link"
                  >
                    <app-icon [name]="item.icon" [size]="20" class="az-account-shell__nav-icon"></app-icon>
                    <span class="az-account-shell__nav-label">
                      {{ isArabic() ? item.labelAr : item.labelEn }}
                    </span>
                  </a>
                </li>
              }

              <!-- Admin Link if Admin or Owner (Section 6 & 17) -->
              @if (isAdmin()) {
                <li class="az-account-shell__nav-item az-account-shell__nav-item--admin">
                  <a routerLink="/admin" class="az-account-shell__nav-link az-account-shell__nav-link--admin">
                    <app-icon name="shield" [size]="20" class="az-account-shell__nav-icon"></app-icon>
                    <span class="az-account-shell__nav-label">
                      {{ isArabic() ? 'لوحة تحكم الإدارة' : 'Admin Portal' }}
                    </span>
                  </a>
                </li>
              }
            </ul>
          </nav>

          <!-- Logout Button -->
          <div class="az-account-shell__footer">
            <button
              type="button"
              class="az-account-shell__logout-btn"
              (click)="onLogout()"
              [attr.aria-label]="isArabic() ? 'تسجيل الخروج من الحساب' : 'Logout of account'"
            >
              <app-icon name="log-out" [size]="18"></app-icon>
              <span>{{ isArabic() ? 'تسجيل الخروج' : 'Sign Out' }}</span>
            </button>
          </div>
        </aside>

        <!-- Main Content Area -->
        <main class="az-account-shell__content" id="account-content">
          <!-- Mobile Horizontal Menu -->
          <nav class="az-account-shell__mobile-nav" aria-label="Account Mobile Tabs">
            <div class="az-account-shell__mobile-tabs">
              @for (item of navItems; track item.route) {
                <a
                  [routerLink]="item.route"
                  routerLinkActive="az-account-shell__mobile-tab--active"
                  [routerLinkActiveOptions]="{ exact: !!item.exact }"
                  class="az-account-shell__mobile-tab"
                >
                  <app-icon [name]="item.icon" [size]="18"></app-icon>
                  <span>{{ isArabic() ? item.labelAr : item.labelEn }}</span>
                </a>
              }
            </div>
          </nav>

          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styleUrls: ['./account-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountShellComponent implements OnInit {
  private readonly localeService = inject(LocaleService);
  private readonly authStore = inject(AuthStore);
  readonly accountStore = inject(AccountStore);
  private readonly router = inject(Router);

  readonly isArabic = computed(() => this.localeService.currentLocale() !== 'en');
  readonly profile = computed(() => this.accountStore.profile() || this.authStore.user());

  readonly userName = computed(() => {
    const p = this.profile();
    return p?.name || (this.isArabic() ? 'مرحباً بك' : 'Welcome');
  });

  readonly userContact = computed(() => {
    const p = this.profile();
    return p?.phone || p?.email || '';
  });

  readonly isAdmin = computed(() => {
    const role = this.authStore.user()?.role;
    return role === 'admin' || role === 'owner';
  });

  readonly navItems: readonly AccountNavItem[] = [
    {
      route: '/account',
      labelAr: 'نظرة عامة',
      labelEn: 'Overview',
      icon: 'layout-dashboard',
      exact: true,
    },
    {
      route: '/account/orders',
      labelAr: 'طلباتي',
      labelEn: 'My Orders',
      icon: 'package',
    },
    {
      route: '/account/pre-orders',
      labelAr: 'الحجز المسبق',
      labelEn: 'Pre-Orders',
      icon: 'bookmark',
    },
    {
      route: '/account/addresses',
      labelAr: 'عناويني',
      labelEn: 'Addresses',
      icon: 'map-pin',
    },
    {
      route: '/account/payments',
      labelAr: 'سجل المدفوعات',
      labelEn: 'Payments',
      icon: 'credit-card',
    },
    {
      route: '/account/returns',
      labelAr: 'طلبات الإرجاع',
      labelEn: 'Returns',
      icon: 'rotate-ccw',
    },
    {
      route: '/account/profile',
      labelAr: 'الملف الشخصي',
      labelEn: 'Profile',
      icon: 'user',
    },
  ];

  ngOnInit(): void {
    // Proactively load profile & addresses on shell init
    if (this.authStore.isAuthenticated()) {
      this.accountStore.loadProfile().subscribe();
    }
  }

  onLogout(): void {
    this.authStore.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
    });
  }
}
