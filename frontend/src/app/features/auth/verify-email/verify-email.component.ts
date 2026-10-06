import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, CardComponent, ButtonComponent],
  template: `
    <app-card class="az-auth-card">
      <div class="az-auth-header">
        <h1 class="az-auth-header__title">تأكيد البريد الإلكتروني</h1>
      </div>

      @if (isLoading()) {
        <div class="az-verify-status" role="status">
          <div class="az-verify-spinner" aria-hidden="true"></div>
          <p class="az-verify-status__text">جارٍ تأكيد بريدك الإلكتروني...</p>
        </div>
      } @else if (isVerified()) {
        <div class="az-verify-status az-verify-status--success" role="status">
          <span class="az-verify-status__icon" aria-hidden="true">✅</span>
          <h2 class="az-verify-status__title">تم تأكيد البريد الإلكتروني بنجاح</h2>
          <p class="az-verify-status__text">
            أصبح حسابك مفعّلاً بالكامل الآن. يمكنك التمتع بجميع خدمات مكتبة الأزهري.
          </p>
          <div class="az-verify-status__action">
            <app-button routerLink="/login" variant="primary" size="md">
              تسجيل الدخول
            </app-button>
          </div>
        </div>
      } @else if (error()) {
        <div class="az-verify-status az-verify-status--error" role="alert">
          <span class="az-verify-status__icon" aria-hidden="true">❌</span>
          <h2 class="az-verify-status__title">تعذر تأكيد البريد</h2>
          <p class="az-verify-status__text">{{ error() }}</p>
          <div class="az-verify-status__action">
            <app-button routerLink="/login" variant="secondary" size="md">
              العودة لتسجيل الدخول
            </app-button>
          </div>
        </div>
      } @else {
        <div class="az-verify-status" role="status">
          <span class="az-verify-status__icon" aria-hidden="true">✉️</span>
          <p class="az-verify-status__text">
            يرجى فتح الرابط المرسل إلى بريدك الإلكتروني لإتمام عملية التحقق من الحساب.
          </p>
          <div class="az-verify-status__action">
            <app-button routerLink="/login" variant="secondary" size="md">
              الذهاب لتسجيل الدخول
            </app-button>
          </div>
        </div>
      }
    </app-card>
  `,
  styleUrl: './verify-email.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);

  protected readonly isLoading = signal(false);
  protected readonly isVerified = signal(false);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token && token.trim().length > 0) {
      this.verifyToken(token.trim());
    }
  }

  private verifyToken(token: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.authStore.verifyEmail(token).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isVerified.set(true);
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set('رابط التحقق غير صالح أو انتهت صلاحيته. يرجى التأكد من الرابط.');
      },
    });
  }
}
