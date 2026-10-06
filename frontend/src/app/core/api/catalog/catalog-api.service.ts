import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../base/api-client';
import type { ApiResult } from '../base/api-response.model';
import type {
  CategoryDto,
  ProductDto,
  ProductQueryParams,
  SearchQueryParams,
  ContentModuleDto,
} from '../dto/catalog.dto';

@Injectable({
  providedIn: 'root',
})
export class CatalogApi {
  private readonly client = inject(ApiClient);

  /**
   * Fetches all active public product categories (Books, School/Study, etc.)
   */
  getCategories(): Observable<CategoryDto[]> {
    return this.client.getData<CategoryDto[]>('/categories');
  }

  /**
   * Fetches paginated public products with optional category and availability filters.
   */
  getProducts(params?: ProductQueryParams): Observable<ApiResult<ProductDto[]>> {
    return this.client.get<ProductDto[]>('/products', {
      params: {
        page: params?.page,
        limit: params?.limit,
        category: params?.category,
        availability: params?.availability,
      },
    });
  }

  /**
   * Fetches a single public product by unique slug.
   */
  getProductBySlug(slug: string): Observable<ProductDto> {
    return this.client.getData<ProductDto>(`/products/${encodeURIComponent(slug)}`);
  }

  /**
   * Searches public products by full-text query with optional category and availability filters.
   */
  searchProducts(params: SearchQueryParams): Observable<ApiResult<ProductDto[]>> {
    return this.client.get<ProductDto[]>('/search', {
      params: {
        q: params.q,
        page: params.page,
        limit: params.limit,
        category: params.category,
        availability: params.availability,
      },
    });
  }

  /**
   * Fetches curated public homepage merchandising modules.
   */
  getHomeContent(): Observable<ContentModuleDto[]> {
    return this.client.getData<ContentModuleDto[]>('/content/home');
  }
}
