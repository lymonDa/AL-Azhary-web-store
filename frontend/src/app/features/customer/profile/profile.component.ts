import { Component, ChangeDetectionStrategy, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LocaleService } from '../../../core/i18n/locale.service';
import { AccountStore } from '../../../core/account/account.store';
import { ToastService } from '../../../shared/overlay/toast/toast.service';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IconComponent,
    SkeletonComponent,
  ],
  template: `
    <div class="az-profile" [attr.dir]="isArabic() ? 'rtl' : 'ltr'">
      <div class="az-profile__header">
        <h1 class="az-profile__title">{{ isArabic() ? 'الملف الشخصي' : 'Customer Profile' }}</h1>
        <p class="az-profile__desc">
          {{ isArabic() ? 'إدارة معلومات الحساب الشخصية وبيانات التواصل المسجلة لدى مكتبة الأزهري.' : 'Manage your personal account details and registered phone number.' }}
        </p>
      </div>

      @if (accountStore.isLoadingProfile() && !profile()) {
        <div class="az-profile__skeleton-card">
          <app-skeleton width="100%" height="48px"></app-skeleton>
          <app-skeleton width="100%" height="48px" style="margin-top: 16px;"></app-skeleton>
          <app-skeleton width="100%" height="48px" style="margin-top: 16px;"></app-skeleton>
        </div>
      } @else {
        <div class="az-profile__card">
          <!-- Read-only Security Notice regarding Email -->
          <div class="az-profile__notice">
            <app-icon name="info" [size]="18" class="az-profile__notice-icon"></app-icon>
            <span class="az-profile__notice-text">
              {{ isArabic()
                ? 'البريد الإلكتروني ورقم العميل مخصصان لتوثيق الحساب ولا يمكن تعديلهما ذاتياً. لتغيير البريد يرجى التواصل مع إدارة المكتبة.'
                : 'Your email address and patron ID are verified identifiers and cannot be altered directly.'
              }}
            </span>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="az-profile__form">
            <!-- Full Name -->
            <div class="az-profile__field">
              <label for="name" class="az-profile__label">
                {{ isArabic() ? 'الاسم بالكامل' : 'Full Name' }} <span class="az-profile__required">*</span>
              </label>
              <input
                id="name"
                type="text"
                formControlName="name"
                class="az-profile__input"
                [class.az-profile__input--error]="isFieldInvalid('name')"
                [placeholder]="isArabic() ? 'أدخل اسمك الكريم' : 'Enter full name'"
              />
              @if (isFieldInvalid('name')) {
                <span class="az-profile__error">
                  {{ isArabic() ? 'الاسم مطلوب ويجب ألا يقل عن حرفين ولا يزيد عن 100 حرف' : 'Name must be between 2 and 100 characters' }}
                </span>
              }
            </div>

            <!-- Email (Read-Only) -->
            <div class="az-profile__field">
              <label for="email" class="az-profile__label">
                {{ isArabic() ? 'البريد الإلكتروني (للتوثيق فقط)' : 'Email Address (Read-only)' }}
              </label>
              <div class="az-profile__readonly-box">
                <input
                  id="email"
                  type="email"
                  [value]="profile()?.email"
                  disabled
                  class="az-profile__input az-profile__input--readonly"
                  dir="ltr"
                />
                <app-icon name="lock" [size]="16" class="az-profile__lock-icon"></app-icon>
              </div>
            </div>

            <!-- Phone Number -->
            <div class="az-profile__field">
              <label for="phone" class="az-profile__label">
                {{ isArabic() ? 'رقم الهاتف / الواتساب' : 'Phone / WhatsApp' }} <span class="az-profile__required">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                formControlName="phone"
                class="az-profile__input"
                [class.az-profile__input--error]="isFieldInvalid('phone')"
                placeholder="01012345678"
                dir="ltr"
              />
              @if (isFieldInvalid('phone')) {
                <span class="az-profile__error">
                  {{ isArabic() ? 'يرجى إدخال رقم هاتف محمول صحيح (مثال: 01012345678)' : 'Please enter a valid phone number' }}
                </span>
              }
            </div>

            <!-- Role & Verification Status -->
            <div class="az-profile__meta-row">
              <div class="az-profile__meta-item">
                <span class="az-profile__meta-label">{{ isArabic() ? 'نوع الحساب:' : 'Account Role:' }}</span>
                <span class="az-profile__meta-val font-semibold">{{ profile()?.role }}</span>
              </div>
              <div class="az-profile__meta-item">
                <span class="az-profile__meta-label">{{ isArabic() ? 'حالة الحساب:' : 'Status:' }}</span>
                <span class="az-profile__meta-val az-profile__meta-val--active">
                  {{ isArabic() ? 'نشط' : 'Active' }}
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="az-profile__actions">
              <button
                type="submit"
                class="az-profile__submit-btn"
                [disabled]="form.invalid || isSubmitting()"
              >
                @if (isSubmitting()) {
                  <app-icon name="loader" [size]="18" class="animate-spin"></app-icon>
                  <span>{{ isArabic() ? 'جاري الحفظ...' : 'Saving...' }}</span>
                } @else {
                  <app-icon name="check" [size]="18"></app-icon>
                  <span>{{ isArabic() ? 'حفظ التعديلات' : 'Save Changes' }}</span>
                }
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  `,
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly localeService = inject(LocaleService);
  readonly accountStore = inject(AccountStore);
  private readonly toast = inject(ToastService);

  readonly isArabic = computed(() => this.localeService.currentLocale() !== 'en');
  readonly profile = computed(() => this.accountStore.profile());
  readonly isSubmitting = signal<boolean>(false);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    phone: [
      '',
      [
        Validators.required,
        Validators.pattern(/^(?:\+?20|0)?1[0125][0-9]{8}$|^\+?[1-9]\d{6,14}$/),
      ],
    ],
  });

  ngOnInit(): void {
    this.accountStore.loadProfile().subscribe({
      next: (p) => {
        if (p) {
          this.form.patchValue({
            name: p.name,
            phone: p.phone,
          });
        }
      },
    });

    const current = this.profile();
    if (current) {
      this.form.patchValue({
        name: current.name,
        phone: current.phone,
      });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, phone } = this.form.value;
    this.isSubmitting.set(true);

    this.accountStore
      .updateProfile({
        name: name ? name.trim() : undefined,
        phone: phone ? phone.trim() : undefined,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          const msg = this.isArabic()
            ? 'تم حفظ بيانات الملف الشخصي بنجاح!'
            : 'Profile updated successfully!';
          this.toast.success(msg);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err?.message || (this.isArabic()
            ? 'تعذر تحديث البيانات. يرجى المحاولة مرة أخرى.'
            : 'Failed to update profile.');
          this.toast.error(msg);
        },
      });
  }
}
