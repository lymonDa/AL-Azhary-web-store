import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CartApi } from './cart-api.service';
import { ApiClient } from '../base/api-client';
import type { CartDto, CartMergeResultDto } from '../dto/cart.dto';

describe('CartApi', () => {
  let service: CartApi;
  let apiClientSpy: jasmine.SpyObj<ApiClient>;

  const mockCartDto: CartDto = {
    id: 'cart-1',
    ownerType: 'guest',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        variantId: null,
        quantity: 2,
        unitPriceMinor: 5000,
        productNameSnapshot: { ar: 'كتاب الفقه', en: 'Fiqh Book' },
        imageSnapshot: 'https://example.com/img.jpg',
        addedAt: '2026-10-10T10:00:00Z',
      },
    ],
    itemsCount: 1,
    totalQuantity: 2,
    subtotalMinor: 10000,
    currency: 'EGP',
    version: 3,
  };

  beforeEach(() => {
    apiClientSpy = jasmine.createSpyObj<ApiClient>('ApiClient', [
      'getData',
      'postData',
      'patchData',
      'deleteData',
    ]);

    TestBed.configureTestingModule({
      providers: [
        CartApi,
        { provide: ApiClient, useValue: apiClientSpy },
      ],
    });

    service = TestBed.inject(CartApi);
  });

  it('should call GET /cart and return cart DTO', (done) => {
    apiClientSpy.getData.and.returnValue(of(mockCartDto));

    service.getCart().subscribe((res) => {
      expect(res).toEqual(mockCartDto);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/cart');
      done();
    });
  });

  it('should call POST /cart/items with expected body', (done) => {
    apiClientSpy.postData.and.returnValue(of(mockCartDto));

    const dto = { productId: 'prod-1', quantity: 2, expectedVersion: 3 };
    service.addItem(dto).subscribe((res) => {
      expect(res).toEqual(mockCartDto);
      expect(apiClientSpy.postData).toHaveBeenCalledWith('/cart/items', dto);
      done();
    });
  });

  it('should call PATCH /cart/items/:itemId with expected body', (done) => {
    apiClientSpy.patchData.and.returnValue(of(mockCartDto));

    const dto = { quantity: 5, expectedVersion: 3 };
    service.updateItem('item-1', dto).subscribe((res) => {
      expect(res).toEqual(mockCartDto);
      expect(apiClientSpy.patchData).toHaveBeenCalledWith('/cart/items/item-1', dto);
      done();
    });
  });

  it('should call DELETE /cart/items/:itemId with expected params', (done) => {
    apiClientSpy.deleteData.and.returnValue(of(void 0));

    service.removeItem('item-1', 4).subscribe(() => {
      expect(apiClientSpy.deleteData).toHaveBeenCalledWith('/cart/items/item-1', {
        params: { expectedVersion: '4' },
      });
      done();
    });
  });

  it('should call POST /cart/merge with expected payload', (done) => {
    const mergeResult: CartMergeResultDto = {
      cart: mockCartDto,
      conflicts: [],
    };
    apiClientSpy.postData.and.returnValue(of(mergeResult));

    const mergeDto = { sessionId: 'sess-abc', expectedUserCartVersion: 2 };
    service.mergeCart(mergeDto).subscribe((res) => {
      expect(res).toEqual(mergeResult);
      expect(apiClientSpy.postData).toHaveBeenCalledWith('/cart/merge', mergeDto);
      done();
    });
  });
});
