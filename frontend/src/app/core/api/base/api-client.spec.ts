import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApiClient } from './api-client';
import { AppConfigService } from '../../config/app-config.service';
import { ApiError } from '../../errors/api-error';

describe('ApiClient', () => {
  let client: ApiClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiClient,
        AppConfigService,
      ],
    });

    client = TestBed.inject(ApiClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('buildUrl', () => {
    it('prefixes apiBaseUrl for relative paths and avoids double slashes', () => {
      expect(client.buildUrl('/categories')).toBe('/api/v1/categories');
      expect(client.buildUrl('categories')).toBe('/api/v1/categories');
      expect(client.buildUrl('/products/slug-1')).toBe('/api/v1/products/slug-1');
    });

    it('leaves absolute URLs untouched', () => {
      const absoluteUrl = 'https://api.external.com/v1/data';
      expect(client.buildUrl(absoluteUrl)).toBe(absoluteUrl);
    });
  });

  describe('GET requests', () => {
    it('unwraps enveloped success response and includes pagination metadata', (done) => {
      interface CategoryDto {
        id: string;
        name: string;
      }

      client
        .get<CategoryDto[]>('/categories', {
          params: { page: 1, limit: 10, active: true, tags: ['a', 'b'] },
        })
        .subscribe({
          next: (result) => {
            expect(result.data).toEqual([
              { id: 'cat-1', name: 'Fiqh' },
              { id: 'cat-2', name: 'Hadith' },
            ]);
            expect(result.requestId).toBe('req-123');
            expect(result.pagination).toEqual({
              page: 1,
              limit: 10,
              total: 2,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            });
            done();
          },
          error: (err) => done.fail(err),
        });

      const req = httpTesting.expectOne((r) =>
        r.url === '/api/v1/categories' &&
        r.params.get('page') === '1' &&
        r.params.get('limit') === '10' &&
        r.params.get('active') === 'true' &&
        r.params.getAll('tags')?.length === 2,
      );

      expect(req.request.method).toBe('GET');

      req.flush(
        {
          success: true,
          data: [
            { id: 'cat-1', name: 'Fiqh' },
            { id: 'cat-2', name: 'Hadith' },
          ],
          requestId: 'req-123',
          meta: {
            requestId: 'req-123',
            pagination: {
              page: 1,
              limit: 10,
              total: 2,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
          },
        },
        { headers: { 'X-Request-ID': 'req-123' } },
      );
    });

    it('unwraps data directly with getData helper', (done) => {
      client.getData<string>('/status').subscribe({
        next: (data) => {
          expect(data).toBe('healthy');
          done();
        },
        error: (err) => done.fail(err),
      });

      const req = httpTesting.expectOne('/api/v1/status');
      req.flush({ success: true, data: 'healthy' });
    });

    it('handles 204 No Content gracefully', (done) => {
      client.get<void>('/empty').subscribe({
        next: (result) => {
          expect(result.data).toBeUndefined();
          done();
        },
        error: (err) => done.fail(err),
      });

      const req = httpTesting.expectOne('/api/v1/empty');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });

  describe('Mutations (POST, PUT, PATCH, DELETE)', () => {
    it('executes POST and unwraps result', (done) => {
      const payload = { name: 'New Book' };
      client.post<{ id: string }>('/books', payload).subscribe({
        next: (res) => {
          expect(res.data).toEqual({ id: 'book-1' });
          done();
        },
        error: (err) => done.fail(err),
      });

      const req = httpTesting.expectOne('/api/v1/books');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);

      req.flush({ success: true, data: { id: 'book-1' } });
    });

    it('executes PATCH and unwraps result with patchData', (done) => {
      client.patchData<{ updated: boolean }>('/books/1', { name: 'Updated' }).subscribe({
        next: (data) => {
          expect(data.updated).toBe(true);
          done();
        },
        error: (err) => done.fail(err),
      });

      const req = httpTesting.expectOne('/api/v1/books/1');
      expect(req.request.method).toBe('PATCH');

      req.flush({ success: true, data: { updated: true } });
    });

    it('executes DELETE and unwraps result with deleteData', (done) => {
      client.deleteData<boolean>('/books/1').subscribe({
        next: (data) => {
          expect(data).toBe(true);
          done();
        },
        error: (err) => done.fail(err),
      });

      const req = httpTesting.expectOne('/api/v1/books/1');
      expect(req.request.method).toBe('DELETE');

      req.flush({ success: true, data: true });
    });
  });

  describe('Error handling', () => {
    it('propagates HTTP failures as normalized ApiError', (done) => {
      client.get('/fail').subscribe({
        next: () => done.fail('Should have failed'),
        error: (err: ApiError) => {
          expect(ApiError.isApiError(err)).toBe(true);
          expect(err.httpStatus).toBe(404);
          expect(err.code).toBe('NOT_FOUND');
          done();
        },
      });

      const req = httpTesting.expectOne('/api/v1/fail');
      req.flush(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Item not found' },
        },
        { status: 404, statusText: 'Not Found' },
      );
    });
  });
});
