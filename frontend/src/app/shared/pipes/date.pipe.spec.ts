import { TestBed } from '@angular/core/testing';
import { DatePipe } from './date.pipe';
import { LocaleService } from '../../core/i18n/locale.service';

describe('DatePipe', () => {
  let pipe: DatePipe;
  let localeService: LocaleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DatePipe, LocaleService],
    });

    pipe = TestBed.inject(DatePipe);
    localeService = TestBed.inject(LocaleService);
  });

  it('uses active locale from LocaleService when not overridden', () => {
    localeService.setLocale('ar');
    const result = pipe.transform('2026-05-15T10:00:00.000Z', 'date');
    expect(result).toBeTruthy();
  });

  it('formats UTC ISO date string into Cairo localized presentation', () => {
    // 12:00 UTC
    const utcString = '2026-10-06T12:00:00.000Z';
    const formattedEn = pipe.transform(utcString, 'time', 'en');

    // Cairo is either UTC+2 or UTC+3 (Egypt DST), so 12:00 UTC should be 2:00 PM or 3:00 PM
    expect(formattedEn).toMatch(/(2|3|14|15):00/);
  });

  it('formats in Arabic and English locales correctly', () => {
    const utcString = '2026-05-15T10:00:00.000Z';

    const formattedAr = pipe.transform(utcString, 'date', 'ar');
    const formattedEn = pipe.transform(utcString, 'date', 'en');

    expect(formattedAr).toBeTruthy();
    expect(formattedEn).toContain('2026');
    expect(formattedEn).toContain('May');
  });

  it('handles Date objects and numeric timestamps', () => {
    const dateObj = new Date('2026-01-01T08:00:00.000Z');
    const timestamp = dateObj.getTime();

    const fromDate = pipe.transform(dateObj, 'date', 'en');
    const fromTimestamp = pipe.transform(timestamp, 'date', 'en');

    expect(fromDate).toBe(fromTimestamp);
    expect(fromDate).toContain('2026');
  });

  it('handles null, undefined, empty string, and invalid dates gracefully', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform('invalid-date-string')).toBe('');
  });
});
