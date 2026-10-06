import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterDrawerComponent } from './filter-drawer.component';
import { LocaleService } from '../../../../core/i18n/locale.service';
import type { Category } from '../../../../domain/models/catalog.model';

describe('FilterDrawerComponent', () => {
  let component: FilterDrawerComponent;
  let fixture: ComponentFixture<FilterDrawerComponent>;

  const mockCategories: Category[] = [
    {
      id: 'c-1',
      slug: 'tafseer',
      name: { ar: 'التفسير' },
      displayOrder: 1,
      isActive: true,
      isBooksCore: true,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterDrawerComponent],
      providers: [LocaleService],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterDrawerComponent);
    component = fixture.componentInstance;
  });

  it('should not render drawer when isOpen is false', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.az-filter-drawer')).toBeNull();
  });

  it('should render drawer and categories when isOpen is true', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.componentRef.setInput('categories', mockCategories);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.az-filter-drawer')).toBeTruthy();
    expect(compiled.textContent).toContain('التفسير');
  });

  it('should emit drawerClosed on close button click', () => {
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    spyOn(component.drawerClosed, 'emit');

    const compiled = fixture.nativeElement as HTMLElement;
    const closeBtn = compiled.querySelector('.az-filter-drawer__close') as HTMLButtonElement;
    closeBtn.click();

    expect(component.drawerClosed.emit).toHaveBeenCalled();
  });
});
