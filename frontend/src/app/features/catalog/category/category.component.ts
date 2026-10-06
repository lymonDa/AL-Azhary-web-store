import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CatalogStore } from '../../../core/catalog/catalog.store';
import { LocaleService } from '../../../core/i18n/locale.service';
import { ProductGridComponent } from '../../../shared/ui/product-grid/product-grid.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ProductGridComponent,
    ButtonComponent,
    SkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="az-category-page">
      <!-- BREADCRUMBS -->
      <nav class="az-breadcrumbs" [attr.aria-label]="isArabic() ? 'مسار التنقل' : 'Breadcrumbs'">
        <ol class="az-breadcrumbs__list">
          <li class="az-breadcrumbs__item">
            <a routerLink="/" class="az-breadcrumbs__link">
              {{ isArabic() ? 'الرئيسية' : 'Home' }}
            </a>
          </li>
          <li class="az-breadcrumbs__separator" aria-hidden="true">/</li>
          <li class="az-breadcrumbs__item">
            <a routerLink="/shop" class="az-breadcrumbs__link">
              {{ isArabic() ? 'المتجر' : 'Shop' }}
            </a>
          </li>
          <li class="az-breadcrumbs__separator" aria-hidden="true">/</li>
          <li class="az-breadcrumbs__item az-breadcrumbs__item--active" aria-current="page">
            {{ currentCategoryTitle() }}
          </li>
        </ol>
      </nav>

      <!-- HEADER -->
      <header class="az-category-page__header">
        <h1 class="az-category-page__title">
          {{ currentCategoryTitle() }}
        </h1>
        <p class="az-category-page__subtitle">
          {{
            isArabic()
              ? 'تصفح جميع الكتب والمقررات المعتمدة التابعة لهذا القسم'
              : 'Browse all textbooks and titles in this category'
          }}
        </p>
      </header>

      <!-- CONTENT -->
      <main class="az-category-page__content">
        <!-- ERROR STATE -->
        @if (catalogStore.error()) {
          <app-error-state
            [message]="catalogStore.error()!"
            (retry)="loadCategoryProducts()"
          />
        }

        <!-- LOADING SKELETONS -->
        @else if (catalogStore.isLoading()) {
          <div class="az-category-page__loading-grid" aria-busy="true">
            @for (item of [1, 2, 3, 4, 5, 6, 7, 8]; track item) {
              <div class="az-category-page__skeleton-card">
                <app-skeleton variant="rect" height="260px" />
                <div class="az-category-page__skeleton-content">
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
            [title]="isArabic() ? 'لا توجد كتب متوفرة' : 'No books in this category'"
            [description]="
              isArabic()
                ? 'لم يتم إضافة كتب بعد في هذا القسم، يرجى تصفح باقي أقسام المتجر.'
                : 'There are currently no products in this category.'
            "
            actionLabel="تصفح جميع الكتب"
            (action)="navigateToShop()"
          />
        }

        <!-- PRODUCTS GRID -->
        @else {
          <div class="az-category-page__results-meta">
            <span>
              {{
                isArabic()
                  ? 'عرض ' + catalogStore.products().length + ' منتج في هذا القسم'
                  : 'Showing ' + catalogStore.products().length + ' products in this category'
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
  styleUrl: './category.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryComponent implements OnInit {
  protected readonly catalogStore = inject(CatalogStore);
  protected readonly localeService = inject(LocaleService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private currentSlug = '';

  protected readonly currentCategoryTitle = computed(() => {
    const categories = this.catalogStore.categories();
    const cat = categories.find((c) => c.slug === this.currentSlug || c.id === this.currentSlug);
    if (!cat) {
      return this.currentSlug || (this.isArabic() ? 'القسم' : 'Category');
    }
    return this.isArabic() ? cat.name.ar : cat.name.en || cat.name.ar;
  });

  ngOnInit(): void {
    // 1. Ensure categories are available
    this.catalogStore.loadCategories().subscribe();

    // 2. React to route param changes
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const slug = params.get('slug');
        if (slug) {
          this.currentSlug = slug;
          this.loadCategoryProducts();
        }
      });
  }

  protected isArabic(): boolean {
    return this.localeService.isArabic();
  }

  protected loadCategoryProducts(page = 1): void {
    this.catalogStore.loadProducts({
      category: this.currentSlug,
      page,
      availability: undefined,
    }).subscribe();
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
      this.loadCategoryProducts(cur - 1);
    }
  }

  protected onNextPage(): void {
    const cur = this.currentPage();
    const max = this.totalPages();
    if (cur < max) {
      this.loadCategoryProducts(cur + 1);
    }
  }

  protected navigateToShop(): void {
    window.location.href = '/shop';
  }
}
