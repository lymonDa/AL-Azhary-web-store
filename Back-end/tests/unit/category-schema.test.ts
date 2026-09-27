import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from '../../src/modules/categories/schemas/category.schema';

describe('Category Schema Unit Tests', () => {
  describe('createCategorySchema', () => {
    it('accepts a valid category payload', () => {
      const payload = {
        slug: 'islamic-jurisprudence',
        name: { ar: 'الفقه الإسلامي', en: 'Islamic Jurisprudence' },
        parentId: '507f1f77bcf86cd799439011',
        kind: 'product',
        displayOrder: 1,
        isActive: true,
        isMvpEnabled: true,
        isBooksCore: true,
      };

      const result = createCategorySchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.slug).toBe('islamic-jurisprudence');
        expect(result.data.name.ar).toBe('الفقه الإسلامي');
      }
    });

    it('accepts category without optional en name and parentId', () => {
      const payload = {
        slug: 'hadith',
        name: { ar: 'الحديث الشريف' },
      };

      const result = createCategorySchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.displayOrder).toBe(0);
        expect(result.data.isActive).toBe(true);
        expect(result.data.isMvpEnabled).toBe(true);
        expect(result.data.isBooksCore).toBe(false);
      }
    });

    it('rejects invalid slug with spaces or uppercase or special characters', () => {
      const invalidSlugs = ['Invalid Slug', 'slug_with_underscores', 'slug--double', '-lead', 'trail-'];
      for (const slug of invalidSlugs) {
        const result = createCategorySchema.safeParse({
          slug,
          name: { ar: 'اسم' },
        });
        expect(result.success).toBe(false);
      }
    });

    it('rejects missing Arabic name', () => {
      const result = createCategorySchema.safeParse({
        slug: 'valid-slug',
        name: { en: 'English Only' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid parentId format', () => {
      const result = createCategorySchema.safeParse({
        slug: 'valid-slug',
        name: { ar: 'اسم' },
        parentId: 'invalid-id-format',
      });
      expect(result.success).toBe(false);
    });

    it('rejects mass-assignment and unknown fields (strict)', () => {
      const result = createCategorySchema.safeParse({
        slug: 'valid-slug',
        name: { ar: 'اسم' },
        unknownField: 'malicious',
        _id: '507f1f77bcf86cd799439011',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateCategorySchema', () => {
    it('accepts valid partial updates', () => {
      const result = updateCategorySchema.safeParse({
        displayOrder: 5,
        isBooksCore: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects unknown fields on update', () => {
      const result = updateCategorySchema.safeParse({
        arbitraryInjection: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('categoryIdParamSchema', () => {
    it('accepts valid 24-hex ObjectId', () => {
      const result = categoryIdParamSchema.safeParse({ id: '507f1f77bcf86cd799439011' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid ObjectId', () => {
      const result = categoryIdParamSchema.safeParse({ id: '12345' });
      expect(result.success).toBe(false);
    });
  });
});
