import {
  normalizeArabic,
  normalizeText,
  escapeRegex,
  buildSearchText,
} from '../../src/modules/products/utils/search-normalizer';

describe('Search Normalizer Unit Tests', () => {
  describe('normalizeArabic', () => {
    it('normalizes alef variants (أ, إ, آ -> ا)', () => {
      expect(normalizeArabic('أحمد إبراهيم آلاء')).toBe('احمد ابراهيم الاء');
    });

    it('normalizes teh marbuta (ة -> ه)', () => {
      expect(normalizeArabic('مكتبة الأزهر الشريفة')).toBe('مكتبه الازهر الشريفه');
    });

    it('normalizes alef maksura (ى -> ي)', () => {
      expect(normalizeArabic('على الهدى')).toBe('علي الهدي');
    });

    it('removes arabic tashkeel (diacritics)', () => {
      expect(normalizeArabic('صَحِيحُ البُخَارِيِّ')).toBe('صحيح البخاري');
    });

    it('removes tatweel (kashida)', () => {
      expect(normalizeArabic('الـــــفـــــقـــــه')).toBe('الفقه');
    });
  });

  describe('normalizeText', () => {
    it('normalizes mixed Arabic and Latin text, trims and collapses whitespaces', () => {
      expect(normalizeText('  صَحِيحُ   Al-Bukhari   Book   ')).toBe('صحيح al-bukhari book');
    });
  });

  describe('escapeRegex', () => {
    it('escapes all special regex characters safely to block ReDoS and operator injection', () => {
      const dangerousInput = '.*+?^${}()|[]\\';
      const escaped = escapeRegex(dangerousInput);
      const re = new RegExp(escaped);
      expect(re.test(dangerousInput)).toBe(true);
      expect(re.test('anything else')).toBe(false);
    });
  });

  describe('buildSearchText', () => {
    it('combines name, metadata, and description into normalized search text', () => {
      const searchText = buildSearchText(
        { ar: 'صَحِيحُ البُخَارِيِّ', en: 'Sahih Al-Bukhari' },
        {
          author: 'الإمام البخاري',
          publisher: 'دار ابن كثير',
          subject: 'حديث',
          isbn: '978-0-123456-47-2',
        },
        { ar: 'أصح كتاب بعد كتاب الله' },
      );

      expect(searchText).toContain('صحيح');
      expect(searchText).toContain('بخاري');
      expect(searchText).toContain('al-bukhari');
      expect(searchText).toContain('امام');
      expect(searchText).toContain('كثير');
      expect(searchText).toContain('حديث');
    });

    it('handles missing/null metadata and description safely', () => {
      const searchText = buildSearchText(
        { ar: 'كتاب الفقه' },
        undefined,
        null,
      );

      expect(searchText).toBe('كتاب الفقه');
    });
  });
});
