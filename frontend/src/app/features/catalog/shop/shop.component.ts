import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CatalogStore } from '../../../core/catalog/catalog.store';
import { LocaleService } from '../../../core/i18n/locale.service';
import { ProductGridComponent } from '../../../shared/ui/product-grid/product-grid.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { FilterDrawerComponent } from '../components/filter-drawer/filter-drawer.component';
import type { Category, ProductAvailability } from '../../../domain/models/catalog.model';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [
    CommonModule,
    ProductGridComponent,
    ButtonComponent,
    SkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    FilterDrawerComponent,
  ],
  template: `
    <div class="az-shop">
      <!-- HEADER / TITLE -->
      <header class="az-shop__header">
        <div>
          <h1 class="az-shop__title">
            {{ isArabic() ? 'متجر الكتب والمقررات' : 'Bookstore Catalog' }}
          </h1>
          <p class="az-shop__subtitle">
            {{
              isArabic()
                ? 'استعرض كافة المناهج الأزهرية، التفاسير، ومراجع العلوم الإسلامية واللغوية'
                : 'Browse all textbooks, references, Islamic studies and Arabic books'
            }}
          </p>
        </div>

        <!-- Mobile Filter Toggle Button -->
        <div class="az-shop__mobile-filter-btn">
          <app-button
            (clicked)="isDrawerOpen.set(true)"
            variant="secondary"
            size="sm"
          >
            ⚙️ {{ isArabic() ? 'تصفية الكتب' : 'Filter Books' }}
            @if (hasActiveFilters()) {
              <span class="az-shop__filter-dot" aria-hidden="true">•</span>
            }
          </app-button>
        </div>
      </header>

      <!-- ACTIVE FILTERS BAR -->
      @if (hasActiveFilters()) {
        <div class="az-active-filters" aria-label="Active filters">
          <span class="az-active-filters__label">
            {{ isArabic() ? 'التصفيات الحالية:' : 'Active filters:' }}
          </span>

          @if (catalogStore.activeFilters().category) {
            <span class="az-filter-tag">
              {{ activeCategoryName() }}
              <button
                type="button"
                (click)="removeCategoryFilter()"
                class="az-filter-tag__remove"
                [attr.aria-label]="isArabic() ? 'إزالة تصفية التصنيف' : 'Remove category filter'"
              >
                ✕
              </button>
            </span>
          }

          @if (catalogStore.activeFilters().availability) {
            <span class="az-filter-tag">
              {{ availabilityLabel(catalogStore.activeFilters().availability!) }}
              <button
                type="button"
                (click)="removeAvailabilityFilter()"
                class="az-filter-tag__remove"
                [attr.aria-label]="isArabic() ? 'إزالة تصفية التوفر' : 'Remove availability filter'"
              >
                ✕
              </button>
            </span>
          }

          <button
            type="button"
            (click)="clearAllFilters()"
            class="az-active-filters__clear-all"
          >
            {{ isArabic() ? 'مسح الكل' : 'Clear all' }}
          </button>
        </div>
      }

      <div class="az-shop__layout">
        <!-- DESKTOP SIDEBAR FILTERS -->
        <aside class="az-shop__sidebar" aria-label="Catalog filters">
          <!-- CATEGORIES -->
          <div class="az-filter-box">
            <h3 class="az-filter-box__title">
              {{ isArabic() ? 'أقسام الكتب' : 'Categories' }}
            </h3>
            <ul class="az-filter-list">
              <li>
                <button
                  type="button"
                  class="az-filter-list__item"
                  [class.az-filter-list__item--active]="!catalogStore.activeFilters().category"
                  (click)="onSelectCategory(undefined)"
                >
                  {{ isArabic() ? 'جميع الأقسام' : 'All Categories' }}
                </button>
              </li>
              @for (cat of catalogStore.categories(); track cat.id) {
                <li>
                  <button
                    type="button"
                    class="az-filter-list__item"
                    [class.az-filter-list__item--active]="catalogStore.activeFilters().category === cat.slug"
                    (click)="onSelectCategory(cat.slug)"
                  >
                    {{ categoryName(cat) }}
                  </button>
                </li>
              }
            </ul>
          </div>

          <!-- AVAILABILITY -->
          <div class="az-filter-box">
            <h3 class="az-filter-box__title">
              {{ isArabic() ? 'حالة التوفر' : 'Availability' }}
            </h3>
            <ul class="az-filter-list">
              <li>
                <button
                  type="button"
                  class="az-filter-list__item"
                  [class.az-filter-list__item--active]="!catalogStore.activeFilters().availability"
                  (click)="onSelectAvailability(undefined)"
                >
                  {{ isArabic() ? 'الكل' : 'All' }}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  class="az-filter-list__item"
                  [class.az-filter-list__item--active]="catalogStore.activeFilters().availability === 'in_stock'"
                  (click)="onSelectAvailability('in_stock')"
                >
                  {{ isArabic() ? 'متوفر حالياً' : 'In Stock' }}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  class="az-filter-list__item"
                  [class.az-filter-list__item--active]="catalogStore.activeFilters().availability === 'out_of_stock'"
                  (click)="onSelectAvailability('out_of_stock')"
                >
                  {{ isArabic() ? 'نفدت الكمية' : 'Out of Stock' }}
                </button>
              </li>
            </ul>
          </div>
        </aside>

        <!-- MAIN PRODUCTS AREA -->
        <main class="az-shop__content">
          <!-- ERROR STATE -->
          @if (catalogStore.error()) {
            <app-error-state
              [message]="catalogStore.error()!"
              (retry)="retryLoad()"
            />
          }

          <!-- LOADING SKELETONS -->
          @else if (catalogStore.isLoading()) {
            <div class="az-shop__loading-grid" aria-busy="true">
              @for (item of [1, 2, 3, 4, 5, 6, 7, 8]; track item) {
                <div class="az-shop__skeleton-card">
                  <app-skeleton variant="rect" height="260px" />
                  <div class="az-shop__skeleton-content">
                    <app-skeleton variant="text" width="40%" />
                    <app-skeleton variant="text" width="90%" />
                    <app-skeleton variant="text" width="60%" />
                  </div>
                </div>
              }
            </div>
          }

          <!-- EMPTY STATE -->
          @else if (catalogStore.isEmpty()) {
            <app-empty-state
              [title]="isArabic() ? 'لم يتم العثور على كتب' : 'No books found'"
              [description]="
                isArabic()
                  ? 'لم نتمكن من العثور على أية نتائج تطابق خيارات التصفية المحددة.'
                  : 'We could not find any books matching your selected filters.'
              "
              actionLabel="إعادة تعيين الفلاتر"
              (action)="clearAllFilters()"
            />
          }

          <!-- PRODUCTS GRID -->
          @else {
            <div class="az-shop__results-meta">
              <span>
                {{
                  isArabic()
                    ? 'عرض ' + catalogStore.products().length + ' منتج'
                    : 'Showing ' + catalogStore.products().length + ' products'
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

      <!-- MOBILE FILTER DRAWER -->
      <app-filter-drawer
        [isOpen]="isDrawerOpen()"
        [categories]="catalogStore.categories()"
        [selectedCategory]="catalogStore.activeFilters().category"
        [selectedAvailability]="catalogStore.activeFilters().availability"
        (drawerClosed)="isDrawerOpen.set(false)"
        (apply)="onApplyDrawerFilters($event)"
        (clear)="clearAllFilters()"
      />
    </div>
  `,
  styleUrl: './shop.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopComponent implements OnInit {
  protected readonly catalogStore = inject(CatalogStore);
  protected readonly localeService = inject(LocaleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isDrawerOpen = signal<boolean>(false);

  ngOnInit(): void {
    // 1. Load categories if not loaded yet
    this.catalogStore.loadCategories().subscribe();

    // 2. Listen to URL Query Params to sync CatalogStore state
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const parsed = this.catalogStore.parseUrlFilters(params);
        this.catalogStore.loadProducts(parsed).subscribe();
      });
  }

  protected isArabic(): boolean {
    return this.localeService.isArabic();
  }

  protected categoryName(cat: Category): string {
    return this.isArabic() ? cat.name.ar : cat.name.en || cat.name.ar;
  }

  protected activeCategoryName(): string {
    const slug = this.catalogStore.activeFilters().category;
    if (!slug) return '';
    const cat = this.catalogStore.categories().find((c) => c.slug === slug || c.id === slug);
    return cat ? this.categoryName(cat) : slug;
  }

  protected availabilityLabel(avail: ProductAvailability): string {
    if (avail === 'in_stock') return this.isArabic() ? 'متوفر حالياً' : 'In Stock';
    if (avail === 'out_of_stock') return this.isArabic() ? 'نفدت الكمية' : 'Out of Stock';
    return this.isArabic() ? 'متاح للحجز' : 'Pre-order';
  }

  protected hasActiveFilters(): boolean {
    const f = this.catalogStore.activeFilters();
    return Boolean(f.category || f.availability);
  }

  protected currentPage(): number {
    return this.catalogStore.pagination()?.page ?? this.catalogStore.activeFilters().page ?? 1;
  }

  protected totalPages(): number {
    return this.catalogStore.pagination()?.totalPages ?? 1;
  }

  protected onSelectCategory(category: string | undefined): void {
    this.catalogStore.setFilters({ category, page: 1 });
    this.catalogStore.syncToUrl('/shop');
  }

  protected onSelectAvailability(availability: ProductAvailability | undefined): void {
    this.catalogStore.setFilters({ availability, page: 1 });
    this.catalogStore.syncToUrl('/shop');
  }

  protected removeCategoryFilter(): void {
    this.catalogStore.setFilters({ category: undefined, page: 1 });
    this.catalogStore.syncToUrl('/shop');
  }

  protected removeAvailabilityFilter(): void {
    this.catalogStore.setFilters({ availability: undefined, page: 1 });
    this.catalogStore.syncToUrl('/shop');
  }

  protected clearAllFilters(): void {
    this.catalogStore.clearFilters();
    this.catalogStore.syncToUrl('/shop');
  }

  protected onApplyDrawerFilters(event: { category?: string | undefined; availability?: ProductAvailability | undefined }): void {
    this.catalogStore.setFilters({
      category: event.category,
      availability: event.availability,
      page: 1,
    });
    this.catalogStore.syncToUrl('/shop');
  }

  protected onPrevPage(): void {
    const cur = this.currentPage();
    if (cur > 1) {
      this.catalogStore.setFilters({ page: cur - 1 });
      this.catalogStore.syncToUrl('/shop');
    }
  }

  protected onNextPage(): void {
    const cur = this.currentPage();
    const max = this.totalPages();
    if (cur < max) {
      this.catalogStore.setFilters({ page: cur + 1 });
      this.catalogStore.syncToUrl('/shop');
    }
  }

  protected retryLoad(): void {
    this.catalogStore.loadProducts().subscribe();
  }
}
