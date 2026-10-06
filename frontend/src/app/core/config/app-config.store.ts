import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ConfigApi } from '../api/public/config-api.service';
import { AppConfigService } from './app-config.service';
import type { PublicAppConfig } from './app-config.model';
import type { AppConfigDto } from '../api/dto/config.dto';
import { mapLocalizedDtoToLocalized } from '../api/mappers/common.mapper';

export type ConfigStoreStatus = 'idle' | 'loading' | 'success' | 'error';

interface ConfigStoreState {
  readonly config: PublicAppConfig;
  readonly status: ConfigStoreStatus;
  readonly error: string | null;
}

const DEFAULT_CONFIG: PublicAppConfig = {
  contact: {
    phone: '+201000000000',
    whatsappNumber: '+201000000000',
    email: 'info@al-azhari.com',
    address: {
      ar: 'قنا، جمهورية مصر العربية',
      en: 'Qena, Arab Republic of Egypt',
    },
  },
  paymentMethods: ['COD', 'INSTAPAY', 'VODAFONE_CASH'],
  businessHours: {
    ar: 'السبت - الخميس: ٩:٠٠ ص - ١٠:٠٠ م',
    en: 'Sat - Thu: 9:00 AM - 10:00 PM',
  },
  serviceabilityCopy: {
    ar: 'التوصيل متاح لجميع محافظات جمهورية مصر العربية',
    en: 'Delivery available across all governorates of Egypt',
  },
  featureFlags: {
    enableSsr: false,
    enableAnalytics: false,
    enableMockupDevTools: true,
  },
};

@Injectable({
  providedIn: 'root',
})
export class AppConfigStore {
  private readonly configApi = inject(ConfigApi);
  private readonly appConfigService = inject(AppConfigService);

  private readonly stateSignal = signal<ConfigStoreState>({
    config: this.buildInitialConfig(),
    status: 'idle',
    error: null,
  });

  readonly state = this.stateSignal.asReadonly();
  readonly config = computed(() => this.stateSignal().config);
  readonly status = computed(() => this.stateSignal().status);
  readonly error = computed(() => this.stateSignal().error);
  readonly contact = computed(() => this.stateSignal().config.contact);
  readonly whatsappNumber = computed(() => this.stateSignal().config.contact.whatsappNumber);
  readonly paymentMethods = computed(() => this.stateSignal().config.paymentMethods);
  readonly featureFlags = computed(() => this.stateSignal().config.featureFlags);
  readonly isLoaded = computed(() => this.stateSignal().status === 'success');
  readonly isLoading = computed(() => this.stateSignal().status === 'loading');

  loadConfig(): Observable<PublicAppConfig> {
    this.stateSignal.update((s) => ({ ...s, status: 'loading', error: null }));

    return this.configApi.getPublicConfig().pipe(
      map((dto: AppConfigDto) => this.mergeDtoWithCurrent(dto)),
      tap((merged: PublicAppConfig) => {
        this.stateSignal.set({
          config: merged,
          status: 'success',
          error: null,
        });
      }),
      catchError((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load public config';
        this.stateSignal.update((s) => ({
          ...s,
          status: 'error',
          error: message,
        }));
        // Fall back gracefully to current config so app continues to function
        return of(this.stateSignal().config);
      }),
    );
  }

  updateConfig(partial: Partial<PublicAppConfig>): void {
    this.stateSignal.update((s) => ({
      ...s,
      config: {
        ...s.config,
        ...partial,
        contact: {
          ...s.config.contact,
          ...(partial.contact ?? {}),
        },
        featureFlags: {
          ...s.config.featureFlags,
          ...(partial.featureFlags ?? {}),
        },
      },
    }));
  }

  private buildInitialConfig(): PublicAppConfig {
    return {
      ...DEFAULT_CONFIG,
      featureFlags: {
        enableSsr: this.appConfigService.isFeatureEnabled('enableSsr'),
        enableAnalytics: this.appConfigService.isFeatureEnabled('enableAnalytics'),
        enableMockupDevTools: this.appConfigService.isFeatureEnabled('enableMockupDevTools'),
      },
    };
  }

  private mergeDtoWithCurrent(dto: AppConfigDto): PublicAppConfig {
    const current = this.stateSignal().config;

    return {
      contact: {
        phone: dto.contact?.phone ?? current.contact.phone,
        whatsappNumber: dto.contact?.whatsappNumber ?? current.contact.whatsappNumber,
        email: dto.contact?.email ?? current.contact.email,
        address: dto.contact?.address
          ? mapLocalizedDtoToLocalized(dto.contact.address)
          : current.contact.address,
      },
      paymentMethods:
        dto.paymentMethods && dto.paymentMethods.length > 0
          ? dto.paymentMethods
          : current.paymentMethods,
      businessHours: dto.businessHours
        ? mapLocalizedDtoToLocalized(dto.businessHours)
        : current.businessHours,
      serviceabilityCopy: dto.serviceabilityCopy
        ? mapLocalizedDtoToLocalized(dto.serviceabilityCopy)
        : current.serviceabilityCopy,
      featureFlags: {
        ...current.featureFlags,
        ...(dto.featureFlags ?? {}),
      },
    };
  }
}
