import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { ProductImage } from '../../../../domain/models/catalog.model';

@Component({
  selector: 'app-product-gallery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="az-gallery">
      <!-- Main Featured Image -->
      <div class="az-gallery__featured">
        @if (hasImages() && activeImage()) {
          <img
            [src]="activeImage()!.url"
            [alt]="productName() + ' - صورة ' + (selectedIndex() + 1)"
            class="az-gallery__featured-img"
          />
        } @else {
          <div class="az-gallery__placeholder" aria-hidden="true">
            <span class="az-gallery__placeholder-icon">📚</span>
          </div>
        }
      </div>

      <!-- Thumbnail Strip -->
      @if (images().length > 1) {
        <div
          class="az-gallery__thumbnails"
          role="tablist"
          tabindex="0"
          aria-label="معرض صور المنتج"
          (keydown)="onKeydown($event)"
        >
          @for (img of images(); track img.publicId; let idx = $index) {
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="selectedIndex() === idx"
              [attr.aria-label]="'عرض الصورة ' + (idx + 1)"
              class="az-gallery__thumb-btn"
              [class.az-gallery__thumb-btn--active]="selectedIndex() === idx"
              (click)="selectImage(idx)"
            >
              <img
                [src]="img.url"
                [alt]="'مصغرة ' + (idx + 1)"
                class="az-gallery__thumb-img"
              />
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './product-gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductGalleryComponent {
  readonly images = input<readonly ProductImage[]>([]);
  readonly productName = input.required<string>();

  protected readonly selectedIndex = signal(0);

  protected hasImages(): boolean {
    return this.images().length > 0;
  }

  protected activeImage(): ProductImage | null {
    const list = this.images();
    const idx = this.selectedIndex();
    return list[idx] ?? list[0] ?? null;
  }

  protected selectImage(index: number): void {
    if (index >= 0 && index < this.images().length) {
      this.selectedIndex.set(index);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    const total = this.images().length;
    if (total <= 1) return;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      const next = (this.selectedIndex() + 1) % total;
      this.selectImage(next);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      const prev = (this.selectedIndex() - 1 + total) % total;
      this.selectImage(prev);
    }
  }
}
