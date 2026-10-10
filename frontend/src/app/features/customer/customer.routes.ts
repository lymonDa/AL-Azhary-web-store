import { Routes } from '@angular/router';
import { AccountShellComponent } from '../../layout/account/account-shell.component';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    component: AccountShellComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./overview/account-overview.component').then(
            (m) => m.AccountOverviewComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/account-orders.component').then(
            (m) => m.AccountOrdersComponent,
          ),
      },
      {
        path: 'addresses',
        loadComponent: () =>
          import('./addresses/addresses.component').then(
            (m) => m.AddressesComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./payments/payment-history.component').then(
            (m) => m.PaymentHistoryComponent,
          ),
      },
      {
        path: 'pre-orders',
        loadComponent: () =>
          import('./pre-orders/pre-orders.component').then(
            (m) => m.AccountPreOrdersComponent,
          ),
      },
      {
        path: 'returns',
        loadComponent: () =>
          import('./returns/returns.component').then(
            (m) => m.AccountReturnsComponent,
          ),
      },
    ],
  },
];
