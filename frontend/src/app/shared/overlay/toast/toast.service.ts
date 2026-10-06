import {
  Injectable,
  signal,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ToastMessage, ToastTone } from './toast.model';

let nextToastId = 0;

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(
    message: string,
    tone: ToastTone = 'info',
    options?: { durationMs?: number; dismissible?: boolean }
  ): string {
    const id = `az-toast-${++nextToastId}`;
    const durationMs = options?.durationMs ?? 4000;
    const dismissible = options?.dismissible ?? true;

    const toast: ToastMessage = {
      id,
      tone,
      message,
      durationMs,
      dismissible,
    };

    this._toasts.update((current) => [...current, toast].slice(-5));

    if (this.isBrowser && durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }

    return id;
  }

  success(message: string, durationMs = 4000): string {
    return this.show(message, 'success', { durationMs });
  }

  warning(message: string, durationMs = 5000): string {
    return this.show(message, 'warning', { durationMs });
  }

  error(message: string, durationMs = 6000): string {
    return this.show(message, 'error', { durationMs });
  }

  info(message: string, durationMs = 4000): string {
    return this.show(message, 'info', { durationMs });
  }

  dismiss(id: string): void {
    this._toasts.update((current) => current.filter((t) => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}
