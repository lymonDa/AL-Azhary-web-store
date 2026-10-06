import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductGridComponent } from './product-grid.component';
import { LocaleService } from '../../../core/i18n/locale.service';
import type { Product } from '../../../domain/models/catalog.model';

describe('ProductGridComponent', () => {
  let component: ProductGridComponent;
  let fixture: ComponentFixture<ProductGridComponent>;

  const mockProducts: Product[] = [
    {
      id: 'p-1',
      slug: 'book-1',
      name: { ar: 'كتاب 1' },
      priceMinor: 5000,
      currency: 'EGP',
      availability: 'in_stock',
      categoryId: 'c-1',
      images: [],
      metadata: {},
      variants: [],
      hasVariants: false,
      preOrderEligible: false,
      createdAt: '2026-01-01',
    },
    {
      id: 'p-2',
      slug: 'book-2',
      name: { ar: 'كتاب 2' },
      priceMinor: 7500,
      currency: 'EGP',
      availability: 'in_stock',
      categoryId: 'c-1',
      images: [],
      metadata: {},
      variants: [],
      hasVariants: false,
      preOrderEligible: false,
      createdAt: '2026-01-01',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductGridComponent],
      providers: [provideRouter([]), LocaleService],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductGridComponent);
    component = fixture.componentInstance;
  });

  it('should render correct number of product cards', () => {
    expect(component).toBeTruthy();
    fixture.componentRef.setInput('products', mockProducts);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('app-product-card');
    expect(cards.length).toBe(2);
  });
});
