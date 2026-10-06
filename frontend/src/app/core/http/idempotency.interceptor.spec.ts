import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpContext,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { idempotencyInterceptor } from './idempotency.interceptor';
import { IDEMPOTENCY_KEY, IS_IDEMPOTENT } from './idempotency.tokens';
import { IdempotencyKeyService } from '../util/idempotency-key.service';

describe('idempotencyInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([idempotencyInterceptor])),
        provideHttpClientTesting(),
        IdempotencyKeyService,
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('does NOT attach Idempotency-Key to standard requests', (done) => {
    httpClient.get('/api/v1/products').subscribe({
      next: () => done(),
      error: (err) => done.fail(err),
    });

    const req = httpTesting.expectOne('/api/v1/products');
    expect(req.request.headers.has('Idempotency-Key')).toBe(false);
    req.flush([]);
  });

  it('attaches generated Idempotency-Key when IS_IDEMPOTENT context is true', (done) => {
    const context = new HttpContext().set(IS_IDEMPOTENT, true);

    httpClient.post('/api/v1/orders', { cartId: '123' }, { context }).subscribe({
      next: () => done(),
      error: (err) => done.fail(err),
    });

    const req = httpTesting.expectOne('/api/v1/orders');
    expect(req.request.headers.has('Idempotency-Key')).toBe(true);
    const key = req.request.headers.get('Idempotency-Key');
    expect(key).toBeTruthy();
    expect(key?.length).toBeGreaterThan(10);
    req.flush({ success: true });
  });

  it('attaches explicit key when IDEMPOTENCY_KEY context is set', (done) => {
    const context = new HttpContext().set(IDEMPOTENCY_KEY, 'custom-uuid-key-999');

    httpClient.post('/api/v1/payment-proofs', {}, { context }).subscribe({
      next: () => done(),
      error: (err) => done.fail(err),
    });

    const req = httpTesting.expectOne('/api/v1/payment-proofs');
    expect(req.request.headers.get('Idempotency-Key')).toBe('custom-uuid-key-999');
    req.flush({ success: true });
  });

  it('preserves existing Idempotency-Key header without overwriting', (done) => {
    httpClient
      .post(
        '/api/v1/orders',
        {},
        {
          headers: { 'Idempotency-Key': 'pre-existing-key' },
        },
      )
      .subscribe({
        next: () => done(),
        error: (err) => done.fail(err),
      });

    const req = httpTesting.expectOne('/api/v1/orders');
    expect(req.request.headers.get('Idempotency-Key')).toBe('pre-existing-key');
    req.flush({ success: true });
  });
});
