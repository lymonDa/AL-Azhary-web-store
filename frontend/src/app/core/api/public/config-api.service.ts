import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../base/api-client';
import type { AppConfigDto } from '../dto/config.dto';

@Injectable({
  providedIn: 'root',
})
export class ConfigApi {
  private readonly client = inject(ApiClient);

  /**
   * Fetches public platform configuration (contact details, payment methods, feature flags).
   */
  getPublicConfig(): Observable<AppConfigDto> {
    return this.client.getData<AppConfigDto>('/settings/public');
  }
}
