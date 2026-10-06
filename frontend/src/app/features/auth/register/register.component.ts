import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/auth/auth.store';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { FormFieldComponent } from '../../../shared/forms/form-field/form-field.component';
import { TextInputComponent } from '../../../shared/forms/input/text-input.component';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
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
        <h1 class="az-auth-header__title">إنشاء حساب جديد</h1>
        <p class="az-auth-header__desc">انضم إلى مجتمع قراء وباحثي مكتبة الأزهري</p>
      </div>

      @if (authStore.error()) {
        <div class="az-auth-alert" role="alert" aria-live="polite">
          <span class="az-auth-alert__icon" aria-hidden="true">⚠️</span>
          <span class="az-auth-alert__text">{{ authStore.error() }}</span>
        </div>
      }

      @if (isRegistered()) {
        <div class="az-auth-success" role="status">
          <span class="az-auth-success__icon" aria-hidden="true">✉️</span>
          <h2 class="az-auth-success__title">تم إنشاء الحساب بنجاح</h2>
          <p class="az-auth-success__desc">
            لقد أرسلنا رابط التحقق إلى بريدك الإلكتروني. يرجى تفعيل حسابك لتتمكن من استخدامه.
          </p>
          <div class="az-auth-success__action">
            <app-button routerLink="/login" variant="primary" size="md">
              الذهاب إلى تسجيل الدخول
            </app-button>
          </div>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="az-auth-form" novalidate>
          <app-form-field
            label="الاسم الكامل"
            [error]="getNameError()"
            [required]="true"
            forId="register-name"
          >
            <app-text-input
              id="register-name"
              type="text"
              formControlName="name"
              placeholder="مثال: أحمد عبد الله"
              autocomplete="name"
              [invalid]="!!getNameError()"
              prefixIcon="user"
            />
          </app-form-field>

          <app-form-field
            label="البريد الإلكتروني"
            [error]="getEmailError()"
            [required]="true"
            forId="register-email"
          >
            <app-text-input
              id="register-email"
              type="email"
              formControlName="email"
              placeholder="example@domain.com"
              autocomplete="email"
              [invalid]="!!getEmailError()"
              prefixIcon="mail"
            />
          </app-form-field>

          <app-form-field
            label="رقم الهاتف"
            [error]="getPhoneError()"
            [required]="true"
            forId="register-phone"
            hint="رقم هاتف محمول مصري (مثال: 010xxxxxxxx) أو دولي"
          >
            <app-text-input
              id="register-phone"
              type="tel"
              formControlName="phone"
              placeholder="01012345678"
              autocomplete="tel"
              [invalid]="!!getPhoneError()"
              prefixIcon="phone"
            />
          </app-form-field>

          <app-form-field
            label="كلمة المرور"
            [error]="getPasswordError()"
            [required]="true"
            forId="register-password"
            hint="8 أحرف على الأقل"
          >
            <app-text-input
              id="register-password"
              type="password"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="new-password"
              [invalid]="!!getPasswordError()"
              prefixIcon="lock"
            />
          </app-form-field>

          <app-form-field
            label="تأكيد كلمة المرور"
            [error]="getConfirmPasswordError()"
            [required]="true"
            forId="register-confirm-password"
          >
            <app-text-input
              id="register-confirm-password"
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
            إنشاء الحساب
          </app-button>
        </form>

        <div class="az-auth-footer">
          <p class="az-auth-footer__text">
            لديك حساب بالفعل؟
            <a routerLink="/login" class="az-auth-link az-auth-link--highlight">
              تسجيل الدخول
            </a>
          </p>
        </div>
      }
    </app-card>
  `,
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent implements OnInit {
  protected readonly authStore = inject(AuthStore);
  private readonly fb = inject(NonNullableFormBuilder);

  protected isRegistered = signal(false);

  readonly form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(?:\+?20|0)?1[0125]\d{8}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [passwordMatchValidator],
    },
  );

  ngOnInit(): void {
    this.authStore.clearError();
  }

  onSubmit(): void {
    if (this.form.invalid || this.authStore.isPending()) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, phone, password } = this.form.getRawValue();

    this.authStore
      .register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      })
      .subscribe({
        next: () => {
          this.isRegistered.set(true);
        },
      });
  }

  getNameError(): string | null {
    const c = this.form.controls.name;
    if (c.touched && c.errors) {
      if (c.errors['required']) return 'يرجى إدخال الاسم.';
      if (c.errors['minlength']) return 'الاسم يجب أن يحتوي على حرفين على الأقل.';
    }
    return null;
  }

  getEmailError(): string | null {
    const c = this.form.controls.email;
    if (c.touched && c.errors) {
      if (c.errors['required']) return 'يرجى إدخال البريد الإلكتروني.';
      if (c.errors['email']) return 'صيغة البريد الإلكتروني غير صحيحة.';
    }
    return null;
  }

  getPhoneError(): string | null {
    const c = this.form.controls.phone;
    if (c.touched && c.errors) {
      if (c.errors['required']) return 'يرجى إدخال رقم الهاتف.';
      if (c.errors['pattern']) return 'يرجى إدخال رقم محمول مصري صحيح (11 رقماً).';
    }
    return null;
  }

  getPasswordError(): string | null {
    const c = this.form.controls.password;
    if (c.touched && c.errors) {
      if (c.errors['required']) return 'يرجى إدخال كلمة المرور.';
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
