import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { signal } from '@angular/core';
import { authGuard, sanitizeReturnUrl } from './auth.guard';
import { AuthStore } from '../auth.store';
import { AuthStatus } from '../../../domain/models/auth.model';

describe('authGuard & sanitizeReturnUrl', () => {
  let router: Router;
  let statusSignal: ReturnType<typeof signal<AuthStatus>>;
  let isAuthenticatedSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(() => {
    statusSignal = signal<AuthStatus>('authenticated');
    isAuthenticatedSignal = signal<boolean>(true);

    const authStoreMock = {
      status: statusSignal,
      isAuthenticated: isAuthenticatedSignal,
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreMock }],
    });

    router = TestBed.inject(Router);
  });

  describe('sanitizeReturnUrl', () => {
    it('returns internal relative path unchanged', () => {
      expect(sanitizeReturnUrl('/checkout')).toBe('/checkout');
      expect(sanitizeReturnUrl('/orders/123')).toBe('/orders/123');
    });

    it('sanitizes open-redirect targets back to root', () => {
      expect(sanitizeReturnUrl('https://malicious.com')).toBe('/');
      expect(sanitizeReturnUrl('//evil.com')).toBe('/');
      expect(sanitizeReturnUrl('/\\evil.com')).toBe('/');
      expect(sanitizeReturnUrl(null)).toBe('/');
      expect(sanitizeReturnUrl('')).toBe('/');
    });
  });

  describe('authGuard execution', () => {
    const routeSnapshot = {} as ActivatedRouteSnapshot;
    const stateSnapshot = { url: '/customer/orders' } as RouterStateSnapshot;

    it('grants navigation when user is authenticated', () => {
      statusSignal.set('authenticated');
      isAuthenticatedSignal.set(true);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(routeSnapshot, stateSnapshot),
      );

      expect(result).toBe(true);
    });

    it('redirects to /login with sanitized returnUrl when user is anonymous', () => {
      statusSignal.set('anonymous');
      isAuthenticatedSignal.set(false);

      const result = TestBed.runInInjectionContext(() =>
        authGuard(routeSnapshot, stateSnapshot),
      ) as UrlTree;

      expect(result instanceof UrlTree).toBe(true);
      expect(router.serializeUrl(result)).toBe('/login?returnUrl=%2Fcustomer%2Forders');
    });
  });
});
