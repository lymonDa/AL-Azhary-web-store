import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, switchMap, tap, throwError } from 'rxjs';
import { AuthApi } from '../api/account/auth-api.service';
import { AuthTokenHolder } from './token-holder.service';
import { PlatformService } from '../storage/platform.service';
import { ApiError } from '../errors/api-error';
import { ApiErrorCodes } from '../errors/error-codes';
import type {
  AuthStatus,
  AuthUser,
} from '../../domain/models/auth.model';
import type {
  ForgotPasswordResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  VerifyEmailResponseDto,
} from '../api/dto/auth.dto';
import { mapAuthUserDtoToDomain } from '../api/mappers/auth.mapper';

interface AuthStoreState {
  readonly status: AuthStatus;
  readonly user: AuthUser | null;
  readonly error: string | null;
  readonly isPending: boolean;
  readonly restoreFailed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthStore {
  private readonly authApi = inject(AuthApi);
  private readonly tokenHolder = inject(AuthTokenHolder);
  private readonly platform = inject(PlatformService);
  private readonly router = inject(Router);

  private readonly stateSignal = signal<AuthStoreState>({
    status: 'unknown',
    user: null,
    error: null,
    isPending: false,
    restoreFailed: false,
  });

  readonly state = this.stateSignal.asReadonly();
  readonly status = computed(() => this.stateSignal().status);
  readonly user = computed(() => this.stateSignal().user);
  readonly error = computed(() => this.stateSignal().error);
  readonly isPending = computed(() => this.stateSignal().isPending);
  readonly restoreFailed = computed(() => this.stateSignal().restoreFailed);

  readonly isAuthenticated = computed(() => this.status() === 'authenticated');
  readonly isAnonymous = computed(() => this.status() === 'anonymous');
  readonly isEmailUnverified = computed(() => {
    const u = this.user();
    return Boolean(u && !u.isEmailVerified);
  });
  readonly role = computed(() => this.user()?.role ?? null);

  constructor() {
    // Register reactive refresh callback for the HTTP auth interceptor pipeline
    this.tokenHolder.registerRefreshHandler(() => {
      return this.authApi.refresh().pipe(
        map((res) => {
          this.tokenHolder.setAccessToken(res.accessToken);
          return res.accessToken;
        }),
        catchError((err: unknown) => {
          this.tokenHolder.clearToken();
          this.stateSignal.update((s) => ({
            ...s,
            status: 'expired',
            user: null,
          }));
          return throwError(() => err);
        }),
      );
    });
  }

  /**
   * Initializes session restoration on app boot.
   * Checks for valid HttpOnly refresh cookie via POST /auth/refresh.
   * If on SSR, silently sets anonymous.
   */
  restore(): Observable<AuthUser | null> {
    if (this.platform.isServer) {
      this.stateSignal.update((s) => ({ ...s, status: 'anonymous' }));
      return of(null);
    }

    this.stateSignal.update((s) => ({ ...s, status: 'refreshing', error: null }));

    return this.authApi.refresh().pipe(
      switchMap((refreshRes) => {
        this.tokenHolder.setAccessToken(refreshRes.accessToken);
        return this.authApi.getMe();
      }),
      map((userDto) => {
        const user = mapAuthUserDtoToDomain(userDto);
        this.stateSignal.update((s) => ({
          ...s,
          status: 'authenticated',
          user,
          restoreFailed: false,
        }));
        return user;
      }),
      catchError((err: unknown) => {
        const is401 = ApiError.isApiError(err) && err.httpStatus === 401;
        this.tokenHolder.clearToken();

        this.stateSignal.update((s) => ({
          ...s,
          status: 'anonymous',
          user: null,
          restoreFailed: !is401,
        }));

        return of(null);
      }),
    );
  }

  /**
   * Submits user credentials for authentication.
   */
  login(credentials: LoginRequestDto): Observable<AuthUser> {
    this.stateSignal.update((s) => ({ ...s, isPending: true, error: null }));

    return this.authApi.login(credentials).pipe(
      map((res) => {
        this.tokenHolder.setAccessToken(res.accessToken);
        const user = mapAuthUserDtoToDomain(res.user);
        this.stateSignal.set({
          status: 'authenticated',
          user,
          error: null,
          isPending: false,
          restoreFailed: false,
        });
        return user;
      }),
      catchError((err: unknown) => {
        const errorMessage = this.resolveAuthErrorMessage(err);
        this.stateSignal.update((s) => ({
          ...s,
          isPending: false,
          error: errorMessage,
        }));
        return throwError(() => err);
      }),
    );
  }

  /**
   * Registers a new customer account.
   */
  register(payload: RegisterRequestDto): Observable<AuthUser> {
    this.stateSignal.update((s) => ({ ...s, isPending: true, error: null }));

    return this.authApi.register(payload).pipe(
      map((userDto) => {
        const user = mapAuthUserDtoToDomain(userDto);
        this.stateSignal.update((s) => ({
          ...s,
          isPending: false,
          error: null,
        }));
        return user;
      }),
      catchError((err: unknown) => {
        const errorMessage = this.resolveAuthErrorMessage(err);
        this.stateSignal.update((s) => ({
          ...s,
          isPending: false,
          error: errorMessage,
        }));
        return throwError(() => err);
      }),
    );
  }

  /**
   * Logs out the current session and clears memory tokens and local state.
   */
  logout(all = false): Observable<void> {
    return this.authApi.logout(all).pipe(
      tap(() => this.finalizeLogout()),
      catchError(() => {
        this.finalizeLogout();
        return of(undefined);
      }),
    );
  }

  /**
   * Verifies an email address using an opaque verification token.
   */
  verifyEmail(token: string): Observable<VerifyEmailResponseDto> {
    this.stateSignal.update((s) => ({ ...s, isPending: true, error: null }));

    return this.authApi.verifyEmail(token).pipe(
      tap((res) => {
        this.stateSignal.update((s) => {
          if (s.user && s.user.id === res.user.id) {
            return {
              ...s,
              isPending: false,
              user: mapAuthUserDtoToDomain(res.user),
            };
          }
          return { ...s, isPending: false };
        });
      }),
      catchError((err: unknown) => {
        const errorMessage = this.resolveAuthErrorMessage(err);
        this.stateSignal.update((s) => ({ ...s, isPending: false, error: errorMessage }));
        return throwError(() => err);
      }),
    );
  }

  /**
   * Dispatches a password reset link to the given email address.
   */
  forgotPassword(email: string): Observable<ForgotPasswordResponseDto> {
    this.stateSignal.update((s) => ({ ...s, isPending: true, error: null }));

    return this.authApi.forgotPassword(email).pipe(
      tap(() => {
        this.stateSignal.update((s) => ({ ...s, isPending: false, error: null }));
      }),
      catchError((err: unknown) => {
        const errorMessage = this.resolveAuthErrorMessage(err);
        this.stateSignal.update((s) => ({ ...s, isPending: false, error: errorMessage }));
        return throwError(() => err);
      }),
    );
  }

  /**
   * Resets the account password using the reset token and new password.
   */
  resetPassword(token: string, newPassword: string): Observable<void> {
    this.stateSignal.update((s) => ({ ...s, isPending: true, error: null }));

    return this.authApi.resetPassword(token, newPassword).pipe(
      tap(() => {
        this.finalizeLogout();
      }),
      catchError((err: unknown) => {
        const errorMessage = this.resolveAuthErrorMessage(err);
        this.stateSignal.update((s) => ({ ...s, isPending: false, error: errorMessage }));
        return throwError(() => err);
      }),
    );
  }

  /**
   * Clears the active error message in the store.
   */
  clearError(): void {
    this.stateSignal.update((s) => ({ ...s, error: null }));
  }

  private finalizeLogout(): void {
    this.tokenHolder.clearToken();
    this.stateSignal.set({
      status: 'anonymous',
      user: null,
      error: null,
      isPending: false,
      restoreFailed: false,
    });
    this.router.navigate(['/login']);
  }

  private resolveAuthErrorMessage(err: unknown): string {
    if (ApiError.isApiError(err)) {
      if (err.code === ApiErrorCodes.AUTH_INVALID_CREDENTIALS) {
        return 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد أو الهاتف وكلمة المرور.';
      }
      if (err.code === ApiErrorCodes.RATE_LIMITED) {
        return 'تم إرسال طلبات كثيرة في وقت قصير. يرجى الانتظار والمحاولة لاحقاً.';
      }
      if (err.code === ApiErrorCodes.AUTH_TOKEN_INVALID || err.code === ApiErrorCodes.AUTH_TOKEN_EXPIRED) {
        return 'الرابط غير صالح أو انتهت صلاحيته.';
      }
      if (err.code === ApiErrorCodes.RESOURCE_CONFLICT) {
        return 'البريد الإلكتروني أو رقم الهاتف مسجل بالفعل.';
      }
      if (err.message && err.message.length > 0) {
        return err.message;
      }
    }
    return 'حدث خطأ غير متوقع أثناء معالجة الطلب.';
  }
}
