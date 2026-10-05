import { Injectable, computed, inject, signal } from '@angular/core';
import { PlatformService } from '../storage/platform.service';

export type TextDirection = 'rtl' | 'ltr';

@Injectable({
  providedIn: 'root',
})
export class DirectionService {
  private readonly platform = inject(PlatformService);
  private readonly directionSignal = signal<TextDirection>('rtl');

  readonly direction = this.directionSignal.asReadonly();
  readonly isRtl = computed(() => this.direction() === 'rtl');
  readonly isLtr = computed(() => this.direction() === 'ltr');

  setDirection(dir: TextDirection): void {
    this.directionSignal.set(dir);
    if (this.platform.isBrowser) {
      this.platform.document.documentElement.setAttribute('dir', dir);
    }
  }
}
