import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'stylebook',
    loadComponent: () =>
      import('./shared/stylebook/stylebook.component').then(
        (m) => m.StylebookComponent
      ),
  },
];
