import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PreordersApi } from './preorders-api.service';
import { ApiClient } from '../base/api-client';
import type { SafePreorderDto, PreorderListResponseDto } from '../dto/preorder.dto';

describe('PreordersApi', () => {
  let service: PreordersApi;
  let apiClientSpy: jasmine.SpyObj<ApiClient>;

  const mockPreorder: SafePreorderDto = {
    reference: 'PRE-20261010-001',
    customerId: 'cust-1',
    customerSnapshot: {
      name: 'أحمد محمود',
      phone: '01012345678',
      email: null,
    },
    productId: 'prod-1',
    variantId: null,
    productSnapshot: {
      name: { ar: 'مقدمة ابن خلدون', en: 'Muqaddimah' },
      slug: 'muqaddimah',
    },
    quantity: 1,
    capturedPriceMinor: 15000,
    currency: 'EGP',
    status: 'pending',
    version: 1,
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
  };

  beforeEach(() => {
    apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', [
      'getData',
      'postData',
    ]);

    TestBed.configureTestingModule({
      providers: [
        PreordersApi,
        { provide: ApiClient, useValue: apiClientSpy },
      ],
    });

    service = TestBed.inject(PreordersApi);
  });

  it('should fetch preorders list via GET /pre-orders', (done) => {
    const mockList: PreorderListResponseDto = {
      preorders: [mockPreorder],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };
    apiClientSpy.getData.and.returnValue(of(mockList));

    service.getPreorders({ page: 1, limit: 20 }).subscribe((res) => {
      expect(res).toEqual(mockList);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/pre-orders', {
        params: jasmine.anything(),
      });
      done();
    });
  });

  it('should fetch single preorder via GET /pre-orders/:reference', (done) => {
    apiClientSpy.getData.and.returnValue(of({ preorder: mockPreorder }));

    service.getPreorder('PRE-20261010-001').subscribe((res) => {
      expect(res.preorder).toEqual(mockPreorder);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/pre-orders/PRE-20261010-001');
      done();
    });
  });

  it('should cancel preorder via POST /pre-orders/:reference/cancel', (done) => {
    const cancelledPreorder: SafePreorderDto = {
      ...mockPreorder,
      status: 'cancelled',
      version: 2,
    };
    apiClientSpy.postData.and.returnValue(of({ preorder: cancelledPreorder }));

    service.cancelPreorder('PRE-20261010-001', 'لم أعد بحاجة إليه').subscribe((res) => {
      expect(res.preorder.status).toBe('cancelled');
      expect(apiClientSpy.postData).toHaveBeenCalledWith('/pre-orders/PRE-20261010-001/cancel', {
        reason: 'لم أعد بحاجة إليه',
      });
      done();
    });
  });
});
