/**
 * Money representation strictly in integer minor units (piastres / milliemes).
 * 1 EGP = 100 minor units.
 * Never perform floating-point math on monetary values.
 */
export interface Money {
  readonly amount: number; // Integer minor units (e.g. 15000 = 150.00 EGP)
  readonly currency: 'EGP';
}

export function createMoney(amountMinorUnits: number, currency: 'EGP' = 'EGP'): Money {
  if (!Number.isInteger(amountMinorUnits)) {
    throw new TypeError(
      `Money amount must be an integer minor unit. Received: ${amountMinorUnits}`,
    );
  }
  return {
    amount: amountMinorUnits,
    currency,
  };
}

export function minorToMajor(amountMinorUnits: number): number {
  return amountMinorUnits / 100;
}

export function majorToMinor(amountMajorUnits: number): number {
  return Math.round(amountMajorUnits * 100);
}

export function formatMoneyAmount(money: Money, locale: 'ar' | 'en' = 'ar'): string {
  const major = minorToMajor(money.amount);
  const formattedNumber = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(major);

  const currencySymbol = locale === 'ar' ? 'ج.م' : 'EGP';
  return locale === 'ar'
    ? `${formattedNumber} ${currencySymbol}`
    : `${currencySymbol} ${formattedNumber}`;
}
