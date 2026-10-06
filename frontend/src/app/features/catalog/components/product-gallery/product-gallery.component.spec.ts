import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductGalleryComponent } from './product-gallery.component';
import type { ProductImage } from '../../../../domain/models/catalog.model';

describe('ProductGalleryComponent', () => {
  let component: ProductGalleryComponent;
  let fixture: ComponentFixture<ProductGalleryComponent>;

  const mockImages: ProductImage[] = [
    {
      publicId: 'img-1',
      resourceType: 'image',
      format: 'jpg',
      bytes: 100,
      width: 400,
      height: 500,
      url: 'https://example.com/cover.jpg',
    },
    {
      publicId: 'img-2',
      resourceType: 'image',
      format: 'jpg',
      bytes: 120,
      width: 400,
      height: 500,
      url: 'https://example.com/back.jpg',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductGalleryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductGalleryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render main image and thumbnails when multiple images exist', () => {
    fixture.componentRef.setInput('images', mockImages);
    fixture.componentRef.setInput('productName', 'كتاب الفقه');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const mainImg = compiled.querySelector('.az-gallery__featured-img') as HTMLImageElement;
    expect(mainImg.src).toContain('https://example.com/cover.jpg');

    const thumbnails = compiled.querySelectorAll('.az-gallery__thumb-btn');
    expect(thumbnails.length).toBe(2);
  });

  it('should switch active image on thumbnail click', () => {
    fixture.componentRef.setInput('images', mockImages);
    fixture.componentRef.setInput('productName', 'كتاب الفقه');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const thumbnails = compiled.querySelectorAll('.az-gallery__thumb-btn');
    (thumbnails[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    const mainImg = compiled.querySelector('.az-gallery__featured-img') as HTMLImageElement;
    expect(mainImg.src).toContain('https://example.com/back.jpg');
  });

  it('should render placeholder when images list is empty', () => {
    fixture.componentRef.setInput('images', []);
    fixture.componentRef.setInput('productName', 'كتاب الفقه');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.az-gallery__placeholder')).toBeTruthy();
  });
});
