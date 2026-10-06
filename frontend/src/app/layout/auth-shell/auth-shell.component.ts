import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { LocaleService } from '../../core/i18n/locale.service';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="az-auth-shell">
      <header class="az-auth-shell__header">
        <div class="az-auth-shell__header-inner">
          <a routerLink="/" class="az-auth-shell__brand" aria-label="الصفحة الرئيسية">
            <span class="az-auth-shell__logo-icon" aria-hidden="true">📚</span>
            <div class="az-auth-shell__brand-text">
              <span class="az-auth-shell__title">مكتبة الأزهري</span>
              <span class="az-auth-shell__subtitle">AL-AZHARI LIBRARY</span>
            </div>
          </a>

          <div class="az-auth-shell__actions">
            <button
              type="button"
              class="az-auth-shell__lang-toggle"
              (click)="toggleLocale()"
              [attr.aria-label]="localeService.isArabic() ? 'Switch to English' : 'التحويل للغة العربية'"
            >
              {{ localeService.isArabic() ? 'English' : 'عربي' }}
            </button>
          </div>
        </div>
      </header>

      <main class="az-auth-shell__main">
        <div class="az-auth-shell__container">
          <router-outlet />
        </div>
      </main>

      <footer class="az-auth-shell__footer">
        <p class="az-auth-shell__copyright">
          © 2026 مكتبة الأزهري — قنا، جمهورية مصر العربية. جميع الحقوق محفوظة.
        </p>
      </footer>
    </div>
  `,
  styleUrl: './auth-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShellComponent {
  protected readonly localeService = inject(LocaleService);

  toggleLocale(): void {
    const nextLocale = this.localeService.currentLocale() === 'ar' ? 'en' : 'ar';
    this.localeService.setLocale(nextLocale);
  }
}
