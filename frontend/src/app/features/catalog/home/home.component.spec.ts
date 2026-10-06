import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HomeComponent } from './home.component';
import { CatalogStore } from '../../../core/catalog/catalog.store';
import { AppConfigStore } from '../../../core/config/app-config.store';
import { LocaleService } from '../../../core/i18n/locale.service';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let catalogStoreSpy: jasmine.SpyObj<CatalogStore>;

  beforeEach(async () => {
    catalogStoreSpy = jasmine.createSpyObj('CatalogStore', [
      'loadCategories',
      'loadHomeContent',
    ], {
      homeModules: () => [],
      categories: () => [
        {
          id: 'cat-1',
          slug: 'fiqh',
          name: { ar: 'الفقه' },
          displayOrder: 1,
          isActive: true,
          isBooksCore: true,
        },
      ],
    });

    catalogStoreSpy.loadCategories.and.returnValue(of([]));
    catalogStoreSpy.loadHomeContent.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
  });

  it('should load categories and home content on init', () => {
    fixture.detectChanges();
    expect(catalogStoreSpy.loadCategories).toHaveBeenCalled();
    expect(catalogStoreSpy.loadHomeContent).toHaveBeenCalled();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.az-hero__title')).toBeTruthy();
    expect(compiled.querySelector('.az-category-grid')).toBeTruthy();
    expect(compiled.querySelector('.az-trust-grid')).toBeTruthy();
  });
});
