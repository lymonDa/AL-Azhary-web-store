import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CatalogStore } from '../../../core/catalog/catalog.store';
import { AppConfigStore } from '../../../core/config/app-config.store';
import { LocaleService } from '../../../core/i18n/locale.service';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { StatusBadgeComponent } from '../../../shared/status/status-badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { SkeletonComponent } from '../../../shared/ui/skeleton/skeleton.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state/error-state.component';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { ProductGalleryComponent } from '../components/product-gallery/product-gallery.component';
import { VariantSelectorComponent } from '../components/variant-selector/variant-selector.component';
import type { ProductVariant } from '../../../domain/models/catalog.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MoneyPipe,
    StatusBadgeComponent,
    ButtonComponent,
    SkeletonComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    ProductGalleryComponent,
    VariantSelectorComponent,
  ],
  template: `
    <div class="az-product-detail">
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
          @if (product()) {
            <li class="az-breadcrumbs__separator" aria-hidden="true">/</li>
            <li class="az-breadcrumbs__item az-breadcrumbs__item--active" aria-current="page">
              {{ productTitle() }}
            </li>
          }
        </ol>
      </nav>

      <!-- ERROR STATE -->
      @if (catalogStore.error()) {
        <app-error-state
          [message]="catalogStore.error()!"
          (retry)="loadProduct()"
        />
      }

      <!-- LOADING SKELETON -->
      @else if (catalogStore.isLoading()) {
        <div class="az-product-detail__loading" aria-busy="true">
          <div class="az-product-detail__loading-media">
            <app-skeleton variant="rect" height="420px" />
          </div>
          <div class="az-product-detail__loading-info">
            <app-skeleton variant="text" width="30%" />
            <app-skeleton variant="text" width="80%" height="32px" />
            <app-skeleton variant="text" width="40%" />
            <app-skeleton variant="text" width="100%" height="80px" />
            <app-skeleton variant="rect" height="48px" />
          </div>
        </div>
      }

      <!-- NOT FOUND STATE -->
      @else if (!product()) {
        <app-empty-state
          [title]="isArabic() ? 'الكتاب غير موجود' : 'Product Not Found'"
          [description]="
            isArabic()
              ? 'عذراً، لم يتم العثور على هذا المنتج أو قد تم نقله أو إيقاف توفره.'
              : 'Sorry, the requested book could not be found or has been removed.'
          "
          actionLabel="العودة للمتجر"
          (action)="navigateToShop()"
        />
      }

      <!-- PRODUCT CONTENT -->
      @else {
        <div class="az-product-detail__grid">
          <!-- MEDIA / GALLERY -->
          <div class="az-product-detail__media-col">
            <app-product-gallery
              [images]="product()!.images"
              [productName]="productTitle()"
            />
          </div>

          <!-- INFO / DETAILS -->
          <div class="az-product-detail__info-col">
            <!-- Author / Meta -->
            @if (product()!.metadata.author) {
              <div class="az-product-detail__author">
                {{ isArabic() ? 'المؤلف:' : 'Author:' }}
                <strong>{{ product()!.metadata.author }}</strong>
              </div>
            }

            <!-- Title -->
            <h1 class="az-product-detail__title">
              {{ productTitle() }}
            </h1>

            <!-- Badges Bar -->
            <div class="az-product-detail__badges">
              <app-status-badge
                kind="inventory"
                [status]="currentAvailability()"
              />
              @if (product()!.metadata.grade || product()!.metadata.stage) {
                <span class="az-product-detail__edu-tag">
                  🎓 {{ educationLabel() }}
                </span>
              }
            </div>

            <!-- Price -->
            <div class="az-product-detail__price-box">
              <span class="az-product-detail__price">
                {{ currentPriceMinor() | money }}
              </span>
              @if (currentAvailability() === 'out_of_stock') {
                <span class="az-product-detail__stock-warning">
                  {{ isArabic() ? 'نفدت الكمية بالمخزن حالياً' : 'Currently Out of Stock' }}
                </span>
              }
            </div>

            <!-- Description -->
            @if (productDescription()) {
              <div class="az-product-detail__description">
                <h3 class="az-product-detail__section-title">
                  {{ isArabic() ? 'نبذة عن الكتاب' : 'About this Book' }}
                </h3>
                <p>{{ productDescription() }}</p>
              </div>
            }

            <!-- Variants (if any) -->
            @if (hasVariants()) {
              <div class="az-product-detail__variants">
                <app-variant-selector
                  [variants]="product()!.variants"
                  [selectedVariantId]="selectedVariant()?.variantId ?? null"
                  (variantSelected)="onVariantSelected($event)"
                />
              </div>
            }

            <!-- Book Specifications / Metadata -->
            @if (hasSpecifications()) {
              <div class="az-product-detail__specs">
                <h3 class="az-product-detail__section-title">
                  {{ isArabic() ? 'بيانات الطبعة والنشر' : 'Book Details' }}
                </h3>
                <dl class="az-specs-list">
                  @if (product()!.metadata.publisher) {
                    <div class="az-specs-list__item">
                      <dt class="az-specs-list__key">{{ isArabic() ? 'دار النشر:' : 'Publisher:' }}</dt>
                      <dd class="az-specs-list__value">{{ product()!.metadata.publisher }}</dd>
                    </div>
                  }
                  @if (product()!.metadata.isbn) {
                    <div class="az-specs-list__item">
                      <dt class="az-specs-list__key">{{ isArabic() ? 'الرقم الدولي (ISBN):' : 'ISBN:' }}</dt>
                      <dd class="az-specs-list__value" dir="ltr">{{ product()!.metadata.isbn }}</dd>
                    </div>
                  }
                  @if (product()!.metadata.subject) {
                    <div class="az-specs-list__item">
                      <dt class="az-specs-list__key">{{ isArabic() ? 'المادة الدراسية:' : 'Subject:' }}</dt>
                      <dd class="az-specs-list__value">{{ product()!.metadata.subject }}</dd>
                    </div>
                  }
                </dl>
              </div>
            }

            <!-- Actions / Ordering Placeholder -->
            <div class="az-product-detail__actions">
              <!-- Cart Placeholder (Disabled - Phase 5) -->
              <div class="az-cart-placeholder">
                <app-button
                  variant="primary"
                  size="lg"
                  [disabled]="true"
                  [attr.title]="
                    isArabic()
                      ? 'الشراء المباشر عبر السلة سيتوفر في المرحلة القادمة'
                      : 'Cart and checkout will be available in Phase 5'
                  "
                >
                  🛒 {{ isArabic() ? 'إضافة إلى السلة (المرحلة 5)' : 'Add to Cart (Phase 5)' }}
                </app-button>
                <span class="az-cart-placeholder__notice">
                  {{
                    isArabic()
                      ? 'ميزة الطلب المباشر عبر الموقع قيد التجهيز للمرحلة القادمة.'
                      : 'Direct website purchasing is arriving in Phase 5.'
                  }}
                </span>
              </div>

              <!-- WhatsApp Direct Inquiry -->
              @if (whatsappInquiryUrl()) {
                <a
                  [href]="whatsappInquiryUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="az-whatsapp-inquiry-btn"
                >
                  💬 {{ isArabic() ? 'استفسار أو حجز عبر واتساب' : 'Inquire via WhatsApp' }}
                </a>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  protected readonly catalogStore = inject(CatalogStore);
  protected readonly configStore = inject(AppConfigStore);
  protected readonly localeService = inject(LocaleService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private currentSlug = '';
  protected readonly selectedVariant = signal<ProductVariant | null>(null);

  protected readonly product = computed(() => this.catalogStore.selectedProduct());

  protected readonly productTitle = computed(() => {
    const p = this.product();
    if (!p) return '';
    return this.isArabic() ? p.name.ar : p.name.en || p.name.ar;
  });

  protected readonly productDescription = computed(() => {
    const p = this.product();
    if (!p?.description) return '';
    return this.isArabic() ? p.description.ar : p.description.en || p.description.ar;
  });

  protected readonly hasVariants = computed(() => {
    const p = this.product();
    return Boolean(p && p.variants.length > 0);
  });

  protected readonly currentPriceMinor = computed(() => {
    const v = this.selectedVariant();
    if (v) return v.priceMinor;
    return this.product()?.priceMinor ?? 0;
  });

  protected readonly currentAvailability = computed(() => {
    const v = this.selectedVariant();
    if (v) return v.availability;
    return this.product()?.availability ?? 'out_of_stock';
  });

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const slug = params.get('slug');
        if (slug) {
          this.currentSlug = slug;
          this.loadProduct();
        }
      });
  }

  protected isArabic(): boolean {
    return this.localeService.isArabic();
  }

  protected loadProduct(): void {
    this.catalogStore.loadProductBySlug(this.currentSlug).subscribe({
      next: (prod) => {
        if (prod.variants.length > 0) {
          const firstInStock = prod.variants.find((v) => v.availability === 'in_stock');
          this.selectedVariant.set(firstInStock ?? prod.variants[0] ?? null);
        } else {
          this.selectedVariant.set(null);
        }
      },
    });
  }

  protected onVariantSelected(variant: ProductVariant): void {
    this.selectedVariant.set(variant);
  }

  protected educationLabel(): string {
    const meta = this.product()?.metadata;
    if (!meta) return '';
    const parts: string[] = [];
    if (meta.stage) parts.push(meta.stage);
    if (meta.grade) parts.push(meta.grade);
    return parts.join(' - ');
  }

  protected hasSpecifications(): boolean {
    const meta = this.product()?.metadata;
    return Boolean(meta && (meta.publisher || meta.isbn || meta.subject));
  }

  protected whatsappInquiryUrl(): string | null {
    const rawNumber = this.configStore.contact().whatsappNumber;
    if (!rawNumber) return null;
    const sanitized = rawNumber.replace(/[^0-9]/g, '');
    if (!sanitized) return null;

    const title = this.productTitle();
    const text = encodeURIComponent(
      this.isArabic()
        ? `السلام عليكم، أرغب في الاستفسار عن توفر كتاب: ${title}`
        : `Hello, I would like to inquire about: ${title}`,
    );

    return `https://wa.me/${sanitized}?text=${text}`;
  }

  protected navigateToShop(): void {
    window.location.href = '/shop';
  }
}
