import { Types } from 'mongoose';
import { startTestDb, stopTestDb, clearTestDb } from '../helpers/test-db';
import { cartService } from '../../src/modules/carts/services/cart.service';
import { CartModel } from '../../src/modules/carts/models/cart.model';
import { ProductModel } from '../../src/modules/products/models/product.model';
import { CategoryModel } from '../../src/modules/categories/models/category.model';
import { IProductDocument } from '../../src/modules/products/types/product.types';
import { ErrorCodes } from '../../src/common/errors/errorCodes';
import { ConflictError, BusinessRuleViolationError } from '../../src/common/errors';

describe('Cart Service Unit & Merge Matrix', () => {
  let activeCategoryId: Types.ObjectId;
  let inactiveCategoryId: Types.ObjectId;
  let standardProduct: IProductDocument;
  let variantProduct: IProductDocument;

  beforeAll(async () => {
    await startTestDb();
  });

  afterAll(async () => {
    await stopTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    // 1. Active & MVP-enabled category
    const activeCat = await CategoryModel.create({
      slug: 'islamic-studies',
      name: { ar: 'دراسات إسلامية', en: 'Islamic Studies' },
      kind: 'product',
      isActive: true,
      isMvpEnabled: true,
      isBooksCore: true,
    });
    activeCategoryId = activeCat._id;

    // 2. Inactive category
    const inactiveCat = await CategoryModel.create({
      slug: 'archived-category',
      name: { ar: 'أرشيف', en: 'Archive' },
      kind: 'product',
      isActive: false,
      isMvpEnabled: false,
      isBooksCore: false,
    });
    inactiveCategoryId = inactiveCat._id;

    // 3. Standard book without variants
    standardProduct = await ProductModel.create({
      slug: 'tafsir-ibn-kathir',
      name: { ar: 'تفسير ابن كثير', en: 'Tafsir Ibn Kathir' },
      categoryId: activeCategoryId,
      priceMinor: 25000,
      currency: 'EGP',
      availability: 'in_stock',
      isPublished: true,
      hasVariants: false,
      variants: [],
      images: [
        {
          publicId: 'books/tafsir-1',
          resourceType: 'image',
          format: 'jpg',
          bytes: 1000,
          width: 800,
          height: 1200,
        },
      ],
    });

    // 4. Book with variants
    variantProduct = await ProductModel.create({
      slug: 'arabic-grammar-levels',
      name: { ar: 'جامع الدروس العربية', en: 'Arabic Grammar' },
      categoryId: activeCategoryId,
      priceMinor: 0,
      currency: 'EGP',
      availability: 'in_stock',
      isPublished: true,
      hasVariants: true,
      images: [],
      variants: [
        {
          variantId: 'vol-1',
          label: { ar: 'الجزء الأول', en: 'Volume 1' },
          priceMinor: 15000,
          currency: 'EGP',
          availability: 'in_stock',
          stockTotal: 10,
          stockReserved: 0,
          preOrderEligible: false,
        },
        {
          variantId: 'vol-2',
          label: { ar: 'الجزء الثاني', en: 'Volume 2' },
          priceMinor: 16000,
          currency: 'EGP',
          availability: 'in_stock',
          stockTotal: 10,
          stockReserved: 0,
          preOrderEligible: false,
        },
        {
          variantId: 'vol-out',
          label: { ar: 'الجزء المنتهي', en: 'Out of Stock Vol' },
          priceMinor: 12000,
          currency: 'EGP',
          availability: 'out_of_stock',
          stockTotal: 0,
          stockReserved: 0,
          preOrderEligible: false,
        },
      ],
    });
  });

  describe('Catalog Validation & Item Addition', () => {
    it('successfully adds standard product to guest cart and increments version', async () => {
      const owner = { ownerType: 'guest' as const, sessionId: 'session-valid-guest-1' };

      const cart = await cartService.addItem(owner, {
        productId: standardProduct._id.toString(),
        quantity: 2,
      });

      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].productId).toBe(standardProduct._id.toString());
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].unitPriceMinor).toBe(25000);
      expect(cart.subtotalMinor).toBe(50000);
      expect(cart.version).toBe(2); // initial creation (v1) -> addItem mutates to v2
    });

    it('combines quantity when adding the same product and variant', async () => {
      const owner = { ownerType: 'guest' as const, sessionId: 'session-merge-qty-1' };

      await cartService.addItem(owner, {
        productId: standardProduct._id.toString(),
        quantity: 1,
      });

      const updated = await cartService.addItem(owner, {
        productId: standardProduct._id.toString(),
        quantity: 3,
      });

      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].quantity).toBe(4);
      expect(updated.subtotalMinor).toBe(4 * 25000);
      expect(updated.version).toBe(3);
    });

    it('creates distinct cart lines for different variants of the same product', async () => {
      const owner = { ownerType: 'guest' as const, sessionId: 'session-variants-diff' };

      await cartService.addItem(owner, {
        productId: variantProduct._id.toString(),
        variantId: 'vol-1',
        quantity: 1,
      });

      const updated = await cartService.addItem(owner, {
        productId: variantProduct._id.toString(),
        variantId: 'vol-2',
        quantity: 2,
      });

      expect(updated.items).toHaveLength(2);
      expect(updated.items[0].variantId).toBe('vol-1');
      expect(updated.items[0].quantity).toBe(1);
      expect(updated.items[1].variantId).toBe('vol-2');
      expect(updated.items[1].quantity).toBe(2);
      expect(updated.subtotalMinor).toBe(15000 * 1 + 16000 * 2);
    });

    it('rejects unpublished product', async () => {
      const unpublished = await ProductModel.create({
        slug: 'draft-book',
        name: { ar: 'كتاب مسودة' },
        categoryId: activeCategoryId,
        priceMinor: 10000,
        currency: 'EGP',
        availability: 'in_stock',
        isPublished: false,
        hasVariants: false,
        variants: [],
      });

      const owner = { ownerType: 'guest' as const, sessionId: 'session-unpub-check' };

      await expect(
        cartService.addItem(owner, {
          productId: unpublished._id.toString(),
          quantity: 1,
        }),
      ).rejects.toThrow(BusinessRuleViolationError);
    });

    it('rejects product belonging to inactive category', async () => {
      const inactiveProd = await ProductModel.create({
        slug: 'archived-book',
        name: { ar: 'كتاب مؤرشف' },
        categoryId: inactiveCategoryId,
        priceMinor: 10000,
        currency: 'EGP',
        availability: 'in_stock',
        isPublished: true,
        hasVariants: false,
        variants: [],
      });

      const owner = { ownerType: 'guest' as const, sessionId: 'session-inactive-cat' };

      await expect(
        cartService.addItem(owner, {
          productId: inactiveProd._id.toString(),
          quantity: 1,
        }),
      ).rejects.toThrow(BusinessRuleViolationError);
    });

    it('rejects out of stock variant', async () => {
      const owner = { ownerType: 'guest' as const, sessionId: 'session-out-variant' };

      await expect(
        cartService.addItem(owner, {
          productId: variantProduct._id.toString(),
          variantId: 'vol-out',
          quantity: 1,
        }),
      ).rejects.toThrow(BusinessRuleViolationError);
    });

    it('requires variantId when product has variants', async () => {
      const owner = { ownerType: 'guest' as const, sessionId: 'session-var-req' };

      await expect(
        cartService.addItem(owner, {
          productId: variantProduct._id.toString(),
          quantity: 1,
        }),
      ).rejects.toThrow(BusinessRuleViolationError);
    });
  });

  describe('Optimistic Concurrency & Stale Version Protection', () => {
    it('rejects updateItem when expectedVersion does not match current version', async () => {
      const owner = { ownerType: 'guest' as const, sessionId: 'session-version-test' };

      const cart = await cartService.addItem(owner, {
        productId: standardProduct._id.toString(),
        quantity: 1,
      });

      const itemId = cart.items[0].id;
      const currentVersion = cart.version;

      // Stale expectedVersion
      await expect(
        cartService.updateItem(owner, itemId, {
          quantity: 5,
          expectedVersion: currentVersion - 1,
        }),
      ).rejects.toThrow(ConflictError);

      // Verify cart was not mutated
      const freshCart = await cartService.getCart(owner);
      expect(freshCart.items[0].quantity).toBe(1);
      expect(freshCart.version).toBe(currentVersion);
    });
  });

  describe('Guest -> Registered User Cart Merge Matrix', () => {
    it('merges guest cart into user cart when compatible (combines quantities & keeps distinct items)', async () => {
      const guestSessionId = 'guest-session-merge-success';
      const guestOwner = { ownerType: 'guest' as const, sessionId: guestSessionId };
      const userId = new Types.ObjectId().toString();
      const userOwner = { ownerType: 'user' as const, userId };

      // Guest has standardProduct (qty: 2) and variantProduct vol-1 (qty: 1)
      await cartService.addItem(guestOwner, {
        productId: standardProduct._id.toString(),
        quantity: 2,
      });
      await cartService.addItem(guestOwner, {
        productId: variantProduct._id.toString(),
        variantId: 'vol-1',
        quantity: 1,
      });

      // User already has standardProduct (qty: 1) and variantProduct vol-2 (qty: 3)
      await cartService.addItem(userOwner, {
        productId: standardProduct._id.toString(),
        quantity: 1,
      });
      await cartService.addItem(userOwner, {
        productId: variantProduct._id.toString(),
        variantId: 'vol-2',
        quantity: 3,
      });

      // Merge
      const result = await cartService.mergeCart(userId, guestSessionId);

      expect(result.conflicts).toHaveLength(0);
      expect(result.cart.items).toHaveLength(3);

      // standardProduct quantity combined: 1 + 2 = 3
      const standardMerged = result.cart.items.find((i) => i.productId === standardProduct._id.toString());
      expect(standardMerged?.quantity).toBe(3);

      // variant vol-1 moved from guest: qty = 1
      const vol1 = result.cart.items.find((i) => i.variantId === 'vol-1');
      expect(vol1?.quantity).toBe(1);

      // variant vol-2 retained from user: qty = 3
      const vol2 = result.cart.items.find((i) => i.variantId === 'vol-2');
      expect(vol2?.quantity).toBe(3);

      // Guest cart must be deleted after clean merge
      const guestCartAfter = await CartModel.findOne({ ownerType: 'guest', sessionId: guestSessionId });
      expect(guestCartAfter).toBeNull();
    });

    it('returns conflict and does not silently drop if product becomes out of stock', async () => {
      const guestSessionId = 'guest-session-merge-conflict-stock';
      const guestOwner = { ownerType: 'guest' as const, sessionId: guestSessionId };
      const userId = new Types.ObjectId().toString();

      await cartService.addItem(guestOwner, {
        productId: standardProduct._id.toString(),
        quantity: 1,
      });

      // Catalog change: product goes out of stock
      await ProductModel.findByIdAndUpdate(standardProduct._id, { availability: 'out_of_stock' });

      try {
        await cartService.mergeCart(userId, guestSessionId);
        fail('Expected mergeCart to throw ConflictError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ConflictError);
        const conflictErr = err as ConflictError;
        expect(conflictErr.code).toBe(ErrorCodes.CART_MERGE_CONFLICT);
        const conflicts = (conflictErr.details as { conflicts: Array<{ reason: string }> }).conflicts;
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].reason).toBe('PRODUCT_UNAVAILABLE');
      }

      // Guest cart was NOT deleted
      const guestCart = await CartModel.findOne({ ownerType: 'guest', sessionId: guestSessionId });
      expect(guestCart).not.toBeNull();
    });

    it('returns conflict and does not silently drop if product price changed in catalog', async () => {
      const guestSessionId = 'guest-session-merge-price-change';
      const guestOwner = { ownerType: 'guest' as const, sessionId: guestSessionId };
      const userId = new Types.ObjectId().toString();

      await cartService.addItem(guestOwner, {
        productId: standardProduct._id.toString(),
        quantity: 1,
      });

      // Admin changes product price from 25000 to 30000
      await ProductModel.findByIdAndUpdate(standardProduct._id, { priceMinor: 30000 });

      try {
        await cartService.mergeCart(userId, guestSessionId);
        fail('Expected mergeCart to throw ConflictError due to price change');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ConflictError);
        const conflictErr = err as ConflictError;
        expect(conflictErr.code).toBe(ErrorCodes.CART_MERGE_CONFLICT);
        const conflicts = (
          conflictErr.details as {
            conflicts: Array<{
              reason: string;
              details?: { previousPriceMinor: number; currentPriceMinor: number };
            }>;
          }
        ).conflicts;
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].reason).toBe('PRICE_CHANGED');
        expect(conflicts[0].details?.previousPriceMinor).toBe(25000);
        expect(conflicts[0].details?.currentPriceMinor).toBe(30000);
      }
    });

    it('returns conflict if variant was removed from catalog', async () => {
      const guestSessionId = 'guest-session-merge-deleted-var';
      const guestOwner = { ownerType: 'guest' as const, sessionId: guestSessionId };
      const userId = new Types.ObjectId().toString();

      await cartService.addItem(guestOwner, {
        productId: variantProduct._id.toString(),
        variantId: 'vol-1',
        quantity: 1,
      });

      // Admin removes variant vol-1
      await ProductModel.findByIdAndUpdate(variantProduct._id, {
        $pull: { variants: { variantId: 'vol-1' } },
      });

      try {
        await cartService.mergeCart(userId, guestSessionId);
        fail('Expected mergeCart to throw ConflictError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ConflictError);
        const conflictErr = err as ConflictError;
        expect(conflictErr.code).toBe(ErrorCodes.CART_MERGE_CONFLICT);
        const conflicts = (conflictErr.details as { conflicts: Array<{ reason: string }> }).conflicts;
        expect(conflicts[0].reason).toBe('VARIANT_NOT_FOUND');
      }
    });

    it('returns conflict if product was unpublished', async () => {
      const guestSessionId = 'guest-session-merge-unpub';
      const guestOwner = { ownerType: 'guest' as const, sessionId: guestSessionId };
      const userId = new Types.ObjectId().toString();

      await cartService.addItem(guestOwner, {
        productId: standardProduct._id.toString(),
        quantity: 1,
      });

      // Product unpublished
      await ProductModel.findByIdAndUpdate(standardProduct._id, { isPublished: false });

      try {
        await cartService.mergeCart(userId, guestSessionId);
        fail('Expected mergeCart to throw ConflictError');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(ConflictError);
        const conflictErr = err as ConflictError;
        expect(conflictErr.code).toBe(ErrorCodes.CART_MERGE_CONFLICT);
        const conflicts = (conflictErr.details as { conflicts: Array<{ reason: string }> }).conflicts;
        expect(conflicts[0].reason).toBe('PRODUCT_UNPUBLISHED');
      }
    });
  });
});
