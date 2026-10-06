import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../../core/i18n/locale.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonComponent],
  template: `
    <div class="az-error-page">
      <div class="az-error-page__card">
        <span class="az-error-page__code" aria-hidden="true">404</span>
        <h1 class="az-error-page__title">
          {{ isArabic() ? 'الصفحة غير موجودة' : 'Page Not Found' }}
        </h1>
        <p class="az-error-page__description">
          {{
            isArabic()
              ? 'عذراً، لم نتمكن من العثور على الصفحة أو الكتاب المطلوب. قد يكون الرابط خاطئاً أو تم نقل المحتوى.'
              : 'Sorry, the requested page or product could not be found.'
          }}
        </p>
        <div class="az-error-page__actions">
          <app-button routerLink="/" variant="primary" size="md">
            {{ isArabic() ? 'العودة للرئيسية' : 'Return to Home' }}
          </app-button>
          <app-button routerLink="/shop" variant="secondary" size="md">
            {{ isArabic() ? 'تصفح المتجر' : 'Browse Bookstore' }}
          </app-button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './not-found.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  private readonly localeService = inject(LocaleService);

  protected isArabic(): boolean {
    return this.localeService.isArabic();
  }
}
