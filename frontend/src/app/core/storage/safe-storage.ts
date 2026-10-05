import { Injectable, inject } from '@angular/core';
import { PlatformService } from './platform.service';

/**
 * SafeStorage provides an SSR-safe and sandbox-safe key-value store.
 * If running on the server or if browser storage throws (e.g. cookies disabled,
 * private browsing quota exceeded), it transparently falls back to an in-memory Map.
 */
@Injectable({
  providedIn: 'root',
})
export class SafeStorage {
  private readonly platform = inject(PlatformService);
  private readonly memoryFallback = new Map<string, string>();

  getItem(key: string): string | null {
    const storage = this.platform.localStorage;
    if (storage) {
      try {
        return storage.getItem(key);
      } catch {
        // Fall back to in-memory store
      }
    }
    return this.memoryFallback.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    const storage = this.platform.localStorage;
    if (storage) {
      try {
        storage.setItem(key, value);
        return;
      } catch {
        // Fall back to in-memory store
      }
    }
    this.memoryFallback.set(key, value);
  }

  removeItem(key: string): void {
    const storage = this.platform.localStorage;
    if (storage) {
      try {
        storage.removeItem(key);
        return;
      } catch {
        // Fall back to in-memory store
      }
    }
    this.memoryFallback.delete(key);
  }

  clear(): void {
    const storage = this.platform.localStorage;
    if (storage) {
      try {
        storage.clear();
      } catch {
        // Fall back to in-memory store
      }
    }
    this.memoryFallback.clear();
  }
}
