import { Routes } from '@angular/router';
import { StorefrontShellComponent } from '../../layout/storefront-shell/storefront-shell.component';

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
    ],
  },
];
