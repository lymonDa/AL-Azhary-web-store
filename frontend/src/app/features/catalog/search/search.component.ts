import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CatalogStore } from '../../../core/catalog/catalog.store';
import { LocaleService } from '../../../core/i18n/locale.service';
import { ProductGridComponent } from '../../../shared/ui/product-grid/product-grid.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ProductGridComponent,
    ButtonComponent,
    SkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="az-search-page">
      <!-- SEARCH FORM HEADER -->
      <header class="az-search-page__header">
        <h1 class="az-search-page__title">
          {{ isArabic() ? 'البحث في متجر الكتب' : 'Search Bookstore' }}
        </h1>
        <p class="az-search-page__subtitle">
          {{
            isArabic()
              ? 'ابحث باسم الكتاب، اسم المؤلف، المادة الدراسية، أو الرقم الدولي (ISBN)'
              : 'Search by book title, author, subject, or ISBN'
          }}
        </p>

        <form class="az-search-form" (ngSubmit)="onSearchSubmit()">
          <div class="az-search-form__input-wrapper">
            <span class="az-search-form__icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              class="az-search-form__input"
              [placeholder]="isArabic() ? 'اكتب اسم الكتاب أو المؤلف...' : 'Type title or author...'"
              [(ngModel)]="searchQuery"
              name="searchQuery"
              autocomplete="off"
              [attr.aria-label]="isArabic() ? 'كلمة البحث' : 'Search query'"
            />
            @if (searchQuery) {
              <button
                type="button"
                class="az-search-form__clear"
                (click)="onClearQuery()"
                [attr.aria-label]="isArabic() ? 'مسح البحث' : 'Clear search'"
              >
                ✕
              </button>
            }
          </div>
          <app-button
            type="submit"
            variant="primary"
            size="md"
          >
            {{ isArabic() ? 'بحث' : 'Search' }}
          </app-button>
        </form>
      </header>

      <!-- RESULTS AREA -->
      <main class="az-search-page__content">
        <!-- ERROR STATE -->
        @if (catalogStore.error()) {
          <app-error-state
            [message]="catalogStore.error()!"
            (retry)="performSearch()"
          />
        }

        <!-- LOADING SKELETONS -->
        @else if (catalogStore.isLoading()) {
          <div class="az-search-page__loading-grid" aria-busy="true">
            @for (item of [1, 2, 3, 4, 5, 6, 7, 8]; track item) {
              <div class="az-search-page__skeleton-card">
                <app-skeleton variant="rect" height="260px" />
                <div class="az-search-page__skeleton-content">
                  <app-skeleton variant="text" width="40%" />
                  <app-skeleton variant="text" width="90%" />
                  <app-skeleton variant="text" width="60%" />
                </div>
              </div>
            }
          </div>
        }

        <!-- NO QUERY ENTERED INITIAL STATE -->
        @else if (!hasSearched() && !searchQuery) {
          <div class="az-search-page__initial-prompt">
            <span class="az-search-page__prompt-icon">📚</span>
            <p>
              {{
                isArabic()
                  ? 'أدخل كلمة البحث في الحقل أعلاه للعثور على الكتب والمقررات المطلوبة.'
                  : 'Enter search terms above to find your desired books.'
              }}
            </p>
          </div>
        }

        <!-- EMPTY STATE (NO RESULTS FOUND) -->
        @else if (catalogStore.isEmpty()) {
          <app-empty-state
            [title]="isArabic() ? 'لم يتم العثور على أية نتائج' : 'No results found'"
            [description]="
              isArabic()
                ? 'لم نتمكن من إيجاد كتب تطابق بحثك: &quot;' + searchQuery + '&quot;. جرب استخدام كلمات مفتاحية أخرى أو تحقق من صحة الحروف.'
                : 'No books found matching &quot;' + searchQuery + '&quot;.'
            "
            actionLabel="تصفح جميع الكتب"
            (action)="navigateToShop()"
          />
        }

        <!-- RESULTS GRID -->
        @else {
          <div class="az-search-page__results-meta">
            <span>
              {{
                isArabic()
                  ? 'تم العثور على ' + catalogStore.products().length + ' كتاب لكلمة: ' + searchQuery
                  : 'Found ' + catalogStore.products().length + ' results for: ' + searchQuery
              }}
            </span>
          </div>

          <app-product-grid [products]="catalogStore.products()" />

          <!-- PAGINATION -->
          @if (totalPages() > 1) {
            <nav class="az-pagination" [attr.aria-label]="isArabic() ? 'صفحات النتائج' : 'Pagination'">
              <app-button
                (clicked)="onPrevPage()"
                [disabled]="currentPage() <= 1"
                variant="secondary"
                size="sm"
              >
                {{ isArabic() ? 'السابق' : 'Previous' }}
              </app-button>

              <span class="az-pagination__info">
                {{
                  isArabic()
                    ? 'صفحة ' + currentPage() + ' من ' + totalPages()
                    : 'Page ' + currentPage() + ' of ' + totalPages()
                }}
              </span>

              <app-button
                (clicked)="onNextPage()"
                [disabled]="currentPage() >= totalPages()"
                variant="secondary"
                size="sm"
              >
                {{ isArabic() ? 'التالي' : 'Next' }}
              </app-button>
            </nav>
          }
        }
      </main>
    </div>
  `,
  styleUrl: './search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent implements OnInit {
  protected readonly catalogStore = inject(CatalogStore);
  protected readonly localeService = inject(LocaleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected searchQuery = '';
  protected readonly hasSearched = signal<boolean>(false);

  ngOnInit(): void {
    // 1. Listen to URL Query Params (e.g. ?q=tafseer&page=1)
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const query = params['q'] ?? params['search'] ?? '';
        this.searchQuery = query;
        if (query.trim().length > 0) {
          this.hasSearched.set(true);
          const page = Number(params['page']) || 1;
          this.performSearch(page);
        } else {
          this.hasSearched.set(false);
          this.catalogStore.clearFilters();
        }
      });
  }

  protected isArabic(): boolean {
    return this.localeService.isArabic();
  }

  protected onSearchSubmit(): void {
    const q = this.searchQuery.trim();
    if (q.length > 0) {
      this.router.navigate(['/search'], {
        queryParams: { q, page: 1 },
      });
    }
  }

  protected onClearQuery(): void {
    this.searchQuery = '';
    this.router.navigate(['/search']);
  }

  protected performSearch(page = 1): void {
    this.catalogStore.search(this.searchQuery, { page }).subscribe();
  }

  protected currentPage(): number {
    return this.catalogStore.pagination()?.page ?? 1;
  }

  protected totalPages(): number {
    return this.catalogStore.pagination()?.totalPages ?? 1;
  }

  protected onPrevPage(): void {
    const cur = this.currentPage();
    if (cur > 1) {
      this.router.navigate(['/search'], {
        queryParams: { q: this.searchQuery, page: cur - 1 },
      });
    }
  }

  protected onNextPage(): void {
    const cur = this.currentPage();
    const max = this.totalPages();
    if (cur < max) {
      this.router.navigate(['/search'], {
        queryParams: { q: this.searchQuery, page: cur + 1 },
      });
    }
  }

  protected navigateToShop(): void {
    this.router.navigate(['/shop']);
  }
}
