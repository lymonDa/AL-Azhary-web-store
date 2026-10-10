import { Routes } from '@angular/router';
import { StorefrontShellComponent } from '../../layout/storefront-shell/storefront-shell.component';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const CATALOG_ROUTES: Routes = [
  {
    path: '',
    component: StorefrontShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'shop',
        loadComponent: () =>
          import('./shop/shop.component').then((m) => m.ShopComponent),
      },
      {
        path: 'category/:slug',
        loadComponent: () =>
          import('./category/category.component').then((m) => m.CategoryComponent),
      },
      {
        path: 'products/:slug',
        loadComponent: () =>
          import('./product-detail/product-detail.component').then(
            (m) => m.ProductDetailComponent,
          ),
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./search/search.component').then((m) => m.SearchComponent),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('../contact/contact.component').then((m) => m.ContactComponent),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('../cart/cart.component').then((m) => m.CartComponent),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('../checkout/checkout.component').then((m) => m.CheckoutComponent),
      },
      // Phase 6 Order Detail, Tracking & Return
      {
        path: 'orders/:reference',
        loadComponent: () =>
          import('../customer/order-detail/order-detail.component').then(
            (m) => m.OrderDetailComponent,
          ),
      },
      {
        path: 'orders/:reference/tracking',
        loadComponent: () =>
          import('../customer/order-detail/order-detail.component').then(
            (m) => m.OrderDetailComponent,
          ),
      },
      {
        path: 'orders/:reference/return',
        loadComponent: () =>
          import('../customer/returns/order-return.component').then(
            (m) => m.OrderReturnComponent,
          ),
      },
      // Phase 6 Customer Account Dashboard (Protected by authGuard)
      {
        path: 'account',
        canActivate: [authGuard],
        loadChildren: () =>
          import('../customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
      },
    ],
  },
];
