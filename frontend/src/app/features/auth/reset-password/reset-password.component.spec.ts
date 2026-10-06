import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthStore } from '../../../core/auth/auth.store';

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  let authStoreMock: {
    error: ReturnType<typeof signal<string | null>>;
    isPending: ReturnType<typeof signal<boolean>>;
    resetPassword: jasmine.Spy;
    clearError: jasmine.Spy;
  };

  const setupTest = async (tokenValue: string | null) => {
    authStoreMock = {
      error: signal<string | null>(null),
      isPending: signal<boolean>(false),
      resetPassword: jasmine.createSpy('resetPassword').and.returnValue(of(undefined)),
      clearError: jasmine.createSpy('clearError'),
    };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: authStoreMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'token' ? tokenValue : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('shows invalid token notice when token is missing in query params', async () => {
    await setupTest(null);

    const alert = fixture.nativeElement.querySelector('.az-auth-alert');
    expect(alert?.textContent).toContain('رابط إعادة التعيين غير صالح أو مفقود');
  });

  it('renders form and clears error when token is present', async () => {
    await setupTest('valid-reset-token');

    expect(authStoreMock.clearError).toHaveBeenCalled();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain('إعادة تعيين كلمة المرور');
  });

  it('validates password mismatch', async () => {
    await setupTest('valid-reset-token');

    component.form.patchValue({
      newPassword: 'NewPassword123!',
      confirmPassword: 'DifferentPassword123!',
    });
    component.form.controls.confirmPassword.markAsTouched();
    fixture.detectChanges();

    expect(component.getConfirmPasswordError()).toContain('غير متطابقتين');
  });

  it('submits new password and switches to success state', async () => {
    await setupTest('valid-reset-token');

    component.form.patchValue({
      newPassword: 'NewPassword123!',
      confirmPassword: 'NewPassword123!',
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(authStoreMock.resetPassword).toHaveBeenCalledWith(
      'valid-reset-token',
      'NewPassword123!',
    );
    const successCard = fixture.nativeElement.querySelector('.az-auth-success');
    expect(successCard).not.toBeNull();
    expect(successCard?.textContent).toContain('تم تغيير كلمة المرور بنجاح');
  });
});
