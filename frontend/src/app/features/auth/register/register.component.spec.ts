import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthStore } from '../../../core/auth/auth.store';
import { AuthUser } from '../../../domain/models/auth.model';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authStoreMock: {
    error: ReturnType<typeof signal<string | null>>;
    isPending: ReturnType<typeof signal<boolean>>;
    register: jasmine.Spy;
    clearError: jasmine.Spy;
  };

  beforeEach(async () => {
    authStoreMock = {
      error: signal<string | null>(null),
      isPending: signal<boolean>(false),
      register: jasmine.createSpy('register').and.returnValue(of({} as AuthUser)),
      clearError: jasmine.createSpy('clearError'),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders registration form and clears error state on init', () => {
    expect(authStoreMock.clearError).toHaveBeenCalled();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain('إنشاء حساب جديد');
  });

  it('validates required fields on invalid submission', () => {
    component.onSubmit();
    fixture.detectChanges();

    expect(component.form.invalid).toBe(true);
    expect(authStoreMock.register).not.toHaveBeenCalled();
    expect(component.getNameError()).not.toBeNull();
    expect(component.getEmailError()).not.toBeNull();
  });

  it('validates password mismatch when passwords differ', () => {
    component.form.patchValue({
      name: 'محمود',
      email: 'mahmoud@test.com',
      phone: '01012345678',
      password: 'Password123!',
      confirmPassword: 'DifferentPassword123!',
    });
    component.form.controls.confirmPassword.markAsTouched();
    fixture.detectChanges();

    expect(component.getConfirmPasswordError()).toContain('غير متطابقتين');
  });

  it('submits valid registration and shows success state', () => {
    component.form.patchValue({
      name: 'محمود الأزهري',
      email: 'mahmoud@test.com',
      phone: '01012345678',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(authStoreMock.register).toHaveBeenCalledWith({
      name: 'محمود الأزهري',
      email: 'mahmoud@test.com',
      phone: '01012345678',
      password: 'Password123!',
    });

    const successCard = fixture.nativeElement.querySelector('.az-auth-success');
    expect(successCard).not.toBeNull();
    expect(successCard?.textContent).toContain('تم إنشاء الحساب بنجاح');
  });

  it('displays error alert when authStore holds an error', () => {
    authStoreMock.error.set('البريد الإلكتروني مسجل بالفعل');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.az-auth-alert');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain('البريد الإلكتروني مسجل بالفعل');
  });
});
