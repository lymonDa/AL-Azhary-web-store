import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CatalogStore } from '../../../core/catalog/catalog.store';
import { AppConfigStore } from '../../../core/config/app-config.store';
import { LocaleService } from '../../../core/i18n/locale.service';
import { ProductCardComponent } from '../../../shared/ui/product-card/product-card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import type { ContentModule } from '../../../domain/models/catalog.model';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ProductCardComponent,
    ButtonComponent,
  ],
  template: `
    <div class="az-home">
      <!-- HERO SECTION -->
      <section class="az-hero" aria-labelledby="hero-title">
        <div class="az-hero__container">
          <div class="az-hero__content">
            <span class="az-hero__tag">
              {{ isArabic() ? 'مكتبة أزهرية وعلمية متكاملة' : 'Integrated Azhari & Academic Bookstore' }}
            </span>
            <h1 id="hero-title" class="az-hero__title">
              {{
                isArabic()
                  ? 'منصتك الموثوقة للكتب الأزهرية والمراجع الدراسية'
                  : 'Your Trusted Platform for Azhari Textbooks & Academic Books'
              }}
            </h1>
            <p class="az-hero__description">
              {{
                isArabic()
                  ? 'نوفر كافة المناهج الأزهرية، التفاسير، كتب الفقه واللغة، مع إمكانية التوصيل لجميع محافظات جمهورية مصر العربية.'
                  : 'Providing curriculum textbooks, Tafseer, Fiqh, and Arabic literature with nationwide delivery across Egypt.'
              }}
            </p>
            <div class="az-hero__actions">
              <app-button routerLink="/shop" variant="primary" size="lg">
                {{ isArabic() ? 'تصفح جميع الكتب والمتجر' : 'Explore All Books' }}
              </app-button>
              @if (whatsappUrl()) {
                <a
                  [href]="whatsappUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="az-hero__whatsapp-btn"
                >
                  💬 {{ isArabic() ? 'استفسار عبر واتساب' : 'WhatsApp Inquiry' }}
                </a>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- CONTENT MODULES (FROM BACKEND) -->
      @if (catalogStore.homeModules().length > 0) {
        @for (module of catalogStore.homeModules(); track module.id) {
          <section class="az-home-section" [attr.aria-label]="moduleTitle(module)">
            <div class="az-home-section__header">
              <h2 class="az-home-section__title">{{ moduleTitle(module) }}</h2>
              @if (module.body) {
                <p class="az-home-section__desc">{{ moduleBody(module) }}</p>
              }
            </div>

            <!-- Featured Products Module -->
            @if (module.moduleType === 'featured_products' && module.products.length > 0) {
              <div class="az-home-grid">
                @for (prod of module.products; track prod.id) {
                  <app-product-card [product]="prod" />
                }
              </div>
            }

            <!-- Category Grid Module -->
            @if (module.moduleType === 'category_grid' && module.categories.length > 0) {
              <div class="az-category-grid">
                @for (cat of module.categories; track cat.id) {
                  <a [routerLink]="['/category', cat.slug]" class="az-category-card">
                    <span class="az-category-card__icon">📖</span>
                    <h3 class="az-category-card__title">{{ isArabic() ? cat.name.ar : cat.name.en || cat.name.ar }}</h3>
                  </a>
                }
              </div>
            }

            <!-- Announcement / Promo Banner -->
            @if (module.moduleType === 'announcement' || module.moduleType === 'promo_banner') {
              <div class="az-banner-card">
                <div class="az-banner-card__content">
                  <h3 class="az-banner-card__title">{{ moduleTitle(module) }}</h3>
                  @if (module.body) {
                    <p class="az-banner-card__text">{{ moduleBody(module) }}</p>
                  }
                </div>
              </div>
            }
          </section>
        }
      } @else {
        <!-- STABLE CATEGORIES FALLBACK IF CONTENT MODULES EMPTY -->
        <section class="az-home-section" aria-labelledby="categories-heading">
          <div class="az-home-section__header">
            <h2 id="categories-heading" class="az-home-section__title">
              {{ isArabic() ? 'أقسام الكتب والمكتبة' : 'Bookstore Categories' }}
            </h2>
            <p class="az-home-section__desc">
              {{ isArabic() ? 'تصفح الكتب بحسب القسم العلمي والدراسي' : 'Browse by academic field and level' }}
            </p>
          </div>

          <div class="az-category-grid">
            @for (cat of catalogStore.categories(); track cat.id) {
              <a [routerLink]="['/category', cat.slug]" class="az-category-card">
                <span class="az-category-card__icon">📚</span>
                <h3 class="az-category-card__title">{{ isArabic() ? cat.name.ar : cat.name.en || cat.name.ar }}</h3>
              </a>
            }
          </div>
        </section>
      }

      <!-- VALUE PROPOSITION / TRUST CARDS -->
      <section class="az-trust-section" aria-labelledby="trust-heading">
        <h2 id="trust-heading" class="sr-only">
          {{ isArabic() ? 'مميزات مكتبة الأزهري' : 'Store Advantages' }}
        </h2>
        <div class="az-trust-grid">
          <div class="az-trust-card">
            <span class="az-trust-card__icon" aria-hidden="true">🚚</span>
            <h3 class="az-trust-card__title">{{ isArabic() ? 'شحن لجميع المحافظات' : 'Nationwide Delivery' }}</h3>
            <p class="az-trust-card__desc">
              {{ isArabic() ? 'توصيل موثوق وسريع لكافة أنحاء مصر' : 'Reliable delivery across all Egyptian governorates' }}
            </p>
          </div>

          <div class="az-trust-card">
            <span class="az-trust-card__icon" aria-hidden="true">🏷️</span>
            <h3 class="az-trust-card__title">{{ isArabic() ? 'أسعار رسمية ومعتمدة' : 'Official Prices' }}</h3>
            <p class="az-trust-card__desc">
              {{ isArabic() ? 'أسعار واضحة ومحددة لكافة الكتب والمقررات' : 'Transparent pricing on all textbooks and books' }}
            </p>
          </div>

          <div class="az-trust-card">
            <span class="az-trust-card__icon" aria-hidden="true">💬</span>
            <h3 class="az-trust-card__title">{{ isArabic() ? 'دعم واستفسار مباشر' : 'Direct Support' }}</h3>
            <p class="az-trust-card__desc">
              {{ isArabic() ? 'فريق خدمة العملاء متاح للرد على استفساراتكم' : 'Support team ready to answer inquiries' }}
            </p>
          </div>
        </div>
      </section>
    </div>
  `,
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  protected readonly catalogStore = inject(CatalogStore);
  protected readonly configStore = inject(AppConfigStore);
  protected readonly localeService = inject(LocaleService);

  ngOnInit(): void {
    this.catalogStore.loadCategories().subscribe();
    this.catalogStore.loadHomeContent().subscribe();
  }

  protected isArabic(): boolean {
    return this.localeService.isArabic();
  }

  protected whatsappUrl(): string | null {
    const rawNumber = this.configStore.contact().whatsappNumber;
    if (!rawNumber) return null;
    const sanitized = rawNumber.replace(/[^0-9]/g, '');
    return sanitized ? `https://wa.me/${sanitized}` : null;
  }

  protected moduleTitle(module: ContentModule): string {
    return this.isArabic() ? module.title.ar : module.title.en || module.title.ar;
  }

  protected moduleBody(module: ContentModule): string | null {
    if (!module.body) return null;
    return this.isArabic() ? module.body.ar : module.body.en || module.body.ar;
  }
}
