import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
  convertToParamMap,
} from '@angular/router';
import { signal } from '@angular/core';
import { guestOnlyGuard } from './guest-only.guard';
import { AuthStore } from '../auth.store';
import { AuthStatus } from '../../../domain/models/auth.model';

describe('guestOnlyGuard', () => {
  let router: Router;
  let statusSignal: ReturnType<typeof signal<AuthStatus>>;
  let isAuthenticatedSignal: ReturnType<typeof signal<boolean>>;
  const stateSnapshot = { url: '/login' } as RouterStateSnapshot;

  beforeEach(() => {
    statusSignal = signal<AuthStatus>('anonymous');
    isAuthenticatedSignal = signal<boolean>(false);

    const authStoreMock = {
      status: statusSignal,
      isAuthenticated: isAuthenticatedSignal,
    };

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthStore, useValue: authStoreMock }],
    });

    router = TestBed.inject(Router);
  });

  it('allows access to guest route when user is unauthenticated', () => {
    statusSignal.set('anonymous');
    isAuthenticatedSignal.set(false);

    const routeSnapshot = {
      queryParamMap: convertToParamMap({}),
    } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      guestOnlyGuard(routeSnapshot, stateSnapshot),
    );
    expect(result).toBe(true);
  });

  it('redirects to root when authenticated and no returnUrl query param is present', () => {
    statusSignal.set('authenticated');
    isAuthenticatedSignal.set(true);

    const routeSnapshot = {
      queryParamMap: convertToParamMap({}),
    } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      guestOnlyGuard(routeSnapshot, stateSnapshot),
    ) as UrlTree;

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result)).toBe('/');
  });

  it('redirects to returnUrl when authenticated and valid returnUrl is present', () => {
    statusSignal.set('authenticated');
    isAuthenticatedSignal.set(true);

    const routeSnapshot = {
      queryParamMap: convertToParamMap({ returnUrl: '/checkout' }),
    } as unknown as ActivatedRouteSnapshot;

    const result = TestBed.runInInjectionContext(() =>
      guestOnlyGuard(routeSnapshot, stateSnapshot),
    ) as UrlTree;

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result)).toBe('/checkout');
  });
});
