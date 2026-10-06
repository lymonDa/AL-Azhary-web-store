import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ShopComponent } from './shop.component';
import { CatalogStore } from '../../../core/catalog/catalog.store';
import { LocaleService } from '../../../core/i18n/locale.service';

describe('ShopComponent', () => {
  let fixture: ComponentFixture<ShopComponent>;
  let catalogStoreSpy: jasmine.SpyObj<CatalogStore>;

  beforeEach(async () => {
    catalogStoreSpy = jasmine.createSpyObj('CatalogStore', [
      'loadCategories',
      'loadProducts',
      'parseUrlFilters',
      'setFilters',
      'clearFilters',
      'syncToUrl',
    ], {
      categories: () => [],
      products: () => [],
      pagination: () => null,
      activeFilters: () => ({ page: 1, limit: 20 }),
      isLoading: () => false,
      isEmpty: () => true,
      error: () => null,
    });

    catalogStoreSpy.loadCategories.and.returnValue(of([]));
    catalogStoreSpy.loadProducts.and.returnValue(of([]));
    catalogStoreSpy.parseUrlFilters.and.returnValue({ page: 1, limit: 20 });

    await TestBed.configureTestingModule({
      imports: [ShopComponent],
      providers: [
        provideRouter([]),
        LocaleService,
        { provide: CatalogStore, useValue: catalogStoreSpy },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({}) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShopComponent);
  });

  it('should initialize and display empty state when no products', () => {
    fixture.detectChanges();
    expect(catalogStoreSpy.loadCategories).toHaveBeenCalled();
    expect(catalogStoreSpy.loadProducts).toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.az-shop__title')).toBeTruthy();
    expect(compiled.querySelector('app-empty-state')).toBeTruthy();
  });
});
