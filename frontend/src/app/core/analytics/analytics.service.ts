import { Injectable, inject } from '@angular/core';
import { AppConfigService } from '../config/app-config.service';

export interface AnalyticsEvent {
  readonly name: string;
  readonly properties?: Record<string, unknown>;
}

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  private readonly config = inject(AppConfigService);

  trackEvent(event: AnalyticsEvent): void {
    if (!this.config.isFeatureEnabled('enableAnalytics')) {
      // No-op by default
      return;
    }
    // Facade implementation for future analytics integrations
    console.debug('[Analytics]', event.name, event.properties);
  }
}
