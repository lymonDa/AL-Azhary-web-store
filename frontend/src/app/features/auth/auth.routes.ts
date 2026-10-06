import { Routes } from '@angular/router';
import { guestOnlyGuard } from '../../core/auth/guards/guest-only.guard';
import { AuthShellComponent } from '../../layout/auth-shell/auth-shell.component';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    component: AuthShellComponent,
    children: [
      {
        path: 'login',
        canActivate: [guestOnlyGuard],
        loadComponent: () =>
          import('./login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        canActivate: [guestOnlyGuard],
        loadComponent: () =>
          import('./register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'forgot-password',
        canActivate: [guestOnlyGuard],
        loadComponent: () =>
          import('./forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'reset-password',
        canActivate: [guestOnlyGuard],
        loadComponent: () =>
          import('./reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./verify-email/verify-email.component').then(
            (m) => m.VerifyEmailComponent,
          ),
      },
    ],
  },
];
