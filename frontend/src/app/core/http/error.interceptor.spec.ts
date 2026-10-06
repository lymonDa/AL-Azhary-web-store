import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { ApiError } from '../errors/api-error';
import { ApiErrorCodes } from '../errors/error-codes';
import { ErrorMapperService } from '../errors/error-mapper.service';

describe('errorInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        ErrorMapperService,
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('transforms backend error envelope into structured ApiError', (done) => {
    httpClient.get('/api/v1/bad-request').subscribe({
      next: () => done.fail('Expected call to fail'),
      error: (err: ApiError) => {
        expect(ApiError.isApiError(err)).toBe(true);
        expect(err.code).toBe('VALIDATION_ERROR');
        expect(err.httpStatus).toBe(400);
        expect(err.message).toBe('Form invalid');
        expect(err.requestId).toBe('req-999');
        expect(err.fields).toEqual([{ path: 'email', code: 'REQUIRED', message: 'Required' }]);
        done();
      },
    });

    const req = httpTesting.expectOne('/api/v1/bad-request');
    req.flush(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Form invalid',
          fields: [{ path: 'email', code: 'REQUIRED', message: 'Required' }],
        },
        meta: {
          requestId: 'req-999',
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );
  });

  it('normalizes status 0 network error as retryable NETWORK_ERROR', (done) => {
    httpClient.get('/api/v1/offline').subscribe({
      next: () => done.fail('Expected call to fail'),
      error: (err: ApiError) => {
        expect(ApiError.isApiError(err)).toBe(true);
        expect(err.code).toBe(ApiErrorCodes.NETWORK_ERROR);
        expect(err.httpStatus).toBe(0);
        expect(err.retryable).toBe(true);
        done();
      },
    });

    const req = httpTesting.expectOne('/api/v1/offline');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });

  it('normalizes 503 as retryable DEPENDENCY_UNAVAILABLE', (done) => {
    httpClient.get('/api/v1/service-down').subscribe({
      next: () => done.fail('Expected call to fail'),
      error: (err: ApiError) => {
        expect(ApiError.isApiError(err)).toBe(true);
        expect(err.code).toBe(ApiErrorCodes.DEPENDENCY_UNAVAILABLE);
        expect(err.httpStatus).toBe(503);
        expect(err.retryable).toBe(true);
        done();
      },
    });

    const req = httpTesting.expectOne('/api/v1/service-down');
    req.flush(
      {
        success: false,
        error: { code: 'DEPENDENCY_UNAVAILABLE', message: 'Gateway down' },
      },
      { status: 503, statusText: 'Service Unavailable' },
    );
  });
});
