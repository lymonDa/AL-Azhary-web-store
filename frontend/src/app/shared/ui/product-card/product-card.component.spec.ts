import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductCardComponent } from './product-card.component';
import { LocaleService } from '../../../core/i18n/locale.service';
import type { Product } from '../../../domain/models/catalog.model';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  const mockProduct: Product = {
    id: 'p-1',
    slug: 'quran-kareem',
    name: { ar: 'المصحف الشريف', en: 'Holy Quran' },
    priceMinor: 10000,
    currency: 'EGP',
    availability: 'in_stock',
    categoryId: 'cat-1',
    images: [
      {
        publicId: 'img-1',
        resourceType: 'image',
        format: 'jpg',
        bytes: 1000,
        width: 300,
        height: 400,
        url: 'https://example.com/quran.jpg',
      },
    ],
    metadata: {
      author: 'مجمع الملك فهد',
      stage: 'المرحلة الثانوية',
      grade: 'الصف الأول',
    },
    variants: [],
    hasVariants: false,
    preOrderEligible: false,
    createdAt: '2026-01-01',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [provideRouter([]), LocaleService],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
  });

  it('should create and render in-stock product details', () => {
    expect(component).toBeTruthy();
    fixture.componentRef.setInput('product', mockProduct);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.az-product-card__title')?.textContent).toContain(
      'المصحف الشريف',
    );
    expect(compiled.querySelector('.az-product-card__author')?.textContent).toContain(
      'مجمع الملك فهد',
    );
    expect(compiled.querySelector('.az-product-card__price')?.textContent).toContain(
      'ج.م',
    );
  });

  it('should render missing image placeholder when product has no images', () => {
    const noImageProduct: Product = { ...mockProduct, images: [] };
    fixture.componentRef.setInput('product', noImageProduct);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.az-product-card__placeholder')).toBeTruthy();
  });

  it('should apply out-of-stock modifier class when product is out of stock', () => {
    const outOfStockProduct: Product = { ...mockProduct, availability: 'out_of_stock' };
    fixture.componentRef.setInput('product', outOfStockProduct);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector('.az-product-card--out-of-stock'),
    ).toBeTruthy();
  });
});
