import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CatalogStore, INITIAL_CATALOG_FILTERS } from './catalog.store';
import { CatalogApi } from '../api/catalog/catalog-api.service';
import { AppConfigService } from '../config/app-config.service';
import { ApiError } from '../errors/api-error';
import type {
  CategoryDto,
  ProductDto,
  ContentModuleDto,
} from '../api/dto/catalog.dto';

describe('CatalogStore', () => {
  let store: CatalogStore;
  let catalogApiSpy: jasmine.SpyObj<CatalogApi>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockCategoriesDto: CategoryDto[] = [
    {
      id: 'cat-1',
      slug: 'fiqh',
      name: { ar: 'الفقه', en: 'Fiqh' },
      kind: 'product',
      displayOrder: 1,
      isActive: true,
      isBooksCore: true,
      isMvpEnabled: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const mockProductDto: ProductDto = {
    id: 'prod-1',
    slug: 'fiqh-book',
    name: { ar: 'كتاب الفقه', en: 'Fiqh Book' },
    priceMinor: 4500,
    currency: 'EGP',
    availability: 'in_stock',
    categoryId: 'cat-1',
    images: [],
    metadata: { author: 'الأزهر' },
    variants: [],
    hasVariants: false,
    preOrderEligible: false,
    createdAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    catalogApiSpy = jasmine.createSpyObj('CatalogApi', [
      'getCategories',
      'getProducts',
      'getProductBySlug',
      'searchProducts',
      'getHomeContent',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        CatalogStore,
        { provide: CatalogApi, useValue: catalogApiSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: AppConfigService,
          useValue: { cloudinaryCloudName: 'test-cloud' },
        },
      ],
    });

    store = TestBed.inject(CatalogStore);
  });

  it('should initialize with default state', () => {
    expect(store.products()).toEqual([]);
    expect(store.selectedProduct()).toBeNull();
    expect(store.categories()).toEqual([]);
    expect(store.homeModules()).toEqual([]);
    expect(store.activeFilters()).toEqual(INITIAL_CATALOG_FILTERS);
    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBeNull();
    expect(store.isEmpty()).toBeTrue();
    expect(store.isSearching()).toBeFalse();
  });

  describe('loadCategories', () => {
    it('should fetch and update categories on first call', (done) => {
      catalogApiSpy.getCategories.and.returnValue(of(mockCategoriesDto));

      store.loadCategories().subscribe((cats) => {
        expect(cats.length).toBe(1);
        expect(cats[0]?.slug).toBe('fiqh');
        expect(store.categories().length).toBe(1);
        expect(catalogApiSpy.getCategories).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should return cached categories without re-fetching', (done) => {
      catalogApiSpy.getCategories.and.returnValue(of(mockCategoriesDto));

      store.loadCategories().subscribe(() => {
        // Second call
        store.loadCategories().subscribe((cachedCats) => {
          expect(cachedCats.length).toBe(1);
          expect(catalogApiSpy.getCategories).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('should set error on loadCategories failure', (done) => {
      catalogApiSpy.getCategories.and.returnValue(
        throwError(() => new Error('Network error')),
      );

      store.loadCategories().subscribe({
        error: () => {
          expect(store.error()).toContain('حدث خطأ');
          done();
        },
      });
    });
  });

  describe('loadProducts', () => {
    it('should fetch products and set pagination and loading state', (done) => {
      catalogApiSpy.getProducts.and.returnValue(
        of({
          data: [mockProductDto],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      );

      store.loadProducts({ page: 1 }).subscribe((products) => {
        expect(products.length).toBe(1);
        expect(store.products().length).toBe(1);
        expect(store.pagination()?.totalPages).toBe(1);
        expect(store.isLoading()).toBeFalse();
        expect(store.isEmpty()).toBeFalse();
        done();
      });
    });

    it('should handle API errors gracefully in loadProducts', (done) => {
      const apiErr = new ApiError({
        message: 'Not found',
        httpStatus: 404,
        code: 'NOT_FOUND',
      });
      catalogApiSpy.getProducts.and.returnValue(throwError(() => apiErr));

      store.loadProducts().subscribe({
        error: () => {
          expect(store.isLoading()).toBeFalse();
          expect(store.products().length).toBe(0);
          expect(store.error()).toContain('غير موجود');
          done();
        },
      });
    });
  });

  describe('search', () => {
    it('should delegate to loadProducts if query is blank', (done) => {
      catalogApiSpy.getProducts.and.returnValue(
        of({
          data: [mockProductDto],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      );

      store.search('   ').subscribe(() => {
        expect(catalogApiSpy.getProducts).toHaveBeenCalled();
        expect(catalogApiSpy.searchProducts).not.toHaveBeenCalled();
        done();
      });
    });

    it('should call searchProducts when query is non-empty', (done) => {
      catalogApiSpy.searchProducts.and.returnValue(
        of({
          data: [mockProductDto],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      );

      store.search('fiqh').subscribe((prods) => {
        expect(prods.length).toBe(1);
        expect(store.isSearching()).toBeTrue();
        expect(catalogApiSpy.searchProducts).toHaveBeenCalledWith(
          jasmine.objectContaining({ q: 'fiqh' }),
        );
        done();
      });
    });
  });

  describe('loadProductBySlug', () => {
    it('should load product detail and update selectedProduct', (done) => {
      catalogApiSpy.getProductBySlug.and.returnValue(of(mockProductDto));

      store.loadProductBySlug('fiqh-book').subscribe((product) => {
        expect(product.slug).toBe('fiqh-book');
        expect(store.selectedProduct()?.slug).toBe('fiqh-book');
        expect(store.isLoading()).toBeFalse();
        done();
      });
    });

    it('should handle product not found error', (done) => {
      const notFoundErr = new ApiError({
        message: 'Not found',
        httpStatus: 404,
        code: 'NOT_FOUND',
      });
      catalogApiSpy.getProductBySlug.and.returnValue(throwError(() => notFoundErr));

      store.loadProductBySlug('missing').subscribe({
        error: () => {
          expect(store.selectedProduct()).toBeNull();
          expect(store.error()).toContain('غير موجود');
          done();
        },
      });
    });
  });

  describe('loadHomeContent', () => {
    it('should load and map home modules', (done) => {
      const mockModules: ContentModuleDto[] = [
        {
          id: 'mod-1',
          key: 'hero_featured',
          title: { ar: 'الكتب المميزة' },
          moduleType: 'featured_products',
          products: [mockProductDto],
          categories: [],
          displayOrder: 1,
        },
      ];
      catalogApiSpy.getHomeContent.and.returnValue(of(mockModules));

      store.loadHomeContent().subscribe((modules) => {
        expect(modules.length).toBe(1);
        expect(store.homeModules().length).toBe(1);
        done();
      });
    });

    it('should fall back to empty array gracefully on error', (done) => {
      catalogApiSpy.getHomeContent.and.returnValue(throwError(() => new Error('Server down')));

      store.loadHomeContent().subscribe((modules) => {
        expect(modules).toEqual([]);
        expect(store.homeModules()).toEqual([]);
        done();
      });
    });
  });

  describe('URL Synchronization & Sanitization', () => {
    it('should parse valid query params correctly', () => {
      const parsed = store.parseUrlFilters({
        page: '3',
        category: 'books',
        availability: 'in_stock',
        q: 'hadith',
      });

      expect(parsed.page).toBe(3);
      expect(parsed.category).toBe('books');
      expect(parsed.availability).toBe('in_stock');
      expect(parsed.search).toBe('hadith');
    });

    it('should sanitize invalid query params safely', () => {
      const parsed = store.parseUrlFilters({
        page: '-5',
        category: '   ',
        availability: 'invalid_status',
        q: '   ',
      });

      expect(parsed.page).toBe(1);
      expect(parsed.category).toBeUndefined();
      expect(parsed.availability).toBeUndefined();
      expect(parsed.search).toBeUndefined();
    });

    it('should serialize active filters to clean query params', () => {
      const params = store.serializeFiltersToQueryParams({
        page: 2,
        limit: 20,
        category: 'tafseer',
        availability: 'out_of_stock',
        search: 'quran',
      });

      expect(params['page']).toBe(2);
      expect(params['category']).toBe('tafseer');
      expect(params['availability']).toBe('out_of_stock');
      expect(params['q']).toBe('quran');
    });

    it('should omit default values when serializing to URL', () => {
      const params = store.serializeFiltersToQueryParams({
        page: 1,
        limit: 20,
        category: undefined,
        availability: undefined,
        search: undefined,
      });

      expect(params).toEqual({});
    });

    it('should navigate to URL on syncToUrl', () => {
      store.setFilters({ category: 'tafseer', page: 2 });
      store.syncToUrl('/shop');

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/shop'], {
        queryParams: { category: 'tafseer', page: 2 },
        queryParamsHandling: '',
      });
    });
  });

  describe('Filter State Modifications', () => {
    it('should set filters and reset page to 1 by default', () => {
      store.setFilters({ category: 'history' });
      expect(store.activeFilters().category).toBe('history');
      expect(store.activeFilters().page).toBe(1);
    });

    it('should clear all filters to initial defaults', () => {
      store.setFilters({ category: 'history', page: 4 });
      store.clearFilters();
      expect(store.activeFilters()).toEqual(INITIAL_CATALOG_FILTERS);
    });

    it('should clear selected product', () => {
      store.clearSelectedProduct();
      expect(store.selectedProduct()).toBeNull();
    });
  });
});
