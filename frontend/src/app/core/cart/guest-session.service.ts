import { Injectable, inject } from '@angular/core';
import { SafeStorage } from '../storage/safe-storage';

export const GUEST_SESSION_STORAGE_KEY = 'al_azhari_guest_session_id';
export const GUEST_SESSION_HEADER_NAME = 'x-guest-session-id';

@Injectable({
  providedIn: 'root',
})
export class GuestSessionService {
  private readonly storage = inject(SafeStorage);
  private memorySessionId: string | null = null;

  /**
   * Retrieves existing guest session ID if present in storage or memory.
   */
  getSessionId(): string | null {
    if (this.memorySessionId) {
      return this.memorySessionId;
    }
    const stored = this.storage.getItem(GUEST_SESSION_STORAGE_KEY);
    if (stored && this.isValidSessionId(stored)) {
      this.memorySessionId = stored;
      return stored;
    }
    return null;
  }

  /**
   * Retrieves existing guest session ID or generates a new unpredictable UUID.
   */
  getOrCreateSessionId(): string {
    const existing = this.getSessionId();
    if (existing) {
      return existing;
    }

    const newId = this.generateSessionId();
    this.setSessionId(newId);
    return newId;
  }

  /**
   * Persists guest session ID in memory and safe storage.
   */
  setSessionId(sessionId: string): void {
    if (!sessionId || !this.isValidSessionId(sessionId)) {
      return;
    }
    this.memorySessionId = sessionId;
    this.storage.setItem(GUEST_SESSION_STORAGE_KEY, sessionId);
  }

  /**
   * Clears guest session identifier (called after successful cart merge).
   */
  clearSessionId(): void {
    this.memorySessionId = null;
    this.storage.removeItem(GUEST_SESSION_STORAGE_KEY);
  }

  hasActiveSession(): boolean {
    return Boolean(this.getSessionId());
  }

  private isValidSessionId(id: string): boolean {
    return /^[a-zA-Z0-9_-]{16,128}$/.test(id.trim());
  }

  private generateSessionId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback RFC4122 v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
