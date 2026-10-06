import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocaleService, type AppLocale } from '../../core/i18n/locale.service';

export type AppDateFormatPreset =
  | 'short'
  | 'medium'
  | 'long'
  | 'full'
  | 'date'
  | 'time'
  | 'datetime';

export interface AppDatePipeOptions {
  readonly format?: AppDateFormatPreset | Intl.DateTimeFormatOptions;
  readonly locale?: AppLocale;
}

const CAIRO_TIMEZONE = 'Africa/Cairo';

const PRESET_OPTIONS: Record<AppDateFormatPreset, Intl.DateTimeFormatOptions> = {
  short: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
  medium: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
  long: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  },
  full: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  },
  date: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  time: {
    hour: 'numeric',
    minute: '2-digit',
  },
  datetime: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  },
};

/**
 * AppDatePipe formats UTC ISO dates and timestamps into Cairo-localized date/time presentations.
 * Always renders in the Africa/Cairo timezone.
 *
 * Example:
 *   "2026-10-06T10:00:00.000Z" | appDate:'date'
 *   order.createdAt | appDate:'datetime'
 */
@Pipe({
  name: 'appDate',
  standalone: true,
  pure: true,
})
export class DatePipe implements PipeTransform {
  private readonly localeService = inject(LocaleService);

  transform(
    value: string | number | Date | null | undefined,
    formatOrOptions?: AppDateFormatPreset | AppDatePipeOptions | Intl.DateTimeFormatOptions,
    localeOverride?: AppLocale,
  ): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const date = this.parseDate(value);
    if (!date || isNaN(date.getTime())) {
      return '';
    }

    let presetOrOptions: AppDateFormatPreset | Intl.DateTimeFormatOptions = 'medium';
    let optionsLocale: AppLocale | undefined = localeOverride;

    if (typeof formatOrOptions === 'string') {
      presetOrOptions = formatOrOptions;
    } else if (typeof formatOrOptions === 'object' && formatOrOptions !== null) {
      if ('format' in formatOrOptions || 'locale' in formatOrOptions) {
        const custom = formatOrOptions as AppDatePipeOptions;
        presetOrOptions = custom.format ?? 'medium';
        optionsLocale = custom.locale ?? localeOverride;
      } else {
        presetOrOptions = formatOrOptions as Intl.DateTimeFormatOptions;
      }
    }

    const activeLocale: AppLocale = optionsLocale ?? this.localeService.currentLocale();
    const intlLocale = activeLocale === 'ar' ? 'ar-EG' : 'en-EG';

    const intlOptions: Intl.DateTimeFormatOptions = {
      ...(typeof presetOrOptions === 'string'
        ? PRESET_OPTIONS[presetOrOptions] ?? PRESET_OPTIONS.medium
        : presetOrOptions),
      timeZone: CAIRO_TIMEZONE,
    };

    try {
      return new Intl.DateTimeFormat(intlLocale, intlOptions).format(date);
    } catch {
      return '';
    }
  }

  private parseDate(value: string | number | Date): Date | null {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'number') {
      return new Date(value);
    }
    if (typeof value === 'string') {
      return new Date(value);
    }
    return null;
  }
}
