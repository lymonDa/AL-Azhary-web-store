import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CartStore } from '../../core/cart/cart.store';
import { LocaleService } from '../../core/i18n/locale.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { SkeletonComponent } from '../../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../shared/ui/error-state/error-state.component';
import { IconComponent } from '../../shared/ui/icon/icon.component';
import { QuantityStepperComponent } from '../../shared/forms/quantity-stepper/quantity-stepper.component';
import { ConfirmDialogComponent } from '../../shared/overlay/modal/confirm-dialog.component';
import { ModalComponent } from '../../shared/overlay/modal/modal.component';
import { ToastService } from '../../shared/overlay/toast/toast.service';
import type { CartItem } from '../../domain/models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MoneyPipe,
    ButtonComponent,
    SkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    IconComponent,
    QuantityStepperComponent,
    ConfirmDialogComponent,
    ModalComponent,
  ],
  template: `
    <div class="az-cart-page" [attr.dir]="direction()">
      <div class="az-cart-page__container">
        <!-- HEADER -->
        <header class="az-cart-page__header">
          <nav
            class="az-breadcrumbs"
            [attr.aria-label]="isArabic() ? 'مسار التنقل' : 'Breadcrumbs'"
          >
            <ol class="az-breadcrumbs__list">
              <li class="az-breadcrumbs__item">
                <a routerLink="/" class="az-breadcrumbs__link">
                  {{ isArabic() ? 'الرئيسية' : 'Home' }}
                </a>
              </li>
              <li class="az-breadcrumbs__separator" aria-hidden="true">/</li>
              <li class="az-breadcrumbs__item az-breadcrumbs__item--active" aria-current="page">
                {{ isArabic() ? 'سلة التسوق' : 'Shopping Cart' }}
              </li>
            </ol>
          </nav>

          <h1 class="az-cart-page__title">
            {{ isArabic() ? 'سلة التسوق' : 'Shopping Cart' }}
            @if (cartStore.totalQuantity() > 0) {
              <span class="az-cart-page__badge">
                ({{ cartStore.totalQuantity() }} {{ isArabic() ? 'منتجات' : 'items' }})
              </span>
            }
          </h1>
        </header>

        <!-- STALE CART BANNER -->
        @if (cartStore.isStale()) {
          <div class="az-cart-alert az-cart-alert--warning" role="alert">
            <app-icon name="alert-triangle" [size]="20" />
            <div class="az-cart-alert__content">
              <p class="az-cart-alert__text">
                {{
                  isArabic()
                    ? 'تم تعديل السلة في جلسة أخرى أو حدث تعارض في الإصدار. يرجى تحديث السلة لمراجعة الأسعار والكميات المحدثة.'
                    : 'Your cart was updated in another session or had a version conflict. Please refresh to review current items and prices.'
                }}
              </p>
              <button
                type="button"
                class="az-cart-alert__action"
                (click)="onRefreshCart()"
              >
                {{ isArabic() ? 'تحديث السلة الآن' : 'Refresh Cart Now' }}
              </button>
            </div>
          </div>
        }

        <!-- MUTATION ERROR BANNER -->
        @if (cartStore.error() && !cartStore.isLoading()) {
          <div class="az-cart-alert az-cart-alert--danger" role="alert">
            <app-icon name="alert-circle" [size]="20" />
            <div class="az-cart-alert__content">
              <p class="az-cart-alert__text">{{ cartStore.error() }}</p>
              <button
                type="button"
                class="az-cart-alert__action"
                (click)="onDismissError()"
              >
                {{ isArabic() ? 'إغلاق' : 'Dismiss' }}
              </button>
            </div>
          </div>
        }

        <!-- LOADING SKELETON STATE -->
        @if (cartStore.isLoading() && !cartStore.cart()) {
          <div class="az-cart-skeleton" aria-busy="true" [attr.aria-label]="isArabic() ? 'جاري تحميل السلة' : 'Loading cart'">
            <div class="az-cart-skeleton__items">
              @for (i of [1, 2, 3]; track i) {
                <div class="az-cart-skeleton__row">
                  <app-skeleton width="80px" height="80px" />
                  <div class="az-cart-skeleton__details">
                    <app-skeleton width="60%" height="20px" />
                    <app-skeleton width="40%" height="16px" />
                    <app-skeleton width="25%" height="18px" />
                  </div>
                  <app-skeleton width="110px" height="36px" />
                </div>
              }
            </div>
            <div class="az-cart-skeleton__summary">
              <app-skeleton width="100%" height="250px" />
            </div>
          </div>
        }

        <!-- LOAD FAILED STATE -->
        @else if (cartStore.error() && !cartStore.cart()) {
          <app-error-state
            [title]="isArabic() ? 'تعذر تحميل سلة التسوق' : 'Failed to load cart'"
            [message]="cartStore.error()"
            (retry)="onRefreshCart()"
          />
        }

        <!-- EMPTY STATE -->
        @else if (cartStore.isEmpty()) {
          <app-empty-state
            icon="🛍️"
            [title]="isArabic() ? 'سلة التسوق فارغة' : 'Your cart is empty'"
            [description]="
              isArabic()
                ? 'لم تقم بإضافة أي كتب أو منتجات إلى السلة بعد. تصفح المتجر واكتشف تشكيلتنا المميزة.'
                : 'You have not added any books or products to your cart yet. Explore our shop and discover our collection.'
            "
            [actionText]="isArabic() ? 'تصفح المتجر' : 'Browse Shop'"
            actionRoute="/shop"
          />
        }

        <!-- LOADED STATE WITH ITEMS -->
        @else {
          <div class="az-cart-layout">
            <!-- ITEMS LIST -->
            <section
              class="az-cart-items"
              [attr.aria-label]="isArabic() ? 'قائمة المنتجات في السلة' : 'Cart items list'"
            >
              <div class="az-cart-items__header">
                <span class="az-cart-items__col-product">
                  {{ isArabic() ? 'المنتج' : 'Product' }}
                </span>
                <span class="az-cart-items__col-price">
                  {{ isArabic() ? 'السعر' : 'Price' }}
                </span>
                <span class="az-cart-items__col-qty">
                  {{ isArabic() ? 'الكمية' : 'Quantity' }}
                </span>
                <span class="az-cart-items__col-total">
                  {{ isArabic() ? 'المجموع' : 'Subtotal' }}
                </span>
                <span class="az-cart-items__col-actions" aria-hidden="true"></span>
              </div>

              <div class="az-cart-items__list" role="list">
                @for (item of cartStore.items(); track item.id) {
                  <article class="az-cart-item" role="listitem">
                    <!-- PRODUCT IMAGE -->
                    <div class="az-cart-item__media">
                      @if (item.imageSnapshot) {
                        <img
                          [src]="item.imageSnapshot"
                          [alt]="getProductName(item)"
                          class="az-cart-item__image"
                          loading="lazy"
                        />
                      } @else {
                        <div class="az-cart-item__placeholder">
                          <app-icon name="shopping-bag" [size]="28" />
                        </div>
                      }
                    </div>

                    <!-- DETAILS -->
                    <div class="az-cart-item__details">
                      <h2 class="az-cart-item__title">
                        {{ getProductName(item) }}
                      </h2>

                      @if (item.variantId) {
                        <p class="az-cart-item__variant">
                          <span class="az-cart-item__variant-label">
                            {{ isArabic() ? 'النوع / المواصفة:' : 'Variant:' }}
                          </span>
                          {{ item.variantId }}
                        </p>
                      }

                      <!-- MOBILE-ONLY PRICE -->
                      <div class="az-cart-item__mobile-price">
                        <span class="az-cart-item__unit-price">
                          {{ item.unitPrice | money }}
                        </span>
                      </div>
                    </div>

                    <!-- UNIT PRICE (DESKTOP) -->
                    <div class="az-cart-item__unit-price-col">
                      <span class="az-cart-item__unit-price">
                        {{ item.unitPrice | money }}
                      </span>
                    </div>

                    <!-- QUANTITY STEPPER -->
                    <div class="az-cart-item__quantity-col">
                      <app-quantity-stepper
                        [min]="1"
                        [disabled]="cartStore.isMutating()"
                        [ngModel]="item.quantity"
                        (valueChange)="onUpdateQuantity(item.id, $event)"
                      />
                    </div>

                    <!-- LINE SUBTOTAL -->
                    <div class="az-cart-item__total-col">
                      <strong class="az-cart-item__line-total">
                        {{ item.lineTotal | money }}
                      </strong>
                    </div>

                    <!-- REMOVE ACTION -->
                    <div class="az-cart-item__actions-col">
                      <button
                        type="button"
                        class="az-cart-item__remove-btn"
                        [disabled]="cartStore.isMutating()"
                        (click)="onConfirmRemove(item)"
                        [attr.aria-label]="
                          isArabic()
                            ? 'حذف ' + getProductName(item) + ' من السلة'
                            : 'Remove ' + getProductName(item) + ' from cart'
                        "
                      >
                        <app-icon name="trash-2" [size]="18" />
                      </button>
                    </div>
                  </article>
                }
              </div>

              <!-- CART FOOTER ACTIONS -->
              <div class="az-cart-items__footer">
                <a routerLink="/shop" class="az-cart-continue-link">
                  <app-icon [name]="isArabic() ? 'chevron-right' : 'chevron-left'" [size]="16" />
                  {{ isArabic() ? 'متابعة التسوق' : 'Continue Shopping' }}
                </a>

                <button
                  type="button"
                  class="az-cart-clear-btn"
                  [disabled]="cartStore.isMutating()"
                  (click)="onConfirmClear()"
                >
                  <app-icon name="trash-2" [size]="16" />
                  {{ isArabic() ? 'إفراغ السلة بالكامل' : 'Clear Entire Cart' }}
                </button>
              </div>
            </section>

            <!-- CART SUMMARY SIDEBAR -->
            <aside
              class="az-cart-summary"
              [attr.aria-label]="isArabic() ? 'ملخص سلة التسوق' : 'Cart order summary'"
            >
              <div class="az-cart-summary__card">
                <h2 class="az-cart-summary__title">
                  {{ isArabic() ? 'ملخص الطلب' : 'Order Summary' }}
                </h2>

                <div class="az-cart-summary__rows">
                  <div class="az-cart-summary__row">
                    <span class="az-cart-summary__label">
                      {{ isArabic() ? 'عدد المنتجات' : 'Total Items' }}
                    </span>
                    <span class="az-cart-summary__val">
                      {{ cartStore.totalQuantity() }}
                    </span>
                  </div>

                  <div class="az-cart-summary__row">
                    <span class="az-cart-summary__label">
                      {{ isArabic() ? 'المجموع الفرعي' : 'Subtotal' }}
                    </span>
                    <strong class="az-cart-summary__val az-cart-summary__val--subtotal">
                      {{ cartStore.subtotal() | money }}
                    </strong>
                  </div>

                  <div class="az-cart-summary__note">
                    <app-icon name="info" [size]="16" />
                    <span>
                      {{
                        isArabic()
                          ? 'تكلفة الشحن وقسائم الخصم تحسب بدقة في الخطوة التالية بناءً على العنوان وطريقة الاستلام.'
                          : 'Shipping fees and discount coupons are calculated in the next step based on delivery address.'
                      }}
                    </span>
                  </div>
                </div>

                <div class="az-cart-summary__actions">
                  <app-button
                    variant="primary"
                    size="lg"
                    [fullWidth]="true"
                    [disabled]="cartStore.isMutating() || cartStore.isEmpty()"
                    (clicked)="onProceedToCheckout()"
                  >
                    {{ isArabic() ? 'متابعة إلى إتمام الطلب' : 'Proceed to Checkout' }}
                    <app-icon [name]="isArabic() ? 'chevron-left' : 'chevron-right'" [size]="18" />
                  </app-button>
                </div>
              </div>
            </aside>
          </div>
        }

        <!-- REMOVE ITEM CONFIRMATION DIALOG -->
        <app-confirm-dialog
          [isOpen]="isRemoveDialogOpen()"
          [title]="isArabic() ? 'حذف المنتج من السلة' : 'Remove item from cart'"
          [message]="
            isArabic()
              ? 'هل أنت متأكد من رغبتك في حذف هذا المنتج من سلة التسوق؟'
              : 'Are you sure you want to remove this item from your shopping cart?'
          "
          [confirmLabel]="isArabic() ? 'نعم، حذف' : 'Yes, Remove'"
          [cancelLabel]="isArabic() ? 'إلغاء' : 'Cancel'"
          tone="destructive"
          [loading]="cartStore.isMutating()"
          (confirmed)="onExecuteRemove()"
          (cancelled)="isRemoveDialogOpen.set(false)"
        />

        <!-- CLEAR CART CONFIRMATION DIALOG -->
        <app-confirm-dialog
          [isOpen]="isClearDialogOpen()"
          [title]="isArabic() ? 'إفراغ سلة التسوق' : 'Clear shopping cart'"
          [message]="
            isArabic()
              ? 'هل أنت متأكد من رغبتك في إفراغ جميع المنتجات الموجودة في السلة؟'
              : 'Are you sure you want to remove all items from your cart?'
          "
          [confirmLabel]="isArabic() ? 'نعم، إفراغ السلة' : 'Yes, Clear All'"
          [cancelLabel]="isArabic() ? 'إلغاء' : 'Cancel'"
          tone="destructive"
          [loading]="cartStore.isMutating()"
          (confirmed)="onExecuteClear()"
          (cancelled)="isClearDialogOpen.set(false)"
        />

        <!-- MERGE CONFLICT MODAL -->
        <app-modal
          [isOpen]="cartStore.showConflictModal()"
          [title]="isArabic() ? 'تحديثات في سلة المشتريات' : 'Cart Updates'"
          size="md"
          [hasFooter]="true"
          (modalClosed)="onDismissConflictModal()"
        >
          <div class="az-cart-conflict">
            <p class="az-cart-conflict__desc">
              {{
                isArabic()
                  ? 'تم دمج سلة التسوق الخاصة بك بنجاح بعد تسجيل الدخول. حدثت بعض التعديلات التلقائية على الكميات المتوفرة:'
                  : 'Your cart was merged after signing in. Some automatic adjustments were made based on availability:'
              }}
            </p>

            <ul class="az-cart-conflict__list">
              @for (conflict of cartStore.conflicts(); track conflict.productId) {
                <li class="az-cart-conflict__item">
                  <div class="az-cart-conflict__item-info">
                    <strong class="az-cart-conflict__item-title">
                      {{ conflict.productId }}
                    </strong>
                    <span class="az-cart-conflict__item-reason">
                      {{ conflict.message || getConflictReasonText(conflict.reason) }}
                    </span>
                  </div>
                </li>
              }
            </ul>
          </div>

          <div modal-footer class="az-cart-conflict__footer">
            <app-button
              variant="primary"
              size="md"
              (clicked)="onDismissConflictModal()"
            >
              {{ isArabic() ? 'فهمت ومتابعة' : 'Understood & Continue' }}
            </app-button>
          </div>
        </app-modal>
      </div>
    </div>
  `,
  styleUrl: './cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent implements OnInit {
  readonly cartStore = inject(CartStore);
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly isArabic = this.localeService.isArabic;
  readonly direction = this.localeService.direction;

  readonly isRemoveDialogOpen = signal(false);
  readonly isClearDialogOpen = signal(false);
  readonly pendingRemoveItem = signal<CartItem | null>(null);

  ngOnInit(): void {
    if (!this.cartStore.cart()) {
      this.cartStore.loadCart().subscribe({
        error: () => {
          /* handled in template state */
        },
      });
    }
  }

  getProductName(item: CartItem): string {
    return this.isArabic()
      ? item.productName.ar
      : (item.productName.en || item.productName.ar);
  }

  getConflictReasonText(reason: string): string {
    if (this.isArabic()) {
      switch (reason) {
        case 'INSUFFICIENT_STOCK':
          return 'تم تخفيض الكمية للحد الأقصى المتاح بالمخزون.';
        case 'OUT_OF_STOCK':
          return 'المنتج نفد من المخزون حالياً.';
        case 'PRICE_CHANGED':
          return 'تم تحديث سعر المنتج إلى السعر الفعلي الحالي.';
        default:
          return 'تم تحديث بيانات المنتج وفقاً للمخزون.';
      }
    } else {
      switch (reason) {
        case 'INSUFFICIENT_STOCK':
          return 'Quantity adjusted to maximum available stock.';
        case 'OUT_OF_STOCK':
          return 'Item is currently out of stock.';
        case 'PRICE_CHANGED':
          return 'Price updated to current catalog price.';
        default:
          return 'Item updated per current inventory.';
      }
    }
  }

  onUpdateQuantity(itemId: string, newQuantity: number): void {
    this.cartStore.updateQuantity(itemId, newQuantity).subscribe({
      error: () => {
        const msg = this.isArabic()
          ? 'تعذر تحديث الكمية. يرجى المحاولة مرة أخرى.'
          : 'Failed to update quantity. Please try again.';
        this.toast.error(msg);
      },
    });
  }

  onConfirmRemove(item: CartItem): void {
    this.pendingRemoveItem.set(item);
    this.isRemoveDialogOpen.set(true);
  }

  onExecuteRemove(): void {
    const item = this.pendingRemoveItem();
    if (!item) {
      this.isRemoveDialogOpen.set(false);
      return;
    }

    this.cartStore.removeItem(item.id).subscribe({
      next: () => {
        this.isRemoveDialogOpen.set(false);
        this.pendingRemoveItem.set(null);
        const msg = this.isArabic()
          ? 'تم حذف المنتج من السلة.'
          : 'Item removed from cart.';
        this.toast.success(msg);
      },
      error: () => {
        this.isRemoveDialogOpen.set(false);
        const msg = this.isArabic()
          ? 'تعذر حذف المنتج. يرجى المحاولة مرة أخرى.'
          : 'Failed to remove item. Please try again.';
        this.toast.error(msg);
      },
    });
  }

  onConfirmClear(): void {
    this.isClearDialogOpen.set(true);
  }

  onExecuteClear(): void {
    this.cartStore.clearCart().subscribe({
      next: () => {
        this.isClearDialogOpen.set(false);
        const msg = this.isArabic()
          ? 'تم إفراغ السلة بنجاح.'
          : 'Cart cleared successfully.';
        this.toast.success(msg);
      },
      error: () => {
        this.isClearDialogOpen.set(false);
        const msg = this.isArabic()
          ? 'تعذر إفراغ السلة. يرجى المحاولة مرة أخرى.'
          : 'Failed to clear cart. Please try again.';
        this.toast.error(msg);
      },
    });
  }

  onRefreshCart(): void {
    this.cartStore.loadCart().subscribe({
      next: () => {
        const msg = this.isArabic()
          ? 'تم تحديث محتويات السلة بنجاح.'
          : 'Cart updated successfully.';
        this.toast.success(msg);
      },
    });
  }

  onDismissError(): void {
    // Re-load cart to clear mutation error state
    this.cartStore.loadCart().subscribe();
  }

  onDismissConflictModal(): void {
    this.cartStore.dismissConflict();
  }

  onProceedToCheckout(): void {
    if (this.cartStore.isEmpty()) {
      return;
    }
    this.router.navigate(['/checkout']);
  }
}
