import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CatalogApi } from './catalog-api.service';
import { ApiClient } from '../base/api-client';
import type { ApiResult } from '../base/api-response.model';
import type {
  CategoryDto,
  ProductDto,
  ContentModuleDto,
} from '../dto/catalog.dto';

describe('CatalogApi', () => {
  let service: CatalogApi;
  let apiClientSpy: jasmine.SpyObj<ApiClient>;

  const mockCategories: CategoryDto[] = [
    {
      id: 'cat-1',
      slug: 'primary-stage',
      name: { ar: 'المرحلة الابتدائية', en: 'Primary Stage' },
      kind: 'product',
      displayOrder: 1,
      isActive: true,
      isBooksCore: true,
      isMvpEnabled: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const mockProduct: ProductDto = {
    id: 'prod-1',
    slug: 'tafseer-grade-1',
    name: { ar: 'كتاب التفسير', en: 'Tafseer Book' },
    priceMinor: 5000,
    currency: 'EGP',
    availability: 'in_stock',
    categoryId: 'cat-1',
    images: [],
    metadata: { author: 'الأزهر الشريف', subject: 'تفسير' },
    variants: [],
    hasVariants: false,
    preOrderEligible: false,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const mockApiResult: ApiResult<ProductDto[]> = {
    data: [mockProduct],
    pagination: {
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    apiClientSpy = jasmine.createSpyObj('ApiClient', ['get', 'getData']);

    TestBed.configureTestingModule({
      providers: [
        CatalogApi,
        { provide: ApiClient, useValue: apiClientSpy },
      ],
    });

    service = TestBed.inject(CatalogApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call getCategories via getData(/categories)', (done) => {
    apiClientSpy.getData.and.returnValue(of(mockCategories));

    service.getCategories().subscribe((res) => {
      expect(res).toEqual(mockCategories);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/categories');
      done();
    });
  });

  it('should call getProducts with query parameters', (done) => {
    apiClientSpy.get.and.returnValue(of(mockApiResult));

    service
      .getProducts({ page: 2, limit: 10, category: 'books', availability: 'in_stock' })
      .subscribe((res) => {
        expect(res).toEqual(mockApiResult);
        expect(apiClientSpy.get).toHaveBeenCalledWith('/products', {
          params: {
            page: 2,
            limit: 10,
            category: 'books',
            availability: 'in_stock',
          },
        });
        done();
      });
  });

  it('should call getProductBySlug with encoded slug', (done) => {
    apiClientSpy.getData.and.returnValue(of(mockProduct));

    service.getProductBySlug('tafseer-grade-1').subscribe((res) => {
      expect(res).toEqual(mockProduct);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/products/tafseer-grade-1');
      done();
    });
  });

  it('should call searchProducts with search query', (done) => {
    apiClientSpy.get.and.returnValue(of(mockApiResult));

    service.searchProducts({ q: 'tafseer', page: 1, limit: 20 }).subscribe((res) => {
      expect(res).toEqual(mockApiResult);
      expect(apiClientSpy.get).toHaveBeenCalledWith('/search', {
        params: {
          q: 'tafseer',
          page: 1,
          limit: 20,
          category: undefined,
          availability: undefined,
        },
      });
      done();
    });
  });

  it('should call getHomeContent via getData(/content/home)', (done) => {
    const mockHome: ContentModuleDto[] = [];
    apiClientSpy.getData.and.returnValue(of(mockHome));

    service.getHomeContent().subscribe((res) => {
      expect(res).toEqual(mockHome);
      expect(apiClientSpy.getData).toHaveBeenCalledWith('/content/home');
      done();
    });
  });
});
