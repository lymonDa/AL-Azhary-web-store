import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VariantSelectorComponent } from './variant-selector.component';
import { LocaleService } from '../../../../core/i18n/locale.service';
import type { ProductVariant } from '../../../../domain/models/catalog.model';

describe('VariantSelectorComponent', () => {
  let component: VariantSelectorComponent;
  let fixture: ComponentFixture<VariantSelectorComponent>;

  const mockVariants: ProductVariant[] = [
    {
      variantId: 'v-1',
      attributes: { part: 'الجزء الأول' },
      label: { ar: 'الجزء الأول', en: 'Part 1' },
      priceMinor: 5000,
      currency: 'EGP',
      availability: 'in_stock',
      preOrderEligible: false,
      images: [],
    },
    {
      variantId: 'v-2',
      attributes: { part: 'الجزء الثاني' },
      label: { ar: 'الجزء الثاني', en: 'Part 2' },
      priceMinor: 5500,
      currency: 'EGP',
      availability: 'out_of_stock',
      preOrderEligible: false,
      images: [],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VariantSelectorComponent],
      providers: [LocaleService],
    }).compileComponents();

    fixture = TestBed.createComponent(VariantSelectorComponent);
    component = fixture.componentInstance;
  });

  it('should render all variant options', () => {
    fixture.componentRef.setInput('variants', mockVariants);
    fixture.componentRef.setInput('selectedVariantId', 'v-1');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.az-variant-selector__item');
    expect(buttons.length).toBe(2);
    expect(buttons[0]?.classList).toContain('az-variant-selector__item--selected');
  });

  it('should emit variantSelected on option click', () => {
    fixture.componentRef.setInput('variants', mockVariants);
    fixture.componentRef.setInput('selectedVariantId', 'v-1');
    fixture.detectChanges();

    spyOn(component.variantSelected, 'emit');

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.az-variant-selector__item');
    (buttons[1] as HTMLButtonElement).click();

    expect(component.variantSelected.emit).toHaveBeenCalledWith(mockVariants[1]!);
  });
});
