import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthApi } from './auth-api.service';
import { ApiClient } from '../base/api-client';
import { AppConfigService } from '../../config/app-config.service';
import { AuthUserDto } from '../dto/auth.dto';

describe('AuthApi', () => {
  let authApi: AuthApi;
  let httpTesting: HttpTestingController;

  const mockUserDto: AuthUserDto = {
    id: 'usr_123',
    name: 'أحمد الأزهري',
    email: 'user@example.com',
    phone: '+201012345678',
    role: 'customer',
    status: 'active',
    emailVerifiedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiClient,
        AppConfigService,
        AuthApi,
      ],
    });

    authApi = TestBed.inject(AuthApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('posts credentials to /auth/login and unwraps accessToken and user', (done) => {
    authApi.login({ identifier: 'user@example.com', password: 'password123' }).subscribe({
      next: (res) => {
        expect(res.accessToken).toBe('mock-access-token');
        expect(res.user.id).toBe('usr_123');
        done();
      },
      error: (err) => done.fail(err),
    });

    const req = httpTesting.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ identifier: 'user@example.com', password: 'password123' });
    expect(req.request.withCredentials).toBe(true);
    req.flush({
      success: true,
      data: {
        accessToken: 'mock-access-token',
        user: mockUserDto,
      },
    });
  });

  it('posts registration payload to /auth/register and unwraps user', (done) => {
    authApi
      .register({
        name: 'أحمد الأزهري',
        email: 'user@example.com',
        phone: '+201012345678',
        password: 'password123',
      })
      .subscribe({
        next: (user) => {
          expect(user.id).toBe('usr_123');
          expect(user.name).toBe('أحمد الأزهري');
          done();
        },
        error: (err) => done.fail(err),
      });

    const req = httpTesting.expectOne('/api/v1/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush({
      success: true,
      data: mockUserDto,
    });
  });

  it('posts empty payload with credentials to /auth/refresh', (done) => {
    authApi.refresh().subscribe({
      next: (res) => {
        expect(res.accessToken).toBe('new-access-token');
        done();
      },
      error: (err) => done.fail(err),
    });

    const req = httpTesting.expectOne('/api/v1/auth/refresh');
    expect(req.request.method).toBe('POST');
    expect(req.request.withCredentials).toBe(true);
    req.flush({
      success: true,
      data: { accessToken: 'new-access-token' },
    });
  });

  it('posts logout request to /auth/logout with all option', (done) => {
    authApi.logout(true).subscribe({
      next: () => done(),
      error: (err) => done.fail(err),
    });

    const req = httpTesting.expectOne('/api/v1/auth/logout');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ all: true });
    expect(req.request.withCredentials).toBe(true);
    req.flush({ success: true, data: null });
  });

  it('gets current authenticated profile from /me', (done) => {
    authApi.getMe().subscribe({
      next: (user) => {
        expect(user.email).toBe('user@example.com');
        done();
      },
      error: (err) => done.fail(err),
    });

    const req = httpTesting.expectOne('/api/v1/me');
    expect(req.request.method).toBe('GET');
    req.flush({
      success: true,
      data: mockUserDto,
    });
  });

  it('posts token to /auth/verify-email', (done) => {
    authApi.verifyEmail('token-xyz').subscribe({
      next: (res) => {
        expect(res.verified).toBe(true);
        expect(res.user.id).toBe('usr_123');
        done();
      },
      error: (err) => done.fail(err),
    });

    const req = httpTesting.expectOne('/api/v1/auth/verify-email');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'token-xyz' });
    req.flush({
      success: true,
      data: { user: mockUserDto, verified: true },
    });
  });

  it('posts email to /auth/forgot-password', (done) => {
    authApi.forgotPassword('user@example.com').subscribe({
      next: (res) => {
        expect(res.message).toContain('email');
        done();
      },
      error: (err) => done.fail(err),
    });

    const req = httpTesting.expectOne('/api/v1/auth/forgot-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'user@example.com' });
    req.flush({
      success: true,
      data: { message: 'Verification link sent to email if account exists' },
    });
  });

  it('posts token and new password to /auth/reset-password', (done) => {
    authApi.resetPassword('token-xyz', 'new-pass-123').subscribe({
      next: () => done(),
      error: (err) => done.fail(err),
    });

    const req = httpTesting.expectOne('/api/v1/auth/reset-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'token-xyz', newPassword: 'new-pass-123' });
    req.flush({ success: true, data: null });
  });
});
