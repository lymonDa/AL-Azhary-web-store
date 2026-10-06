import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { SearchComponent } from './search.component';
import { CatalogStore } from '../../../core/catalog/catalog.store';
import { LocaleService } from '../../../core/i18n/locale.service';

describe('SearchComponent', () => {
  let fixture: ComponentFixture<SearchComponent>;
  let catalogStoreSpy: jasmine.SpyObj<CatalogStore>;

  beforeEach(async () => {
    catalogStoreSpy = jasmine.createSpyObj('CatalogStore', [
      'search',
      'clearFilters',
    ], {
      products: () => [],
      pagination: () => null,
      isLoading: () => false,
      isEmpty: () => false,
      error: () => null,
    });

    catalogStoreSpy.search.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [SearchComponent],
      providers: [
        provideRouter([]),
        LocaleService,
        { provide: CatalogStore, useValue: catalogStoreSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ q: 'tafseer', page: '1' }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
  });

  it('should execute search on query parameter presence', () => {
    fixture.detectChanges();
    expect(catalogStoreSpy.search).toHaveBeenCalledWith('tafseer', { page: 1 });

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.az-search-page__title')).toBeTruthy();
  });
});
