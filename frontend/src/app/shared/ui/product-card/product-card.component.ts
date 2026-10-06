import { Component, ChangeDetectionStrategy, input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LocaleService } from '../../../core/i18n/locale.service';
import { MoneyPipe } from '../../pipes/money.pipe';
import { StatusBadgeComponent } from '../../status/status-badge.component';
import type { Product } from '../../../domain/models/catalog.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe, StatusBadgeComponent],
  template: `
    <article class="az-product-card" [class.az-product-card--out-of-stock]="isOutOfStock()">
      <a
        [routerLink]="['/products', product().slug]"
        class="az-product-card__link"
        [attr.aria-label]="displayName()"
      >
        <div class="az-product-card__media">
          @if (hasImage() && !imageFailed()) {
            <img
              [src]="primaryImageUrl()"
              [alt]="displayName()"
              [loading]="priority() ? 'eager' : 'lazy'"
              (error)="onImageError()"
              class="az-product-card__image"
            />
          } @else {
            <div class="az-product-card__placeholder" aria-hidden="true">
              <span class="az-product-card__placeholder-icon">📚</span>
            </div>
          }

          <div class="az-product-card__badge-overlay">
            <app-status-badge kind="inventory" [status]="product().availability" />
          </div>
        </div>

        <div class="az-product-card__content">
          @if (metaAuthor()) {
            <p class="az-product-card__author">{{ metaAuthor() }}</p>
          }

          <h3 class="az-product-card__title">{{ displayName() }}</h3>

          @if (metaEducation()) {
            <p class="az-product-card__education">{{ metaEducation() }}</p>
          }

          <div class="az-product-card__footer">
            <div class="az-product-card__price">
              <span class="az-product-card__amount">{{ product().priceMinor | money }}</span>
            </div>

            @if (product().preOrderEligible && isOutOfStock()) {
              <span class="az-product-card__preorder-flag">
                {{ isArabic() ? 'حجز مسبق متاح' : 'Pre-order eligible' }}
              </span>
            }
          </div>
        </div>
      </a>
    </article>
  `,
  styleUrl: './product-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent {
  private readonly localeService = inject(LocaleService);

  readonly product = input.required<Product>();
  readonly priority = input<boolean>(false);

  protected readonly imageFailed = signal(false);

  protected isArabic(): boolean {
    return this.localeService.isArabic();
  }

  protected isOutOfStock(): boolean {
    return this.product().availability === 'out_of_stock';
  }

  protected displayName(): string {
    const p = this.product();
    return this.isArabic() ? p.name.ar : p.name.en || p.name.ar;
  }

  protected hasImage(): boolean {
    return (this.product().images?.length ?? 0) > 0;
  }

  protected primaryImageUrl(): string {
    return this.product().images[0]?.url ?? '';
  }

  protected onImageError(): void {
    this.imageFailed.set(true);
  }

  protected metaAuthor(): string | null {
    return this.product().metadata?.author ?? null;
  }

  protected metaEducation(): string | null {
    const meta = this.product().metadata;
    const parts: string[] = [];
    if (meta.stage) parts.push(meta.stage);
    if (meta.grade) parts.push(meta.grade);
    if (meta.subject) parts.push(meta.subject);
    return parts.length > 0 ? parts.join(' • ') : null;
  }
}
