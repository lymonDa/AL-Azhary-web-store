import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { FormFieldComponent } from '../../../shared/forms/form-field/form-field.component';
import { TextInputComponent } from '../../../shared/forms/input/text-input.component';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-reset-password',
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
        <h1 class="az-auth-header__title">إعادة تعيين كلمة المرور</h1>
        <p class="az-auth-header__desc">أدخل كلمة المرور الجديدة لحسابك</p>
      </div>

      @if (!token()) {
        <div class="az-auth-alert" role="alert">
          <span class="az-auth-alert__icon" aria-hidden="true">⚠️</span>
          <span class="az-auth-alert__text">
            رابط إعادة التعيين غير صالح أو مفقود. يرجى طلب رابط جديد.
          </span>
        </div>
        <div class="az-auth-footer">
          <app-button routerLink="/forgot-password" variant="primary" size="md">
            طلب رابط جديد
          </app-button>
        </div>
      } @else if (isReset()) {
        <div class="az-auth-success" role="status">
          <span class="az-auth-success__icon" aria-hidden="true">✅</span>
          <h2 class="az-auth-success__title">تم تغيير كلمة المرور بنجاح</h2>
          <p class="az-auth-success__desc">
            يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.
          </p>
          <div class="az-auth-success__action">
            <app-button routerLink="/login" variant="primary" size="md">
              تسجيل الدخول
            </app-button>
          </div>
        </div>
      } @else {
        @if (authStore.error()) {
          <div class="az-auth-alert" role="alert" aria-live="polite">
            <span class="az-auth-alert__icon" aria-hidden="true">⚠️</span>
            <span class="az-auth-alert__text">{{ authStore.error() }}</span>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="az-auth-form" novalidate>
          <app-form-field
            label="كلمة المرور الجديدة"
            [error]="getNewPasswordError()"
            [required]="true"
            forId="reset-new-password"
            hint="8 أحرف على الأقل"
          >
            <app-text-input
              id="reset-new-password"
              type="password"
              formControlName="newPassword"
              placeholder="••••••••"
              autocomplete="new-password"
              [invalid]="!!getNewPasswordError()"
              prefixIcon="lock"
            />
          </app-form-field>

          <app-form-field
            label="تأكيد كلمة المرور الجديدة"
            [error]="getConfirmPasswordError()"
            [required]="true"
            forId="reset-confirm-password"
          >
            <app-text-input
              id="reset-confirm-password"
              type="password"
              formControlName="confirmPassword"
              placeholder="••••••••"
              autocomplete="new-password"
              [invalid]="!!getConfirmPasswordError()"
              prefixIcon="lock"
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
            حفظ كلمة المرور الجديدة
          </app-button>
        </form>
      }
    </app-card>
  `,
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);

  protected readonly token = signal<string>('');
  protected readonly isReset = signal(false);

  readonly form = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [passwordMatchValidator],
    },
  );

  ngOnInit(): void {
    this.authStore.clearError();
    const queryToken = this.route.snapshot.queryParamMap.get('token');
    if (queryToken && queryToken.trim().length > 0) {
      this.token.set(queryToken.trim());
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token() || this.authStore.isPending()) {
      this.form.markAllAsTouched();
      return;
    }

    const { newPassword } = this.form.getRawValue();

    this.authStore.resetPassword(this.token(), newPassword).subscribe({
      next: () => {
        this.isReset.set(true);
      },
    });
  }

  getNewPasswordError(): string | null {
    const c = this.form.controls.newPassword;
    if (c.touched && c.errors) {
      if (c.errors['required']) return 'يرجى إدخال كلمة المرور الجديدة.';
      if (c.errors['minlength']) return 'كلمة المرور يجب أن لا تقل عن 8 أحرف.';
    }
    return null;
  }

  getConfirmPasswordError(): string | null {
    const c = this.form.controls.confirmPassword;
    if (c.touched) {
      if (c.errors?.['required']) return 'يرجى تأكيد كلمة المرور.';
      if (this.form.errors?.['passwordMismatch']) return 'كلمتا المرور غير متطابقتين.';
    }
    return null;
  }
}
