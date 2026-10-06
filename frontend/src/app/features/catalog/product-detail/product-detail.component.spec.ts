import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { ProductDetailComponent } from './product-detail.component';
import { CatalogStore } from '../../../core/catalog/catalog.store';
import { AppConfigStore } from '../../../core/config/app-config.store';
import { LocaleService } from '../../../core/i18n/locale.service';
import type { Product } from '../../../domain/models/catalog.model';

describe('ProductDetailComponent', () => {
  let fixture: ComponentFixture<ProductDetailComponent>;
  let catalogStoreSpy: jasmine.SpyObj<CatalogStore>;

  const mockProduct: Product = {
    id: 'p-1',
    slug: 'nahw-book',
    name: { ar: 'كتاب النحو الواضح' },
    priceMinor: 6000,
    currency: 'EGP',
    availability: 'in_stock',
    categoryId: 'c-1',
    images: [],
    metadata: {
      author: 'علي الجارم',
      publisher: 'دار المعارف',
      subject: 'نحو وصرف',
    },
    variants: [],
    hasVariants: false,
    preOrderEligible: false,
    createdAt: '2026-01-01',
  };

  beforeEach(async () => {
    catalogStoreSpy = jasmine.createSpyObj('CatalogStore', [
      'loadProductBySlug',
    ], {
      selectedProduct: () => mockProduct,
      isLoading: () => false,
      error: () => null,
    });

    catalogStoreSpy.loadProductBySlug.and.returnValue(of(mockProduct));

    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        provideRouter([]),
        LocaleService,
        { provide: CatalogStore, useValue: catalogStoreSpy },
        {
          provide: AppConfigStore,
          useValue: {
            contact: () => ({ whatsappNumber: '+201000000000' }),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ slug: 'nahw-book' })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
  });

  it('should load product by slug and render title, author, price, and WhatsApp button', () => {
    fixture.detectChanges();
    expect(catalogStoreSpy.loadProductBySlug).toHaveBeenCalledWith('nahw-book');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.az-product-detail__title')?.textContent).toContain(
      'كتاب النحو الواضح',
    );
    expect(compiled.querySelector('.az-product-detail__author')?.textContent).toContain(
      'علي الجارم',
    );
    expect(compiled.querySelector('.az-cart-placeholder')).toBeTruthy();
    expect(compiled.querySelector('.az-whatsapp-inquiry-btn')).toBeTruthy();
  });
});
