import { createMoney, minorToMajor, majorToMinor, formatMoneyAmount } from './money.model';

describe('Money Model', () => {
  it('should enforce integer minor units', () => {
    const money = createMoney(15050);
    expect(money.amount).toBe(15050);
    expect(money.currency).toBe('EGP');

    expect(() => createMoney(150.5)).toThrowError(TypeError);
  });

  it('should convert correctly between minor and major units', () => {
    expect(minorToMajor(15050)).toBe(150.5);
    expect(majorToMinor(150.5)).toBe(15050);
  });

  it('should format money in Arabic and English locales with 2 decimals', () => {
    const money = createMoney(15050);
    const formattedAr = formatMoneyAmount(money, 'ar');
    const formattedEn = formatMoneyAmount(money, 'en');

    expect(formattedAr).toContain('ج.م');
    expect(formattedEn).toContain('EGP');
    expect(formattedEn).toContain('150.50');
  });
});
