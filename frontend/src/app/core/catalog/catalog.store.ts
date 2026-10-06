import { Injectable, computed, inject, signal } from '@angular/core';
import { Router, type Params } from '@angular/router';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { CatalogApi } from '../api/catalog/catalog-api.service';
import { AppConfigService } from '../config/app-config.service';
import {
  mapCategoryDtoToDomain,
  mapProductDtoToDomain,
  mapContentModuleDtoToDomain,
} from '../api/mappers/catalog.mapper';
import type {
  Category,
  Product,
  ContentModule,
  CatalogPagination,
  CatalogFilters,
  ProductAvailability,
} from '../../domain/models/catalog.model';
import { ApiError } from '../errors/api-error';

export const DEFAULT_PAGE_LIMIT = 20;

export const INITIAL_CATALOG_FILTERS: CatalogFilters = {
  category: undefined,
  availability: undefined,
  search: undefined,
  page: 1,
  limit: DEFAULT_PAGE_LIMIT,
};

interface CatalogStoreState {
  readonly products: readonly Product[];
  readonly selectedProduct: Product | null;
  readonly categories: readonly Category[];
  readonly homeModules: readonly ContentModule[];
  readonly activeFilters: CatalogFilters;
  readonly pagination: CatalogPagination | null;
  readonly isLoading: boolean;
  readonly error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CatalogStore {
  private readonly catalogApi = inject(CatalogApi);
  private readonly appConfig = inject(AppConfigService);
  private readonly router = inject(Router);

  private readonly stateSignal = signal<CatalogStoreState>({
    products: [],
    selectedProduct: null,
    categories: [],
    homeModules: [],
    activeFilters: { ...INITIAL_CATALOG_FILTERS },
    pagination: null,
    isLoading: false,
    error: null,
  });

  readonly state = this.stateSignal.asReadonly();
  readonly products = computed(() => this.stateSignal().products);
  readonly selectedProduct = computed(() => this.stateSignal().selectedProduct);
  readonly categories = computed(() => this.stateSignal().categories);
  readonly homeModules = computed(() => this.stateSignal().homeModules);
  readonly activeFilters = computed(() => this.stateSignal().activeFilters);
  readonly pagination = computed(() => this.stateSignal().pagination);
  readonly isLoading = computed(() => this.stateSignal().isLoading);
  readonly error = computed(() => this.stateSignal().error);

  readonly isEmpty = computed(
    () => !this.isLoading() && this.products().length === 0,
  );

  readonly selectedCategory = computed(() => {
    const filterCat = this.activeFilters().category;
    if (!filterCat) return null;
    return (
      this.categories().find(
        (c) => c.slug === filterCat || c.id === filterCat,
      ) ?? null
    );
  });

  readonly isSearching = computed(() => {
    const s = this.activeFilters().search;
    return Boolean(s && s.trim().length > 0);
  });

  /**
   * Loads all active product categories.
   */
  loadCategories(): Observable<readonly Category[]> {
    if (this.categories().length > 0) {
      return of(this.categories());
    }

    return this.catalogApi.getCategories().pipe(
      map((dtos) => dtos.map(mapCategoryDtoToDomain)),
      tap((categories) => {
        this.stateSignal.update((s) => ({ ...s, categories }));
      }),
      catchError((err: unknown) => {
        const errorMsg = this.resolveErrorMessage(err);
        this.stateSignal.update((s) => ({ ...s, error: errorMsg }));
        return throwError(() => err);
      }),
    );
  }

  /**
   * Loads products with current or specified filters.
   */
  loadProducts(filters?: Partial<CatalogFilters>): Observable<readonly Product[]> {
    const mergedFilters: CatalogFilters = {
      ...this.stateSignal().activeFilters,
      ...(filters ?? {}),
      search: undefined, // Clear search when fetching standard catalog
    };

    this.stateSignal.update((s) => ({
      ...s,
      isLoading: true,
      error: null,
      activeFilters: mergedFilters,
    }));

    const cloudName = this.appConfig.cloudinaryCloudName;

    return this.catalogApi
      .getProducts({
        page: mergedFilters.page,
        limit: mergedFilters.limit,
        category: mergedFilters.category,
        availability: mergedFilters.availability,
      })
      .pipe(
        map((res) => {
          const products = (res.data ?? []).map((dto) =>
            mapProductDtoToDomain(dto, cloudName),
          );
          const pagination: CatalogPagination | null = res.pagination
            ? {
                page: res.pagination.page ?? mergedFilters.page,
                limit: res.pagination.limit ?? mergedFilters.limit,
                total: res.pagination.total ?? products.length,
                totalPages: res.pagination.totalPages ?? 1,
              }
            : null;

          this.stateSignal.update((s) => ({
            ...s,
            products,
            pagination,
            isLoading: false,
            error: null,
          }));

          return products;
        }),
        catchError((err: unknown) => {
          const errorMsg = this.resolveErrorMessage(err);
          this.stateSignal.update((s) => ({
            ...s,
            isLoading: false,
            error: errorMsg,
            products: [],
            pagination: null,
          }));
          return throwError(() => err);
        }),
      );
  }

  /**
   * Searches products by keyword with optional category and availability filters.
   */
  search(query: string, filters?: Partial<CatalogFilters>): Observable<readonly Product[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return this.loadProducts(filters);
    }

    const mergedFilters: CatalogFilters = {
      ...this.stateSignal().activeFilters,
      ...(filters ?? {}),
      search: cleanQuery,
    };

    this.stateSignal.update((s) => ({
      ...s,
      isLoading: true,
      error: null,
      activeFilters: mergedFilters,
    }));

    const cloudName = this.appConfig.cloudinaryCloudName;

    return this.catalogApi
      .searchProducts({
        q: cleanQuery,
        page: mergedFilters.page,
        limit: mergedFilters.limit,
        category: mergedFilters.category,
        availability: mergedFilters.availability,
      })
      .pipe(
        map((res) => {
          const products = (res.data ?? []).map((dto) =>
            mapProductDtoToDomain(dto, cloudName),
          );
          const pagination: CatalogPagination | null = res.pagination
            ? {
                page: res.pagination.page ?? mergedFilters.page,
                limit: res.pagination.limit ?? mergedFilters.limit,
                total: res.pagination.total ?? products.length,
                totalPages: res.pagination.totalPages ?? 1,
              }
            : null;

          this.stateSignal.update((s) => ({
            ...s,
            products,
            pagination,
            isLoading: false,
            error: null,
          }));

          return products;
        }),
        catchError((err: unknown) => {
          const errorMsg = this.resolveErrorMessage(err);
          this.stateSignal.update((s) => ({
            ...s,
            isLoading: false,
            error: errorMsg,
            products: [],
            pagination: null,
          }));
          return throwError(() => err);
        }),
      );
  }

