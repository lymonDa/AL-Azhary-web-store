import {
  mapCursorPageDto,
  mapLocalizedDtoToLocalized,
  mapMoneyDtoToMoney,
  mapPaginationDtoToMeta,
} from './common.mapper';
import type { CursorPageDto } from '../dto/common.dto';

describe('Common Mappers', () => {
  describe('mapMoneyDtoToMoney', () => {
    it('maps amountMinor and defaults currency to EGP', () => {
      const money = mapMoneyDtoToMoney({ amountMinor: 4500 });
      expect(money.amount).toBe(4500);
      expect(money.currency).toBe('EGP');
    });

    it('falls back to amount field if amountMinor is not present', () => {
      const money = mapMoneyDtoToMoney({ amount: 1200 });
      expect(money.amount).toBe(1200);
    });

    it('handles null/undefined gracefully with 0', () => {
      const money = mapMoneyDtoToMoney(null);
      expect(money.amount).toBe(0);
    });
  });

  describe('mapLocalizedDtoToLocalized', () => {
    it('maps ar and optional en strings', () => {
      const localized = mapLocalizedDtoToLocalized({
        ar: 'كتاب الفقه',
        en: 'Book of Fiqh',
      });
      expect(localized.ar).toBe('كتاب الفقه');
      expect(localized.en).toBe('Book of Fiqh');
    });

    it('handles null/undefined gracefully', () => {
      const localized = mapLocalizedDtoToLocalized(null);
      expect(localized.ar).toBe('');
      expect(localized.en).toBeUndefined();
    });
  });

  describe('mapPaginationDtoToMeta', () => {
    it('maps standard pagination metadata', () => {
      const meta = mapPaginationDtoToMeta({
        page: 2,
        limit: 15,
        total: 50,
        totalPages: 4,
        nextCursor: 'cur-next',
      });

      expect(meta.page).toBe(2);
      expect(meta.limit).toBe(15);
      expect(meta.total).toBe(50);
      expect(meta.totalPages).toBe(4);
      expect(meta.hasNextPage).toBe(true);
      expect(meta.nextCursor).toBe('cur-next');
    });

    it('handles null/undefined gracefully with default limit', () => {
      const meta = mapPaginationDtoToMeta(null);
      expect(meta.limit).toBe(20);
    });
  });

  describe('mapCursorPageDto', () => {
    it('maps items using itemMapper and resolves hasMore', () => {
      interface RawItem {
        id: string;
        title: string;
      }
      interface DomainItem {
        id: string;
        name: string;
      }

      const dto: CursorPageDto<RawItem> = {
        items: [
          { id: '1', title: 'Item 1' },
          { id: '2', title: 'Item 2' },
        ],
        nextCursor: 'cur-2',
        prevCursor: null,
        limit: 2,
        total: 10,
      };

      const result = mapCursorPageDto<RawItem, DomainItem>(dto, (item) => ({
        id: item.id,
        name: item.title,
      }));

      expect(result.items.length).toBe(2);
      expect(result.items[0]?.name).toBe('Item 1');
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('cur-2');
    });
  });
});
