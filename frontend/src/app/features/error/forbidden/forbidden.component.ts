import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../../core/i18n/locale.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent],
  template: `
    <div class="az-error-page">
      <div class="az-error-page__card">
        <span class="az-error-page__code" aria-hidden="true">403</span>
        <h1 class="az-error-page__title">
          {{ isArabic() ? 'غير مصرح بالدخول' : 'Access Forbidden' }}
        </h1>
        <p class="az-error-page__description">
          {{
            isArabic()
              ? 'عذراً، ليس لديك الصلاحية الكافية للوصول إلى هذه الصفحة أو المورد.'
              : 'Sorry, you do not have permission to access this page or resource.'
          }}
        </p>
        <div class="az-error-page__actions">
          <app-button routerLink="/" variant="primary" size="md">
            {{ isArabic() ? 'العودة للرئيسية' : 'Return to Home' }}
          </app-button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './forbidden.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenComponent {
  private readonly localeService = inject(LocaleService);

  protected isArabic(): boolean {
    return this.localeService.isArabic();
  }
}