  /**
   * Loads product detail by unique slug.
   */
  loadProductBySlug(slug: string): Observable<Product> {
    this.stateSignal.update((s) => ({
      ...s,
      isLoading: true,
      error: null,
      selectedProduct: null,
    }));

    const cloudName = this.appConfig.cloudinaryCloudName;

    return this.catalogApi.getProductBySlug(slug).pipe(
      map((dto) => mapProductDtoToDomain(dto, cloudName)),
      tap((product) => {
        this.stateSignal.update((s) => ({
          ...s,
          selectedProduct: product,
          isLoading: false,
          error: null,
        }));
      }),
      catchError((err: unknown) => {
        const errorMsg = this.resolveErrorMessage(err);
        this.stateSignal.update((s) => ({
          ...s,
          selectedProduct: null,
          isLoading: false,
          error: errorMsg,
        }));
        return throwError(() => err);
      }),
    );
  }

  /**
   * Loads home merchandising content modules.
   */
  loadHomeContent(): Observable<readonly ContentModule[]> {
    if (this.homeModules().length > 0) {
      return of(this.homeModules());
    }

    const cloudName = this.appConfig.cloudinaryCloudName;

    return this.catalogApi.getHomeContent().pipe(
      map((dtos) => dtos.map((dto) => mapContentModuleDtoToDomain(dto, cloudName))),
      tap((homeModules) => {
        this.stateSignal.update((s) => ({ ...s, homeModules }));
      }),
      catchError(() => {
        // Fallback gracefully without breaking page
        this.stateSignal.update((s) => ({ ...s, homeModules: [] }));
        return of([]);
      }),
    );
  }

  /**
   * Synchronizes current filters with browser URL query parameters.
   */
  syncToUrl(basePath: string): void {
    const queryParams = this.serializeFiltersToQueryParams(this.activeFilters());
    this.router.navigate([basePath], {
      queryParams,
      queryParamsHandling: '',
    });
  }

  /**
   * Parses route query parameters into sanitized CatalogFilters.
   */
  parseUrlFilters(params: Params): CatalogFilters {
    const rawPage = Number(params['page']);
    const page = !isNaN(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

    const rawCategory = params['category'];
    const category =
      typeof rawCategory === 'string' && rawCategory.trim().length > 0
        ? rawCategory.trim()
        : undefined;

    const rawAvailability = params['availability'];
    const validAvailabilities: ProductAvailability[] = [
      'in_stock',
      'out_of_stock',
      'pre_order_eligible',
    ];
    const availability = validAvailabilities.includes(rawAvailability as ProductAvailability)
      ? (rawAvailability as ProductAvailability)
      : undefined;

    const rawSearch = params['q'] ?? params['search'];
    const search =
      typeof rawSearch === 'string' && rawSearch.trim().length > 0
        ? rawSearch.trim()
        : undefined;

    return {
      page,
      limit: DEFAULT_PAGE_LIMIT,
      category,
      availability,
      search,
    };
  }

  /**
   * Serializes CatalogFilters into clean URL query params, omitting defaults.
   */
  serializeFiltersToQueryParams(filters: CatalogFilters): Params {
    const params: Params = {};

    if (filters.search && filters.search.trim().length > 0) {
      params['q'] = filters.search.trim();
    }
    if (filters.category && filters.category.trim().length > 0) {
      params['category'] = filters.category.trim();
    }
    if (filters.availability) {
      params['availability'] = filters.availability;
    }
    if (filters.page && filters.page > 1) {
      params['page'] = filters.page;
    }

    return params;
  }

  setFilters(filters: Partial<CatalogFilters>): void {
    this.stateSignal.update((s) => ({
      ...s,
      activeFilters: {
        ...s.activeFilters,
        ...filters,
        // Reset page to 1 when criteria change unless page was explicitly provided
        page: filters.page !== undefined ? filters.page : 1,
      },
    }));
  }

  clearFilters(): void {
    this.stateSignal.update((s) => ({
      ...s,
      activeFilters: { ...INITIAL_CATALOG_FILTERS },
    }));
  }

  clearSelectedProduct(): void {
    this.stateSignal.update((s) => ({ ...s, selectedProduct: null }));
  }

  private resolveErrorMessage(err: unknown): string {
    if (ApiError.isApiError(err)) {
      if (err.httpStatus === 404) {
        return 'المنتج أو التصنيف المطلوب غير موجود.';
      }
      if (err.message && err.message.length > 0) {
        return err.message;
      }
    }
    return 'حدث خطأ أثناء تحميل البيانات من الخادم. يرجى المحاولة لاحقاً.';
  }
}
