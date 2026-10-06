import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthStore } from './auth.store';
import { AuthApi } from '../api/account/auth-api.service';
import { AuthTokenHolder } from './token-holder.service';
import { PlatformService } from '../storage/platform.service';
import { AuthUserDto } from '../api/dto/auth.dto';
import { ApiError } from '../errors/api-error';
import { ApiErrorCodes } from '../errors/error-codes';

describe('AuthStore', () => {
  let store: AuthStore;
  let authApiMock: jasmine.SpyObj<AuthApi>;
  let tokenHolder: AuthTokenHolder;
  let routerMock: jasmine.SpyObj<Router>;
  let platformMock: { isServer: boolean; isBrowser: boolean };

  const mockUserDto: AuthUserDto = {
    id: 'usr_abc',
    email: 'reader@al-azhari.com',
    name: 'قارئ الأزهري',
    phone: '+201011112222',
    role: 'customer',
    status: 'active',
    emailVerifiedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    authApiMock = jasmine.createSpyObj<AuthApi>('AuthApi', [
      'login',
      'register',
      'refresh',
      'logout',
      'getMe',
      'verifyEmail',
      'forgotPassword',
      'resetPassword',
    ]);

    routerMock = jasmine.createSpyObj<Router>('Router', ['navigate']);
    platformMock = { isServer: false, isBrowser: true };

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        AuthTokenHolder,
        { provide: AuthApi, useValue: authApiMock },
        { provide: Router, useValue: routerMock },
        { provide: PlatformService, useValue: platformMock },
      ],
    });

    store = TestBed.inject(AuthStore);
    tokenHolder = TestBed.inject(AuthTokenHolder);
  });

  it('initializes with unknown state and no authenticated user', () => {
    expect(store.status()).toBe('unknown');
    expect(store.user()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
    expect(store.isPending()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.restoreFailed()).toBe(false);
  });

  describe('login', () => {
    it('sets authenticated state and stores accessToken on successful login', (done) => {
      authApiMock.login.and.returnValue(
        of({
          accessToken: 'jwt-access-token-123',
          user: mockUserDto,
        }),
      );

      store.login({ identifier: 'reader@al-azhari.com', password: 'secretPassword' }).subscribe({
        next: (user) => {
          expect(user.id).toBe('usr_abc');
          expect(store.status()).toBe('authenticated');
          expect(store.isAuthenticated()).toBe(true);
          expect(store.user()?.email).toBe('reader@al-azhari.com');
          expect(tokenHolder.getAccessToken()).toBe('jwt-access-token-123');
          expect(store.error()).toBeNull();
          expect(store.isPending()).toBe(false);
          done();
        },
        error: (err) => done.fail(err),
      });
    });

    it('handles invalid credentials error and sets friendly error message', (done) => {
      const apiErr = new ApiError({
        httpStatus: 401,
        code: ApiErrorCodes.AUTH_INVALID_CREDENTIALS,
        message: 'Invalid credentials',
      });
      authApiMock.login.and.returnValue(throwError(() => apiErr));

      store.login({ identifier: 'reader@al-azhari.com', password: 'wrong' }).subscribe({
        next: () => done.fail('Should have failed'),
        error: (err) => {
          expect(err).toBe(apiErr);
          expect(store.status()).toBe('unknown');
          expect(store.isAuthenticated()).toBe(false);
          expect(store.error()).toContain('بيانات الدخول غير صحيحة');
          expect(store.isPending()).toBe(false);
          done();
        },
      });
    });
  });

  describe('register', () => {
    it('registers user and updates store with new customer domain model', (done) => {
      authApiMock.register.and.returnValue(of(mockUserDto));

      store
        .register({
          name: 'قارئ الأزهري',
          email: 'reader@al-azhari.com',
          phone: '+201011112222',
          password: 'Password123!',
        })
        .subscribe({
          next: (user) => {
            expect(user.name).toBe('قارئ الأزهري');
            expect(store.isPending()).toBe(false);
            expect(store.error()).toBeNull();
            done();
          },
          error: (err) => done.fail(err),
        });
    });

    it('captures conflict error if email or phone is already registered', (done) => {
      const apiErr = new ApiError({
        httpStatus: 409,
        code: ApiErrorCodes.RESOURCE_CONFLICT,
        message: 'Already exists',
      });
      authApiMock.register.and.returnValue(throwError(() => apiErr));

      store
        .register({
          name: 'قارئ الأزهري',
          email: 'reader@al-azhari.com',
          phone: '+201011112222',
          password: 'Password123!',
        })
        .subscribe({
          next: () => done.fail('Should have failed'),
          error: () => {
            expect(store.error()).toContain('مسجل بالفعل');
            expect(store.isPending()).toBe(false);
            done();
          },
        });
    });
  });

  describe('logout', () => {
    it('clears token, sets anonymous state, and navigates to /login', (done) => {
      tokenHolder.setAccessToken('active-token');
      authApiMock.logout.and.returnValue(of(undefined));

      store.logout().subscribe({
        next: () => {
          expect(tokenHolder.hasToken()).toBe(false);
          expect(store.status()).toBe('anonymous');
          expect(store.user()).toBeNull();
          expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
          done();
        },
        error: (err) => done.fail(err),
      });
    });

    it('finalizes logout even if backend logout fails', (done) => {
      tokenHolder.setAccessToken('active-token');
      authApiMock.logout.and.returnValue(throwError(() => new Error('Network issue')));

      store.logout().subscribe({
        next: () => {
          expect(tokenHolder.hasToken()).toBe(false);
          expect(store.status()).toBe('anonymous');
          expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
          done();
        },
        error: (err) => done.fail(err),
      });
    });
  });

  describe('restore', () => {
    it('returns null and skips API calls when executing on server (SSR)', (done) => {
      platformMock.isServer = true;

      store.restore().subscribe({
        next: (result) => {
          expect(result).toBeNull();
          expect(authApiMock.refresh).not.toHaveBeenCalled();
          expect(store.status()).toBe('anonymous');
          done();
        },
        error: (err) => done.fail(err),
      });
    });

    it('refreshes token and fetches profile on successful session restoration', (done) => {
      authApiMock.refresh.and.returnValue(of({ accessToken: 'restored-token' }));
      authApiMock.getMe.and.returnValue(of(mockUserDto));

      store.restore().subscribe({
        next: (user) => {
          expect(user?.id).toBe('usr_abc');
          expect(tokenHolder.getAccessToken()).toBe('restored-token');
          expect(store.status()).toBe('authenticated');
          expect(store.restoreFailed()).toBe(false);
          done();
        },
        error: (err) => done.fail(err),
      });
    });

    it('marks anonymous cleanly without failure flag when refresh returns 401', (done) => {
      const err401 = new ApiError({
        httpStatus: 401,
        code: ApiErrorCodes.UNAUTHORIZED,
        message: 'No refresh cookie',
      });
      authApiMock.refresh.and.returnValue(throwError(() => err401));

      store.restore().subscribe({
        next: (user) => {
          expect(user).toBeNull();
          expect(store.status()).toBe('anonymous');
          expect(store.restoreFailed()).toBe(false);
          expect(tokenHolder.hasToken()).toBe(false);
          done();
        },
        error: (err) => done.fail(err),
      });
    });

    it('marks restoreFailed = true when unexpected 500 error occurs', (done) => {
      const err500 = new ApiError({
        httpStatus: 500,
        code: ApiErrorCodes.INTERNAL_ERROR,
        message: 'Server error',
      });
      authApiMock.refresh.and.returnValue(throwError(() => err500));

      store.restore().subscribe({
        next: (user) => {
          expect(user).toBeNull();
          expect(store.status()).toBe('anonymous');
          expect(store.restoreFailed()).toBe(true);
          done();
        },
        error: (err) => done.fail(err),
      });
    });
  });

  describe('tokenHolder refresh handler integration', () => {
    it('delegates refreshToken to authApi.refresh and updates accessToken', (done) => {
      authApiMock.refresh.and.returnValue(of({ accessToken: 'refreshed-jwt' }));

      tokenHolder.refreshToken().subscribe({
        next: (token: string | null) => {
          expect(token).toBe('refreshed-jwt');
          expect(tokenHolder.getAccessToken()).toBe('refreshed-jwt');
          done();
        },
        error: (err: unknown) => done.fail(err as Error),
      });
    });
  });
});
