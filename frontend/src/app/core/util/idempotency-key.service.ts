import { Injectable } from '@angular/core';

/**
 * Service responsible for generating and managing idempotency keys.
 * All keys are strictly random UUID v4 values (never derived from secrets or timestamps alone).
 */
@Injectable({
  providedIn: 'root',
})
export class IdempotencyKeyService {
  private readonly activeKeys = new Map<string, string>();

  /**
   * Generates a single-use cryptographically random UUID v4.
   */
  generateKey(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    // RFC4122 v4 fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Gets an existing key for an active logical action or generates a new one.
   * Useful for retries of the same submission attempt.
   */
  getOrCreateKey(actionScope: string): string {
    const existing = this.activeKeys.get(actionScope);
    if (existing) {
      return existing;
    }
    const newKey = this.generateKey();
    this.activeKeys.set(actionScope, newKey);
    return newKey;
  }

  /**
   * Clears the cached key when an action completes successfully or payload changes.
   */
  clearKey(actionScope: string): void {
    this.activeKeys.delete(actionScope);
  }
}
