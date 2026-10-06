import type { LocalizedTextDto } from './common.dto';

export interface AppConfigDto {
  readonly contact?: {
    readonly phone?: string;
    readonly whatsappNumber?: string;
    readonly email?: string;
    readonly address?: LocalizedTextDto;
  };
  readonly paymentMethods?: readonly string[];
  readonly businessHours?: LocalizedTextDto;
  readonly serviceabilityCopy?: LocalizedTextDto;
  readonly featureFlags?: Record<string, boolean>;
}
