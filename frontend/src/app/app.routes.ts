import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'stylebook',
    loadComponent: () =>
      import('./shared/stylebook/stylebook.component').then(
        (m) => m.StylebookComponent,
      ),
  },
  {
    path: '403',
    loadComponent: () =>
      import('./features/error/forbidden/forbidden.component').then(
        (m) => m.ForbiddenComponent,
      ),
  },
  {
    path: '404',
    loadComponent: () =>
      import('./features/error/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
  // Storefront & Catalog routes (Home, Shop, Category, Product Detail, Search, Contact)
  {
    path: '',
    loadChildren: () =>
      import('./features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES),
  },
  // Auth routes (login, register, forgot-password, reset-password, verify-email)
  {
    path: '',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  // Wildcard 404 fallback
  {
    path: '**',
    loadComponent: () =>
      import('./features/error/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
