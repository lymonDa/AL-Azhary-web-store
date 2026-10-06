import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { CategoryComponent } from './category.component';
import { CatalogStore } from '../../../core/catalog/catalog.store';
import { LocaleService } from '../../../core/i18n/locale.service';

describe('CategoryComponent', () => {
  let fixture: ComponentFixture<CategoryComponent>;
  let catalogStoreSpy: jasmine.SpyObj<CatalogStore>;

  beforeEach(async () => {
    catalogStoreSpy = jasmine.createSpyObj('CatalogStore', [
      'loadCategories',
      'loadProducts',
    ], {
      categories: () => [
        {
          id: 'cat-1',
          slug: 'fiqh',
          name: { ar: 'كتب الفقه' },
          displayOrder: 1,
          isActive: true,
          isBooksCore: true,
        },
      ],
      products: () => [],
      pagination: () => null,
      isLoading: () => false,
      isEmpty: () => true,
      error: () => null,
    });

    catalogStoreSpy.loadCategories.and.returnValue(of([]));
    catalogStoreSpy.loadProducts.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [CategoryComponent],
      providers: [
        provideRouter([]),
        LocaleService,
        { provide: CatalogStore, useValue: catalogStoreSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug: 'fiqh' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryComponent);
  });

  it('should load category products and render category title', () => {
    fixture.detectChanges();
    expect(catalogStoreSpy.loadProducts).toHaveBeenCalledWith(
      jasmine.objectContaining({ category: 'fiqh' }),
    );

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.az-category-page__title')?.textContent).toContain(
      'كتب الفقه',
    );
  });
});
