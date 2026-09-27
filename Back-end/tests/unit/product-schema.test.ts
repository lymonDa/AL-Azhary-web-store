import {
  createProductSchema,
  updateProductSchema,
  productIdParamSchema,
  productSlugParamSchema,
  listProductsQuerySchema,
  searchQuerySchema,
} from '../../src/modules/products/schemas/product.schema';

describe('Product Schema Unit Tests', () => {
  const validBaseProduct = {
    slug: 'sahih-al-bukhari',
    name: { ar: 'صحيح البخاري', en: 'Sahih al-Bukhari' },
    description: { ar: 'كتاب الحديث الشريف', en: 'Book of Authentic Hadith' },
    categoryId: '507f1f77bcf86cd799439011',
    images: [
      {
        publicId: 'al-azhari/products/bukhari_cov',
        resourceType: 'image',
        format: 'webp',
        bytes: 154200,
        width: 800,
        height: 1200,
        hash: 'abc123hash',
      },
    ],
    metadata: {
      author: 'الإمام البخاري',
      publisher: 'دار ابن كثير',
      subject: 'حديث',
      isbn: '978-0-123456-47-2',
    },
    hasVariants: false,
    priceMinor: 25000, // 250.00 EGP in piastres
    currency: 'EGP',
    availability: 'in_stock',
    preOrderEligible: false,
    isPublished: true,
  };

  it('accepts a valid product without variants', () => {
    const result = createProductSchema.safeParse(validBaseProduct);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slug).toBe('sahih-al-bukhari');
      expect(result.data.priceMinor).toBe(25000);
      expect(result.data.currency).toBe('EGP');
    }
  });

  it('accepts a product with null description (description is nullable)', () => {
    const result = createProductSchema.safeParse({
      ...validBaseProduct,
      description: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a valid product with variants', () => {
    const result = createProductSchema.safeParse({
      ...validBaseProduct,
      hasVariants: true,
      variants: [
        {
          variantId: 'vol-1',
          attributes: { volume: '1' },
          label: { ar: 'المجلد الأول', en: 'Volume 1' },
          priceMinor: 15000,
          currency: 'EGP',
          availability: 'in_stock',
          stockTotal: 20,
          stockReserved: 2,
        },
        {
          variantId: 'vol-2',
          attributes: { volume: '2' },
          label: { ar: 'المجلد الثاني', en: 'Volume 2' },
          priceMinor: 15000,
          currency: 'EGP',
          availability: 'in_stock',
          stockTotal: 15,
          stockReserved: 0,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects duplicate variantId inside variants list', () => {
    const result = createProductSchema.safeParse({
      ...validBaseProduct,
      hasVariants: true,
      variants: [
        {
          variantId: 'dup-id',
          attributes: { edition: 'standard' },
          label: { ar: 'طبعة عادية' },
          priceMinor: 10000,
        },
        {
          variantId: 'dup-id',
          attributes: { edition: 'deluxe' },
          label: { ar: 'طبعة فاخرة' },
          priceMinor: 20000,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects product with hasVariants=true but empty variants array', () => {
    const result = createProductSchema.safeParse({
      ...validBaseProduct,
      hasVariants: true,
      variants: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative priceMinor', () => {
    const result = createProductSchema.safeParse({
      ...validBaseProduct,
      priceMinor: -500,
    });
    expect(result.success).toBe(false);
  });

  it('rejects floating-point priceMinor (only integer piastres allowed)', () => {
    const result = createProductSchema.safeParse({
      ...validBaseProduct,
      priceMinor: 25.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-EGP currency', () => {
    const result = createProductSchema.safeParse({
      ...validBaseProduct,
      currency: 'USD',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid availability state', () => {
    const result = createProductSchema.safeParse({
      ...validBaseProduct,
      availability: 'discontinued',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid image metadata (e.g. width < 1 or negative bytes)', () => {
    const result = createProductSchema.safeParse({
      ...validBaseProduct,
      images: [
        {
          publicId: 'img-1',
          resourceType: 'image',
          format: 'webp',
          bytes: -10,
          width: 0,
          height: 100,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown fields on product creation (mass-assignment defense)', () => {
    const result = createProductSchema.safeParse({
      ...validBaseProduct,
      arbitraryField: 'attack',
      __v: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative stock in variants or top-level', () => {
    const result = createProductSchema.safeParse({
      ...validBaseProduct,
      stockTotal: -5,
    });
    expect(result.success).toBe(false);
  });

  describe('updateProductSchema', () => {
    it('accepts partial updates', () => {
      const result = updateProductSchema.safeParse({
        priceMinor: 30000,
        availability: 'out_of_stock',
      });
      expect(result.success).toBe(true);
    });

    it('rejects unknown fields on update', () => {
      const result = updateProductSchema.safeParse({
        maliciousAdminOverride: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('param and query schemas', () => {
    it('validates productIdParamSchema', () => {
      expect(productIdParamSchema.safeParse({ id: '507f1f77bcf86cd799439011' }).success).toBe(true);
      expect(productIdParamSchema.safeParse({ id: 'bad-id' }).success).toBe(false);
    });

    it('validates productSlugParamSchema', () => {
      expect(productSlugParamSchema.safeParse({ slug: 'my-book-slug' }).success).toBe(true);
      expect(productSlugParamSchema.safeParse({ slug: '' }).success).toBe(false);
    });

    it('validates listProductsQuerySchema with bounds', () => {
      const res = listProductsQuerySchema.safeParse({ page: '2', limit: '50', availability: 'in_stock' });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.page).toBe(2);
        expect(res.data.limit).toBe(50);
      }

      // Reject limit > 100
      expect(listProductsQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
    });

    it('validates searchQuerySchema', () => {
      expect(searchQuerySchema.safeParse({ q: 'بخاري' }).success).toBe(true);
      expect(searchQuerySchema.safeParse({ q: '' }).success).toBe(false);
    });
  });
});
