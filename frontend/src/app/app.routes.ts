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
    path: '',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
];
