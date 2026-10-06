import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { sanitizeReturnUrl } from '../../../core/auth/guards/auth.guard';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { FormFieldComponent } from '../../../shared/forms/form-field/form-field.component';
import { TextInputComponent } from '../../../shared/forms/input/text-input.component';

@Component({
  selector: 'app-login',
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
        <h1 class="az-auth-header__title">تسجيل الدخول</h1>
        <p class="az-auth-header__desc">أهلاً بك مجدداً في مكتبة الأزهري</p>
      </div>

      @if (authStore.error()) {
        <div class="az-auth-alert" role="alert" aria-live="polite">
          <span class="az-auth-alert__icon" aria-hidden="true">⚠️</span>
          <span class="az-auth-alert__text">{{ authStore.error() }}</span>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="az-auth-form" novalidate>
        <app-form-field
          label="البريد الإلكتروني أو رقم الهاتف"
          [error]="getIdentifierError()"
          [required]="true"
          forId="login-identifier"
        >
          <app-text-input
            id="login-identifier"
            type="text"
            formControlName="identifier"
            placeholder="example@domain.com أو 010xxxxxxxx"
            autocomplete="username"
            [invalid]="!!getIdentifierError()"
            prefixIcon="mail"
          />
        </app-form-field>

        <app-form-field
          label="كلمة المرور"
          [error]="getPasswordError()"
          [required]="true"
          forId="login-password"
        >
          <app-text-input
            id="login-password"
            type="password"
            formControlName="password"
            placeholder="••••••••"
            autocomplete="current-password"
            [invalid]="!!getPasswordError()"
            prefixIcon="lock"
          />
        </app-form-field>

        <div class="az-auth-actions-secondary">
          <a routerLink="/forgot-password" class="az-auth-link">نسيت كلمة المرور؟</a>
        </div>

        <app-button
          type="submit"
          variant="primary"
          size="lg"
          [fullWidth]="true"
          [disabled]="form.invalid || authStore.isPending()"
          [loading]="authStore.isPending()"
        >
          دخول
        </app-button>
      </form>

      <div class="az-auth-footer">
        <p class="az-auth-footer__text">
          ليس لديك حساب بعد؟
          <a routerLink="/register" class="az-auth-link az-auth-link--highlight">
            إنشاء حساب جديد
          </a>
        </p>
      </div>
    </app-card>
  `,
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private returnUrl = '/';

  readonly form = this.fb.group({
    identifier: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.authStore.clearError();
    const queryReturnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.returnUrl = sanitizeReturnUrl(queryReturnUrl);
  }

  onSubmit(): void {
    if (this.form.invalid || this.authStore.isPending()) {
      this.form.markAllAsTouched();
      return;
    }

    const { identifier, password } = this.form.getRawValue();

    this.authStore
      .login({
        identifier: identifier.trim(),
        password,
      })
      .subscribe({
        next: () => {
          this.router.navigateByUrl(this.returnUrl);
        },
      });
  }

  getIdentifierError(): string | null {
    const control = this.form.controls.identifier;
    if (control.touched && control.errors) {
      if (control.errors['required']) {
        return 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف.';
      }
      if (control.errors['minlength']) {
        return 'يجب أن يحتوي الإدخال على 3 أحرف على الأقل.';
      }
    }
    return null;
  }

  getPasswordError(): string | null {
    const control = this.form.controls.password;
    if (control.touched && control.errors) {
      if (control.errors['required']) {
        return 'يرجى إدخال كلمة المرور.';
      }
      if (control.errors['minlength']) {
        return 'كلمة المرور يجب أن لا تقل عن 8 أحرف.';
      }
    }
    return null;
  }
}
