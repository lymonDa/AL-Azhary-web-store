import { Injectable, computed, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

export type TokenRefreshFn = () => Observable<string | null>;

/**
 * Minimal in-memory token holder boundary for Phase 2 HTTP authentication.
 * Stores access token strictly in memory (never localStorage or cookies).
 * Actual AuthStore and session lifecycle belong to Phase 3.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthTokenHolder {
  private readonly tokenSignal = signal<string | null>(null);
  private refreshFn?: TokenRefreshFn;

  readonly accessToken = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => Boolean(this.tokenSignal()));

  getAccessToken(): string | null {
    return this.tokenSignal();
  }

  setAccessToken(token: string | null): void {
    this.tokenSignal.set(token);
  }

  clearToken(): void {
    this.tokenSignal.set(null);
  }

  hasToken(): boolean {
    return Boolean(this.tokenSignal());
  }

  registerRefreshHandler(handler: TokenRefreshFn): void {
    this.refreshFn = handler;
  }

  refreshToken(): Observable<string | null> {
    if (this.refreshFn) {
      return this.refreshFn();
    }
    return of(null);
  }
}
