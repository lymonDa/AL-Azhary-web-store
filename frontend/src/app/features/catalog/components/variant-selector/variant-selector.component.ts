import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocaleService } from '../../../../core/i18n/locale.service';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { StatusBadgeComponent } from '../../../../shared/status/status-badge.component';
import type { ProductVariant } from '../../../../domain/models/catalog.model';

@Component({
  selector: 'app-variant-selector',
  standalone: true,
  imports: [CommonModule, MoneyPipe, StatusBadgeComponent],
  template: `
    <div class="az-variant-selector" role="group" aria-label="اختيار نوع أو جزء الكتاب">
      <h4 class="az-variant-selector__heading">
        {{ isArabic() ? 'الخيارات المتاحة:' : 'Available Options:' }}
      </h4>

      <div class="az-variant-selector__list" role="radiogroup">
        @for (variant of variants(); track variant.variantId) {
          <button
            type="button"
            role="radio"
            [attr.aria-checked]="isSelected(variant)"
            class="az-variant-selector__item"
            [class.az-variant-selector__item--selected]="isSelected(variant)"
            [class.az-variant-selector__item--out-of-stock]="variant.availability === 'out_of_stock'"
            (click)="selectVariant(variant)"
          >
            <div class="az-variant-selector__item-top">
              <span class="az-variant-selector__item-title">
                {{ variantLabel(variant) }}
              </span>
              <span class="az-variant-selector__item-price">
                {{ variant.priceMinor | money }}
              </span>
            </div>

            <div class="az-variant-selector__item-bottom">
              <app-status-badge kind="inventory" [status]="variant.availability" />
            </div>
          </button>
        }
      </div>
    </div>
  `,
  styleUrl: './variant-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariantSelectorComponent {
  private readonly localeService = inject(LocaleService);

  readonly variants = input<readonly ProductVariant[]>([]);
  readonly selectedVariantId = input<string | null>(null);

  readonly variantSelected = output<ProductVariant>();

  protected isArabic(): boolean {
    return this.localeService.isArabic();
  }

  protected isSelected(variant: ProductVariant): boolean {
    return this.selectedVariantId() === variant.variantId;
  }

  protected variantLabel(variant: ProductVariant): string {
    return this.isArabic()
      ? variant.label.ar
      : variant.label.en || variant.label.ar;
  }

  protected selectVariant(variant: ProductVariant): void {
    this.variantSelected.emit(variant);
  }
}
