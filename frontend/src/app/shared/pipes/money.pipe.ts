import { Pipe, PipeTransform, inject } from '@angular/core';
import { LocaleService, type AppLocale } from '../../core/i18n/locale.service';
import {
  type Money,
  createMoney,
  minorToMajor,
} from '../../domain/models/money.model';

export interface MoneyPipeOptions {
  readonly locale?: AppLocale;
  readonly showCurrency?: boolean;
  readonly currencySymbol?: string;
}

/**
 * MoneyPipe formats integer minor units (piastres) into localized currency displays.
 * Financial calculations must NEVER be performed here or with floating-point arithmetic;
 * this pipe strictly performs presentation formatting.
 *
 * Example:
 *   15050 | money           -> "١٥٠٫٥٠ ج.م" (in ar) or "150.50 EGP" (in en)
 *   { amount: 15050, currency: 'EGP' } | money -> "١٥٠٫٥٠ ج.م"
 */
@Pipe({
  name: 'money',
  standalone: true,
  pure: true,
})
export class MoneyPipe implements PipeTransform {
  private readonly localeService = inject(LocaleService);

  transform(
    value: Money | number | null | undefined,
    optionsOrLocale?: AppLocale | MoneyPipeOptions,
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    let options: MoneyPipeOptions = {};
    if (typeof optionsOrLocale === 'string') {
      options = { locale: optionsOrLocale };
    } else if (typeof optionsOrLocale === 'object' && optionsOrLocale !== null) {
      options = optionsOrLocale;
    }

    const locale: AppLocale = options.locale ?? this.localeService.currentLocale();
    const showCurrency = options.showCurrency ?? true;

    let money: Money;
    if (typeof value === 'number') {
      if (!Number.isInteger(value)) {
        throw new TypeError(
          `MoneyPipe expects integer minor units. Received floating-point: ${value}`,
        );
      }
      money = createMoney(value);
    } else if (typeof value === 'object' && 'amount' in value) {
      money = value;
    } else {
      return '';
    }

    const majorUnits = minorToMajor(money.amount);
    const intlLocale = locale === 'ar' ? 'ar-EG' : 'en-EG';

    const formattedNumber = new Intl.NumberFormat(intlLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(majorUnits);

    if (!showCurrency) {
      return formattedNumber;
    }

    const defaultSymbol = locale === 'ar' ? 'ج.م' : 'EGP';
    const symbol = options.currencySymbol ?? defaultSymbol;

    return locale === 'ar'
      ? `${formattedNumber} ${symbol}`
      : `${symbol} ${formattedNumber}`;
  }
}
