import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthTokenHolder } from '../auth/token-holder.service';
import { AppConfigService } from '../config/app-config.service';

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let tokenHolder: AuthTokenHolder;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        AuthTokenHolder,
        AppConfigService,
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    tokenHolder = TestBed.inject(AuthTokenHolder);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('attaches Bearer token to API requests when token exists', (done) => {
    tokenHolder.setAccessToken('sample-jwt-token');

    httpClient.get('/api/v1/protected').subscribe({
      next: () => done(),
      error: (err) => done.fail(err),
    });

    const req = httpTesting.expectOne('/api/v1/protected');
    expect(req.request.headers.get('Authorization')).toBe('Bearer sample-jwt-token');
    req.flush({ success: true, data: 'ok' });
  });

  it('does NOT attach Bearer token to external origins like Cloudinary', (done) => {
    tokenHolder.setAccessToken('sample-jwt-token');

    httpClient.get('https://res.cloudinary.com/al-azhari/image.png').subscribe({
      next: () => done(),
      error: (err) => done.fail(err),
    });

    const req = httpTesting.expectOne('https://res.cloudinary.com/al-azhari/image.png');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(null);
  });

  it('proceeds without Authorization header if no token is stored', (done) => {
    tokenHolder.clearToken();

    httpClient.get('/api/v1/public').subscribe({
      next: () => done(),
      error: (err) => done.fail(err),
    });

    const req = httpTesting.expectOne('/api/v1/public');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ success: true, data: 'public' });
  });

  it('does not retry excluded auth endpoints on 401', (done) => {
    tokenHolder.setAccessToken('expired-token');

    httpClient.post('/api/v1/auth/login', { username: 'test' }).subscribe({
      next: () => done.fail('Should have failed'),
      error: (err) => {
        expect(err.status).toBe(401);
        done();
      },
    });

    const req = httpTesting.expectOne('/api/v1/auth/login');
    req.flush({ success: false }, { status: 401, statusText: 'Unauthorized' });
  });

  it('handles 401 on protected route by refreshing and retrying once', (done) => {
    tokenHolder.setAccessToken('stale-token');
    tokenHolder.registerRefreshHandler(() => of('new-refreshed-token'));

    httpClient.get('/api/v1/me').subscribe({
      next: (res) => {
        expect(res).toEqual({ success: true, data: 'profile' });
        done();
      },
      error: (err) => done.fail(err),
    });

    // 1st request fails with 401
    const firstReq = httpTesting.expectOne('/api/v1/me');
    expect(firstReq.request.headers.get('Authorization')).toBe('Bearer stale-token');
    firstReq.flush({ success: false }, { status: 401, statusText: 'Unauthorized' });

    // 2nd request is retried with new token and X-Retry marker
    const retryReq = httpTesting.expectOne('/api/v1/me');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-refreshed-token');
    expect(retryReq.request.headers.get('X-Retry')).toBe('1');
    retryReq.flush({ success: true, data: 'profile' });
  });

  it('clears token and propagates error when token refresh fails', (done) => {
    tokenHolder.setAccessToken('stale-token');
    tokenHolder.registerRefreshHandler(() => throwError(() => new Error('Refresh failed')));

    httpClient.get('/api/v1/me').subscribe({
      next: () => done.fail('Should have failed'),
      error: () => {
        expect(tokenHolder.hasToken()).toBe(false);
        done();
      },
    });

    const req = httpTesting.expectOne('/api/v1/me');
    req.flush({ success: false }, { status: 401, statusText: 'Unauthorized' });
  });
});
