import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AccountShellComponent } from './account-shell.component';
import { AuthStore } from '../../core/auth/auth.store';
import { AccountStore } from '../../core/account/account.store';
import { LocaleService } from '../../core/i18n/locale.service';

describe('AccountShellComponent', () => {
  let component: AccountShellComponent;
  let fixture: ComponentFixture<AccountShellComponent>;
  let authStoreSpy: jasmine.SpyObj<AuthStore>;
  let accountStoreSpy: jasmine.SpyObj<AccountStore>;
  let localeServiceSpy: jasmine.SpyObj<LocaleService>;

  beforeEach(async () => {
    authStoreSpy = jasmine.createSpyObj<AuthStore>('AuthStore', ['logout'], {
      user: signal({
        id: 'usr-1',
        name: 'أحمد محمود',
        email: 'ahmed@example.com',
        phone: '01012345678',
        role: 'customer' as const,
        status: 'active' as const,
        isEmailVerified: true,
        emailVerifiedAt: '2026-01-01',
      }),
      isAuthenticated: signal(true),
    });
    authStoreSpy.logout.and.returnValue(of(undefined));

    accountStoreSpy = jasmine.createSpyObj<AccountStore>('AccountStore', ['loadProfile'], {
      profile: signal({
        id: 'usr-1',
        name: 'أحمد محمود',
        email: 'ahmed@example.com',
        phone: '01012345678',
        role: 'customer' as const,
        status: 'active' as const,
        emailVerifiedAt: '2026-01-01',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      }),
      isLoadingProfile: signal(false),
    });
    accountStoreSpy.loadProfile.and.returnValue(of(accountStoreSpy.profile()!));

    localeServiceSpy = jasmine.createSpyObj<LocaleService>('LocaleService', [], {
      isArabic: signal(true),
      direction: signal('rtl'),
      currentLocale: signal('ar'),
    });

    await TestBed.configureTestingModule({
      imports: [AccountShellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: authStoreSpy },
        { provide: AccountStore, useValue: accountStoreSpy },
        { provide: LocaleService, useValue: localeServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render user greeting', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('أحمد محمود');
  });

  it('should display customer nav links', () => {
    const navLinks = fixture.nativeElement.querySelectorAll('.az-account-shell__nav-item');
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it('should call authStore.logout when logout button is clicked', () => {
    component.onLogout();
    expect(authStoreSpy.logout).toHaveBeenCalled();
  });
});
