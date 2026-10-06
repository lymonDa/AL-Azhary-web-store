import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthStore } from '../../../core/auth/auth.store';
import { AuthUser } from '../../../domain/models/auth.model';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let router: Router;
  let authStoreMock: {
    error: ReturnType<typeof signal<string | null>>;
    isPending: ReturnType<typeof signal<boolean>>;
    login: jasmine.Spy;
    clearError: jasmine.Spy;
  };

  beforeEach(async () => {
    authStoreMock = {
      error: signal<string | null>(null),
      isPending: signal<boolean>(false),
      login: jasmine.createSpy('login').and.returnValue(of({} as AuthUser)),
      clearError: jasmine.createSpy('clearError'),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: authStoreMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'returnUrl' ? '/checkout' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture.detectChanges();
  });

  it('renders login form and clears errors on init', () => {
    expect(authStoreMock.clearError).toHaveBeenCalled();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading?.textContent).toContain('تسجيل الدخول');
  });

  it('marks fields touched and stops submission if form is invalid', () => {
    component.onSubmit();
    fixture.detectChanges();

    expect(component.form.invalid).toBe(true);
    expect(authStoreMock.login).not.toHaveBeenCalled();
    expect(component.getIdentifierError()).not.toBeNull();
  });

  it('submits valid form and navigates to sanitized returnUrl', () => {
    component.form.patchValue({
      identifier: 'customer@test.com',
      password: 'password123',
    });

    component.onSubmit();
    fixture.detectChanges();

    expect(authStoreMock.login).toHaveBeenCalledWith({
      identifier: 'customer@test.com',
      password: 'password123',
    });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/checkout');
  });

  it('displays error alert when authStore contains an error', () => {
    authStoreMock.error.set('بيانات الدخول غير صحيحة');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.az-auth-alert');
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toContain('بيانات الدخول غير صحيحة');
  });
});
