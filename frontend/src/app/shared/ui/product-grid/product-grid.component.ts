import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCardComponent } from '../product-card/product-card.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import type { Product } from '../../../domain/models/catalog.model';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, SkeletonComponent],
  template: `
    <div class="az-product-grid" [attr.aria-busy]="loading()">
      @if (loading()) {
        @for (item of skeletonArray(); track $index) {
          <div class="az-product-grid__skeleton-card">
            <app-skeleton variant="rect" inlineSize="100%" blockSize="260px" />
            <div class="az-product-grid__skeleton-details">
              <app-skeleton variant="text" inlineSize="60%" blockSize="0.75rem" />
              <app-skeleton variant="text" inlineSize="90%" blockSize="1rem" />
              <app-skeleton variant="text" inlineSize="40%" blockSize="1rem" />
            </div>
          </div>
        }
      } @else {
        @for (product of products(); track product.id) {
          <app-product-card [product]="product" />
        }
      }
    </div>
  `,
  styleUrl: './product-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGridComponent {
  readonly products = input<readonly Product[]>([]);
  readonly loading = input<boolean>(false);
  readonly skeletonCount = input<number>(8);

  protected skeletonArray(): number[] {
    return Array.from({ length: this.skeletonCount() }, (_, i) => i);
  }
}
