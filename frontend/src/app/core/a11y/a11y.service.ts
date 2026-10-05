import { Injectable, inject } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Injectable({
  providedIn: 'root',
})
export class A11yService {
  private readonly liveAnnouncer = inject(LiveAnnouncer);

  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): Promise<void> {
    return this.liveAnnouncer.announce(message, politeness);
  }

  clear(): void {
    this.liveAnnouncer.clear();
  }
}
