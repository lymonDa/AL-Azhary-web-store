import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer, DOCUMENT } from '@angular/common';

/**
 * PlatformService provides an SSR-safe boundary for platform detection and
 * DOM / browser APIs. Code outside this service must never access `window`,
 * `document`, `localStorage`, or `navigator` directly.
 */
@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly documentRef = inject(DOCUMENT);

  readonly isBrowser: boolean = isPlatformBrowser(this.platformId);
  readonly isServer: boolean = isPlatformServer(this.platformId);

  get window(): Window | null {
    if (this.isBrowser) {
      return window;
    }
    return null;
  }

  get document(): Document {
    return this.documentRef;
  }

  get navigator(): Navigator | null {
    if (this.isBrowser) {
      return navigator;
    }
    return null;
  }

  get localStorage(): Storage | null {
    if (this.isBrowser) {
      try {
        return window.localStorage;
      } catch {
        return null;
      }
    }
    return null;
  }

  get sessionStorage(): Storage | null {
    if (this.isBrowser) {
      try {
        return window.sessionStorage;
      } catch {
        return null;
      }
    }
    return null;
  }
}
