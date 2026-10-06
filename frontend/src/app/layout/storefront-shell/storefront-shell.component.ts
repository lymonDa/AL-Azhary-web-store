import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocaleService } from '../../core/i18n/locale.service';
import { AuthStore } from '../../core/auth/auth.store';
import { AppConfigStore } from '../../core/config/app-config.store';

@Component({
  selector: 'app-storefront-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
  ],
  template: `
    <a href="#main-content" class="az-skip-link">
      {{ isArabic() ? 'الانتقال إلى المحتوى الرئيسي' : 'Skip to main content' }}
    </a>

    <div class="az-storefront">
      <!-- HEADER -->
      <header class="az-header">
        <!-- Top Announcement Bar -->
        @if (serviceabilityText()) {
          <div class="az-header__topbar">
            <div class="az-header__container az-header__topbar-inner">
              <span class="az-header__topbar-text">{{ serviceabilityText() }}</span>
              <div class="az-header__topbar-actions">
                <button
                  type="button"
                  class="az-header__lang-toggle"
                  (click)="toggleLocale()"
                  [attr.aria-label]="isArabic() ? 'Switch to English' : 'التحويل للغة العربية'"
                >
                  {{ isArabic() ? 'English' : 'عربي' }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Main Navigation Bar -->
        <div class="az-header__main">
          <div class="az-header__container az-header__main-inner">
            <!-- Mobile Menu Toggle -->
            <button
              type="button"
              class="az-header__mobile-toggle"
              (click)="openMobileMenu()"
              [attr.aria-label]="isArabic() ? 'فتح القائمة الرئيسية' : 'Open main menu'"
              aria-controls="mobile-nav-drawer"
              [attr.aria-expanded]="mobileMenuOpen()"
            >
              <span class="az-header__hamburger-icon" aria-hidden="true">☰</span>
            </button>

            <!-- Brand Logo -->
            <a routerLink="/" class="az-header__brand" aria-label="مكتبة الأزهري">
              <span class="az-header__logo-icon" aria-hidden="true">📚</span>
              <div class="az-header__brand-text">
                <span class="az-header__title">مكتبة الأزهري</span>
                <span class="az-header__subtitle">AL-AZHARI LIBRARY</span>
              </div>
            </a>

            <!-- Search Quick Bar -->
            <form (ngSubmit)="onSearchSubmit()" class="az-header__search" role="search">
              <label for="header-search-input" class="sr-only">
                {{ isArabic() ? 'البحث في المتجر' : 'Search store' }}
              </label>
              <input
                id="header-search-input"
                type="search"
                [(ngModel)]="searchQuery"
                name="headerSearch"
                [placeholder]="isArabic() ? 'ابحث عن كتاب، مؤلف، أو مادة...' : 'Search books, authors...'"
                class="az-header__search-input"
              />
              <button
                type="submit"
                class="az-header__search-button"
                [attr.aria-label]="isArabic() ? 'تنفيذ البحث' : 'Submit search'"
              >
                🔍
              </button>
            </form>

            <!-- Header Desktop Navigation -->
            <nav class="az-header__nav" aria-label="التنقل الرئيسي">
              <a
                routerLink="/"
                routerLinkActive="az-header__nav-link--active"
                [routerLinkActiveOptions]="{ exact: true }"
                class="az-header__nav-link"
              >
                {{ isArabic() ? 'الرئيسية' : 'Home' }}
              </a>
              <a
                routerLink="/shop"
                routerLinkActive="az-header__nav-link--active"
                class="az-header__nav-link"
              >
                {{ isArabic() ? 'المتجر والكتب' : 'Shop' }}
              </a>
              <a
                routerLink="/search"
                routerLinkActive="az-header__nav-link--active"
                class="az-header__nav-link"
              >
                {{ isArabic() ? 'البحث' : 'Search' }}
              </a>
              <a
                routerLink="/contact"
                routerLinkActive="az-header__nav-link--active"
                class="az-header__nav-link"
              >
                {{ isArabic() ? 'تواصل معنا' : 'Contact' }}
              </a>
            </nav>

            <!-- Actions (WhatsApp + Auth) -->
            <div class="az-header__actions">
              @if (whatsappUrl()) {
                <a
                  [href]="whatsappUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="az-header__whatsapp-btn"
                  [attr.aria-label]="isArabic() ? 'تواصل عبر واتساب' : 'Contact via WhatsApp'"
                >
                  <span aria-hidden="true">💬</span>
                  <span class="az-header__whatsapp-label">{{ isArabic() ? 'واتساب' : 'WhatsApp' }}</span>
                </a>
              }

              <!-- Auth State -->
              @if (authStore.isAuthenticated()) {
                <div class="az-header__user-menu">
                  <span class="az-header__user-name">
                    {{ isArabic() ? 'أهلاً، ' : 'Hello, ' }}{{ authStore.user()?.name }}
                  </span>
                  <button
                    type="button"
                    (click)="onLogout()"
                    class="az-header__auth-btn az-header__auth-btn--logout"
                  >
                    {{ isArabic() ? 'خروج' : 'Logout' }}
                  </button>
                </div>
              } @else {
                <div class="az-header__auth-links">
                  <a routerLink="/login" class="az-header__auth-btn az-header__auth-btn--login">
                    {{ isArabic() ? 'دخول' : 'Login' }}
                  </a>
                  <a routerLink="/register" class="az-header__auth-btn az-header__auth-btn--register">
                    {{ isArabic() ? 'تسجيل' : 'Register' }}
                  </a>
                </div>
              }
            </div>
          </div>
        </div>
      </header>

      <!-- MOBILE DRAWER -->
      @if (mobileMenuOpen()) {
        <div
          class="az-mobile-drawer-backdrop"
          (click)="closeMobileMenu()"
          aria-hidden="true"
        ></div>
        <div
          id="mobile-nav-drawer"
          class="az-mobile-drawer"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="isArabic() ? 'القائمة الرئيسية' : 'Main menu'"
        >
          <div class="az-mobile-drawer__header">
            <span class="az-mobile-drawer__title">مكتبة الأزهري</span>
            <button
              type="button"
              class="az-mobile-drawer__close"
              (click)="closeMobileMenu()"
              [attr.aria-label]="isArabic() ? 'إغلاق القائمة' : 'Close menu'"
            >
              ✕
            </button>
          </div>

          <nav class="az-mobile-drawer__nav">
            <a routerLink="/" (click)="closeMobileMenu()" class="az-mobile-drawer__link">
              {{ isArabic() ? 'الرئيسية' : 'Home' }}
            </a>
            <a routerLink="/shop" (click)="closeMobileMenu()" class="az-mobile-drawer__link">
              {{ isArabic() ? 'المتجر والكتب' : 'Shop' }}
            </a>
            <a routerLink="/search" (click)="closeMobileMenu()" class="az-mobile-drawer__link">
              {{ isArabic() ? 'البحث' : 'Search' }}
            </a>
            <a routerLink="/contact" (click)="closeMobileMenu()" class="az-mobile-drawer__link">
              {{ isArabic() ? 'تواصل معنا' : 'Contact' }}
            </a>
          </nav>

          <div class="az-mobile-drawer__footer">
            @if (authStore.isAuthenticated()) {
              <p class="az-mobile-drawer__user">
                {{ isArabic() ? 'مسجل كـ: ' : 'Signed in as: ' }}{{ authStore.user()?.name }}
              </p>
              <button
                type="button"
                (click)="onLogout(); closeMobileMenu()"
                class="az-mobile-drawer__btn az-mobile-drawer__btn--danger"
              >
                {{ isArabic() ? 'تسجيل الخروج' : 'Logout' }}
              </button>
            } @else {
              <div class="az-mobile-drawer__auth-actions">
                <a
                  routerLink="/login"
                  (click)="closeMobileMenu()"
                  class="az-mobile-drawer__btn az-mobile-drawer__btn--primary"
                >
                  {{ isArabic() ? 'تسجيل الدخول' : 'Login' }}
                </a>
                <a
                  routerLink="/register"
                  (click)="closeMobileMenu()"
                  class="az-mobile-drawer__btn az-mobile-drawer__btn--secondary"
                >
                  {{ isArabic() ? 'إنشاء حساب جديد' : 'Register' }}
                </a>
              </div>
            }

            @if (whatsappUrl()) {
              <a
                [href]="whatsappUrl()"
                target="_blank"
                rel="noopener noreferrer"
                class="az-mobile-drawer__whatsapp"
              >
                💬 {{ isArabic() ? 'تواصل عبر واتساب' : 'WhatsApp Support' }}
              </a>
            }
          </div>
        </div>
      }

      <!-- MAIN OUTLET -->
      <main id="main-content" class="az-storefront__main">
        <router-outlet />
      </main>

      <!-- FOOTER -->
      <footer class="az-footer">
        <div class="az-footer__container">
          <div class="az-footer__grid">
            <!-- Brand Column -->
            <div class="az-footer__col">
              <div class="az-footer__brand">
                <span class="az-footer__logo-icon" aria-hidden="true">📚</span>
                <span class="az-footer__title">مكتبة الأزهري</span>
              </div>
              <p class="az-footer__desc">
                {{
                  isArabic()
                    ? 'مكتبة أزهرية وعلمية متكاملة توفر أحدث الكتب الدراسية والمراجع الأزهرية مع خدمات الشحن لكافة المحافظات.'
                    : 'Comprehensive library for Azhari textbooks and scholarly references with nationwide delivery.'
                }}
              </p>
            </div>

            <!-- Quick Links -->
            <div class="az-footer__col">
              <h4 class="az-footer__heading">{{ isArabic() ? 'روابط سريعة' : 'Quick Links' }}</h4>
              <ul class="az-footer__links">
                <li><a routerLink="/">{{ isArabic() ? 'الرئيسية' : 'Home' }}</a></li>
                <li><a routerLink="/shop">{{ isArabic() ? 'المتجر والكتب' : 'Shop' }}</a></li>
                <li><a routerLink="/search">{{ isArabic() ? 'البحث' : 'Search' }}</a></li>
                <li><a routerLink="/contact">{{ isArabic() ? 'تواصل معنا' : 'Contact' }}</a></li>
              </ul>
            </div>

            <!-- Working Hours -->
            <div class="az-footer__col">
              <h4 class="az-footer__heading">{{ isArabic() ? 'مواعيد العمل' : 'Business Hours' }}</h4>
              <p class="az-footer__info-item">
                {{ businessHoursText() }}
              </p>
              @if (contactAddress()) {
                <p class="az-footer__info-item">
                  📍 {{ contactAddress() }}
                </p>
              }
            </div>

            <!-- Contact Column -->
            <div class="az-footer__col">
              <h4 class="az-footer__heading">{{ isArabic() ? 'خدمة العملاء' : 'Customer Service' }}</h4>
              @if (contactPhone()) {
                <p class="az-footer__info-item">
                  📞 <span dir="ltr">{{ contactPhone() }}</span>
                </p>
              }
              @if (contactEmail()) {
                <p class="az-footer__info-item">
                  ✉️ <span dir="ltr">{{ contactEmail() }}</span>
                </p>
              }
              @if (whatsappUrl()) {
                <div class="az-footer__cta">
                  <a
                    [href]="whatsappUrl()"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="az-footer__whatsapp-link"
                  >
                    💬 {{ isArabic() ? 'دردشة عبر واتساب' : 'Chat on WhatsApp' }}
                  </a>
                </div>
              }
            </div>
          </div>

          <div class="az-footer__bottom">
            <p class="az-footer__copyright">
              © 2026 مكتبة الأزهري — قنا، جمهورية مصر العربية. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </footer>
    </div>
  `,
  styleUrl: './storefront-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorefrontShellComponent {
  private readonly router = inject(Router);
  protected readonly localeService = inject(LocaleService);
  protected readonly authStore = inject(AuthStore);
  protected readonly configStore = inject(AppConfigStore);

  protected searchQuery = '';
  protected readonly mobileMenuOpen = signal(false);

  protected isArabic(): boolean {
    return this.localeService.isArabic();
  }

  protected toggleLocale(): void {
    const nextLocale = this.localeService.currentLocale() === 'ar' ? 'en' : 'ar';
    this.localeService.setLocale(nextLocale);
  }

  protected openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected onSearchSubmit(): void {
    if (this.searchQuery.trim().length > 0) {
      this.router.navigate(['/search'], {
        queryParams: { q: this.searchQuery.trim() },
      });
      this.searchQuery = '';
      this.closeMobileMenu();
    }
  }

  protected onLogout(): void {
    this.authStore.logout().subscribe();
  }

  protected serviceabilityText(): string | null {
    const s = this.configStore.config().serviceabilityCopy;
    if (!s) return null;
    return this.isArabic() ? s.ar : s.en || s.ar;
  }

  protected businessHoursText(): string | null {
    const h = this.configStore.config().businessHours;
    if (!h) return null;
    return this.isArabic() ? h.ar : h.en || h.ar;
  }

  protected contactAddress(): string | null {
    const a = this.configStore.contact().address;
    if (!a) return null;
    return this.isArabic() ? a.ar : a.en || a.ar;
  }

  protected contactPhone(): string | null {
    return this.configStore.contact().phone || null;
  }

  protected contactEmail(): string | null {
    return this.configStore.contact().email || null;
  }

  protected whatsappUrl(): string | null {
    const rawNumber = this.configStore.contact().whatsappNumber;
    if (!rawNumber) return null;
    const sanitized = rawNumber.replace(/[^0-9]/g, '');
    return sanitized ? `https://wa.me/${sanitized}` : null;
  }
}
