import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReturnsApi } from './returns-api.service';
import { ApiClient } from '../base/api-client';
import type { SafeReturnRequestDto, ReturnListResponseDto, CreateReturnRequestDto } from '../dto/returns.dto';

describe('ReturnsApi', () => {
  let service: ReturnsApi;
  let apiClientSpy: jasmine.SpyObj<ApiClient>;

  const mockReturnDto: SafeReturnRequestDto = {
    reference: 'RET-20261010-001',
    orderReference: 'ORD-20261010-ABCD',
    items: [
      {
        orderItemId: 'item-1',
        quantity: 1,
        reason: 'damaged_item',
      },
    ],
    status: 'requested',
    customerNote: 'تلف في الغلاف',
    totalRefundAmountMinor: 10000,
    currency: 'EGP',
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
        ReturnsApi,
        { provide: ApiClient, useValue: apiClientSpy },
      ],
    });

    service = TestBed.inject(ReturnsApi);
  });

  it('should fetch returns list via GET /returns', (done) => {
    const mockList: ReturnListResponseDto = {
      returns: [mockReturnDto],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };
    apiClientSpy.getData.and.returnValue(of(mockList));

    service.getReturns({ page: 1, limit: 20 }).subscribe((res) => {
      expect(res).toEqual(mockList);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/returns', {
        params: jasmine.anything(),
      });
      done();
    });
  });

  it('should fetch single return request via GET /returns/:reference', (done) => {
    apiClientSpy.getData.and.returnValue(of({ returnRequest: mockReturnDto }));

    service.getReturn('RET-20261010-001').subscribe((res) => {
      expect(res.returnRequest).toEqual(mockReturnDto);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/returns/RET-20261010-001');
      done();
    });
  });

  it('should create return request via POST /orders/:orderReference/returns', (done) => {
    const createReq: CreateReturnRequestDto = {
      items: [{ orderItemId: 'item-1', quantity: 1, reason: 'damaged_item' }],
      customerNote: 'تلف في الغلاف',
    };
    apiClientSpy.postData.and.returnValue(of({ returnRequest: mockReturnDto }));

    service.createReturn('ORD-20261010-ABCD', createReq).subscribe((res) => {
      expect(res.returnRequest).toEqual(mockReturnDto);
      expect(apiClientSpy.postData).toHaveBeenCalledWith('/orders/ORD-20261010-ABCD/returns', createReq);
      done();
    });
  });
});
