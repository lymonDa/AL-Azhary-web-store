import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { FormFieldComponent } from '../../../shared/forms/form-field/form-field.component';
import { TextInputComponent } from '../../../shared/forms/input/text-input.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardComponent,
    ButtonComponent,
    FormFieldComponent,
    TextInputComponent,
  ],
  template: `
    <app-card class="az-auth-card">
      <div class="az-auth-header">
        <h1 class="az-auth-header__title">استعادة كلمة المرور</h1>
        <p class="az-auth-header__desc">أدخل بريدك الإلكتروني المسجل وسنرسل لك رابط إعادة التعيين</p>
      </div>

      @if (authStore.error()) {
        <div class="az-auth-alert" role="alert" aria-live="polite">
          <span class="az-auth-alert__icon" aria-hidden="true">⚠️</span>
          <span class="az-auth-alert__text">{{ authStore.error() }}</span>
        </div>
      }

      @if (isDispatched()) {
        <div class="az-auth-success" role="status">
          <span class="az-auth-success__icon" aria-hidden="true">📨</span>
          <h2 class="az-auth-success__title">تم إرسال الطلب</h2>
          <p class="az-auth-success__desc">
            إذا كان هذا البريد مسجلاً لدينا، فستصلك رسالة تحتوي على رابط لإعادة تعيين كلمة المرور خلال دقائق.
          </p>
          <div class="az-auth-success__action">
            <app-button routerLink="/login" variant="primary" size="md">
              العودة لتسجيل الدخول
            </app-button>
          </div>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="az-auth-form" novalidate>
          <app-form-field
            label="البريد الإلكتروني"
            [error]="getEmailError()"
            [required]="true"
            forId="forgot-email"
          >
            <app-text-input
              id="forgot-email"
              type="email"
              formControlName="email"
              placeholder="example@domain.com"
              autocomplete="email"
              [invalid]="!!getEmailError()"
              prefixIcon="mail"
            />
          </app-form-field>

          <app-button
            type="submit"
            variant="primary"
            size="lg"
            [fullWidth]="true"
            [disabled]="form.invalid || authStore.isPending()"
            [loading]="authStore.isPending()"
          >
            إرسال رابط الاستعادة
          </app-button>
        </form>

        <div class="az-auth-footer">
          <p class="az-auth-footer__text">
            تذكرت كلمة المرور؟
            <a routerLink="/login" class="az-auth-link az-auth-link--highlight">
              تسجيل الدخول
            </a>
          </p>
        </div>
      }
    </app-card>
  `,
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly isDispatched = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.authStore.clearError();
  }

  onSubmit(): void {
    if (this.form.invalid || this.authStore.isPending()) {
      this.form.markAllAsTouched();
      return;
    }

    const { email } = this.form.getRawValue();

    this.authStore.forgotPassword(email.trim().toLowerCase()).subscribe({
      next: () => {
        this.isDispatched.set(true);
      },
    });
  }

  getEmailError(): string | null {
    const c = this.form.controls.email;
    if (c.touched && c.errors) {
      if (c.errors['required']) return 'يرجى إدخال البريد الإلكتروني.';
      if (c.errors['email']) return 'صيغة البريد الإلكتروني غير صحيحة.';
    }
    return null;
  }
}
