import { Component, ChangeDetectionStrategy, input, output, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocaleService } from '../../../../core/i18n/locale.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import type { Category, ProductAvailability } from '../../../../domain/models/catalog.model';

@Component({
  selector: 'app-filter-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  template: `
    @if (isOpen()) {
      <div
        class="az-filter-drawer-backdrop"
        (click)="onClose()"
        aria-hidden="true"
      ></div>

      <div
        class="az-filter-drawer"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="isArabic() ? 'تصفية المنتجات' : 'Filter products'"
      >
        <div class="az-filter-drawer__header">
          <h3 class="az-filter-drawer__title">
            {{ isArabic() ? 'تصفية المنتجات' : 'Filters' }}
          </h3>
          <button
            type="button"
            class="az-filter-drawer__close"
            (click)="onClose()"
            [attr.aria-label]="isArabic() ? 'إغلاق نافذة التصفية' : 'Close filters'"
          >
            ✕
          </button>
        </div>

        <div class="az-filter-drawer__body">
          <!-- Categories Filter -->
          <div class="az-filter-group">
            <h4 class="az-filter-group__title">
              {{ isArabic() ? 'التصنيف' : 'Category' }}
            </h4>
            <div class="az-filter-group__options">
              <label class="az-filter-option">
                <input
                  type="radio"
                  name="drawerCategory"
                  [value]="undefined"
                  [checked]="!tempCategory()"
                  (change)="tempCategory.set(undefined)"
                />
                <span class="az-filter-option__label">
                  {{ isArabic() ? 'جميع التصنيفات' : 'All categories' }}
                </span>
              </label>

              @for (cat of categories(); track cat.id) {
                <label class="az-filter-option">
                  <input
                    type="radio"
                    name="drawerCategory"
                    [value]="cat.slug"
                    [checked]="tempCategory() === cat.slug"
                    (change)="tempCategory.set(cat.slug)"
                  />
                  <span class="az-filter-option__label">
                    {{ isArabic() ? cat.name.ar : cat.name.en || cat.name.ar }}
                  </span>
                </label>
              }
            </div>
          </div>

          <!-- Availability Filter -->
          <div class="az-filter-group">
            <h4 class="az-filter-group__title">
              {{ isArabic() ? 'حالة التوفر' : 'Availability' }}
            </h4>
            <div class="az-filter-group__options">
              <label class="az-filter-option">
                <input
                  type="radio"
                  name="drawerAvailability"
                  [value]="undefined"
                  [checked]="!tempAvailability()"
                  (change)="tempAvailability.set(undefined)"
                />
                <span class="az-filter-option__label">
                  {{ isArabic() ? 'الكل' : 'All' }}
                </span>
              </label>
              <label class="az-filter-option">
                <input
                  type="radio"
                  name="drawerAvailability"
                  value="in_stock"
                  [checked]="tempAvailability() === 'in_stock'"
                  (change)="tempAvailability.set('in_stock')"
                />
                <span class="az-filter-option__label">
                  {{ isArabic() ? 'متوفر حالياً' : 'In Stock' }}
                </span>
              </label>
              <label class="az-filter-option">
                <input
                  type="radio"
                  name="drawerAvailability"
                  value="out_of_stock"
                  [checked]="tempAvailability() === 'out_of_stock'"
                  (change)="tempAvailability.set('out_of_stock')"
                />
                <span class="az-filter-option__label">
                  {{ isArabic() ? 'نفدت الكمية' : 'Out of Stock' }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div class="az-filter-drawer__footer">
          <app-button
            (clicked)="onClear()"
            variant="secondary"
            size="md"
          >
            {{ isArabic() ? 'مسح الفلاتر' : 'Clear all' }}
          </app-button>
          <app-button
            (clicked)="onApply()"
            variant="primary"
            size="md"
          >
            {{ isArabic() ? 'تطبيق' : 'Apply' }}
          </app-button>
        </div>
      </div>
    }
  `,
  styleUrl: './filter-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterDrawerComponent {
  private readonly localeService = inject(LocaleService);

  readonly isOpen = input<boolean>(false);
  readonly categories = input<readonly Category[]>([]);
  readonly selectedCategory = input<string | undefined>(undefined);
  readonly selectedAvailability = input<ProductAvailability | undefined>(undefined);

  readonly drawerClosed = output<void>();
  readonly apply = output<{ category?: string | undefined; availability?: ProductAvailability | undefined }>();
  readonly clear = output<void>();

  protected readonly tempCategory = signal<string | undefined>(undefined);
  protected readonly tempAvailability = signal<ProductAvailability | undefined>(undefined);

  constructor() {
    effect(() => {
      this.tempCategory.set(this.selectedCategory());
      this.tempAvailability.set(this.selectedAvailability());
    });
  }

  protected isArabic(): boolean {
    return this.localeService.isArabic();
  }

  protected onClose(): void {
    this.drawerClosed.emit();
  }

  protected onApply(): void {
    this.apply.emit({
      category: this.tempCategory(),
      availability: this.tempAvailability(),
    });
    this.drawerClosed.emit();
  }

  protected onClear(): void {
    this.tempCategory.set(undefined);
    this.tempAvailability.set(undefined);
    this.clear.emit();
    this.drawerClosed.emit();
  }
}
