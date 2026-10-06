import { TestBed } from '@angular/core/testing';
import { MoneyPipe } from './money.pipe';
import { LocaleService } from '../../core/i18n/locale.service';
import { createMoney } from '../../domain/models/money.model';

describe('MoneyPipe', () => {
  let pipe: MoneyPipe;
  let localeService: LocaleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MoneyPipe, LocaleService],
    });

    pipe = TestBed.inject(MoneyPipe);
    localeService = TestBed.inject(LocaleService);
  });

  it('formats integer minor units in Arabic locale with ج.م symbol', () => {
    localeService.setLocale('ar');
    // 15050 minor units = 150.50 major units
    const result = pipe.transform(15050);

    expect(result).toContain('ج.م');
    // Arabic formatted digits or standard decimal
    expect(result.length).toBeGreaterThan(3);
  });

  it('formats integer minor units in English locale with EGP symbol', () => {
    localeService.setLocale('en');
    const result = pipe.transform(15050);

    expect(result).toContain('EGP');
    expect(result).toContain('150.50');
  });

  it('formats Money model object correctly', () => {
    const money = createMoney(25000, 'EGP');
    const result = pipe.transform(money, 'en');

    expect(result).toBe('EGP 250.00');
  });

  it('formats zero minor units correctly', () => {
    const result = pipe.transform(0, 'en');
    expect(result).toBe('EGP 0.00');
  });

  it('omits currency symbol when showCurrency is false', () => {
    const result = pipe.transform(12300, { locale: 'en', showCurrency: false });
    expect(result).toBe('123.00');
  });

  it('throws TypeError if floating-point numbers are supplied as minor units', () => {
    expect(() => pipe.transform(150.5)).toThrowError(TypeError);
  });

  it('returns empty string for null or undefined values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });
});
