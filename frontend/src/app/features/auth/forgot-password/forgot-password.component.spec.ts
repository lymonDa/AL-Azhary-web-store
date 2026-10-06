import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthStore } from '../../../core/auth/auth.store';
import { ForgotPasswordResponseDto } from '../../../core/api/dto/auth.dto';

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let authStoreMock: {
    error: ReturnType<typeof signal<string | null>>;
    isPending: ReturnType<typeof signal<boolean>>;
    forgotPassword: jasmine.Spy;
    clearError: jasmine.Spy;
  };

  beforeEach(async () => {
    authStoreMock = {
      error: signal<string | null>(null),
      isPending: signal<boolean>(false),
      forgotPassword: jasmine
        .createSpy('forgotPassword')
        .and.returnValue(of({ message: 'dispatched' } as ForgotPasswordResponseDto)),
      clearError: jasmine.createSpy('clearError'),
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders forgot password header and clears error on init', () => {
    expect(authStoreMock.clearError).toHaveBeenCalled();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain('استعادة كلمة المرور');
  });

  it('validates email field on submission of empty form', () => {
    component.onSubmit();
    fixture.detectChanges();

    expect(component.form.invalid).toBe(true);
    expect(authStoreMock.forgotPassword).not.toHaveBeenCalled();
    expect(component.getEmailError()).toContain('يرجى إدخال البريد الإلكتروني');
  });

  it('submits valid email and transitions to success view', () => {
    component.form.patchValue({ email: 'user@example.com' });

    component.onSubmit();
    fixture.detectChanges();

    expect(authStoreMock.forgotPassword).toHaveBeenCalledWith('user@example.com');
    const successCard = fixture.nativeElement.querySelector('.az-auth-success');
    expect(successCard).not.toBeNull();
    expect(successCard?.textContent).toContain('تم إرسال الطلب');
  });

  it('displays error alert when authStore contains an error', () => {
    authStoreMock.error.set('خطأ في إرسال البريد');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.az-auth-alert');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain('خطأ في إرسال البريد');
  });
});
