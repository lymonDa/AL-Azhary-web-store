import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import type { AppEnvironment } from '../../../environments/environment.model';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private readonly env: AppEnvironment = environment;

  get isProduction(): boolean {
    return this.env.production;
  }

  get apiBaseUrl(): string {
    return this.env.apiBaseUrl;
  }

  get socketUrl(): string {
    return this.env.socketUrl;
  }

  get cloudinaryCloudName(): string {
    return this.env.cloudinaryCloudName;
  }

  get defaultLocale(): 'ar' | 'en' {
    return this.env.defaultLocale;
  }

  get supportedLocales(): readonly ('ar' | 'en')[] {
    return this.env.supportedLocales;
  }

  isFeatureEnabled(featureName: keyof AppEnvironment['features']): boolean {
    return !!this.env.features[featureName];
  }
}
