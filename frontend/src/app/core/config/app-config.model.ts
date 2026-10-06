import type { LocalizedText } from '../../domain/models/localized-text.model';

export interface ContactInfo {
  readonly phone: string;
  readonly whatsappNumber: string;
  readonly email: string;
  readonly address?: LocalizedText | undefined;
}

export interface PublicAppConfig {
  readonly contact: ContactInfo;
  readonly paymentMethods: readonly string[];
  readonly businessHours?: LocalizedText | undefined;
  readonly serviceabilityCopy?: LocalizedText | undefined;
  readonly featureFlags: Readonly<Record<string, boolean>>;
}
