import { Types } from 'mongoose';
import { ProductModel } from '../../products/models/product.model';
import { IProductDocument } from '../../products/types/product.types';
import { RepositoryContext } from '../../../common/types';

export class InventoryRepository {
  /**
   * Find product by ID with optional session.
   */
  async findProductById(
    productId: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IProductDocument | null> {
    const objectId = typeof productId === 'string' ? new Types.ObjectId(productId) : productId;
    const query = ProductModel.findById(objectId);
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query;
  }

  /**
   * Conditionally reserve stock for a non-variant product.
   * Atomic condition: (stockTotal - stockReserved) >= quantity.
   */
  async reserveProductStock(
    productId: string | Types.ObjectId,
    quantity: number,
    ctx?: RepositoryContext,
  ): Promise<boolean> {
    const objectId = typeof productId === 'string' ? new Types.ObjectId(productId) : productId;
    const res = await ProductModel.updateOne(
      {
        _id: objectId,
        hasVariants: false,
        $expr: {
          $gte: [{ $subtract: ['$stockTotal', '$stockReserved'] }, quantity],
        },
      },
      {
        $inc: {
          stockReserved: quantity,
          inventoryVersion: 1,
        },
      },
      { session: ctx?.session || undefined },
    );

    return res.modifiedCount === 1;
  }

  /**
   * Conditionally reserve stock for an embedded variant product.
   * Atomic condition: variant exists and (variant.stockTotal - variant.stockReserved) >= quantity.
   */
  async reserveVariantStock(
    productId: string | Types.ObjectId,
    variantId: string,
    quantity: number,
    ctx?: RepositoryContext,
  ): Promise<boolean> {
    const objectId = typeof productId === 'string' ? new Types.ObjectId(productId) : productId;
    const res = await ProductModel.updateOne(
      {
        _id: objectId,
        hasVariants: true,
        'variants.variantId': variantId,
        $expr: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: '$variants',
                  as: 'v',
                  cond: {
                    $and: [
                      { $eq: ['$$v.variantId', variantId] },
                      {
                        $gte: [
                          { $subtract: ['$$v.stockTotal', '$$v.stockReserved'] },
                          quantity,
                        ],
                      },
                    ],
                  },
                },
              },
            },
            0,
          ],
        },
      },
      {
        $inc: {
          'variants.$.stockReserved': quantity,
          'variants.$.inventoryVersion': 1,
          inventoryVersion: 1,
        },
      },
      { session: ctx?.session || undefined },
    );

    return res.modifiedCount === 1;
  }

  /**
   * Conditionally release reserved stock for a non-variant product.
   * Atomic condition: stockReserved >= quantity.
   */
  async releaseProductStock(
    productId: string | Types.ObjectId,
    quantity: number,
    ctx?: RepositoryContext,
  ): Promise<boolean> {
    const objectId = typeof productId === 'string' ? new Types.ObjectId(productId) : productId;
    const res = await ProductModel.updateOne(
      {
        _id: objectId,
        hasVariants: false,
        stockReserved: { $gte: quantity },
      },
      {
        $inc: {
          stockReserved: -quantity,
          inventoryVersion: 1,
        },
      },
      { session: ctx?.session || undefined },
    );

    return res.modifiedCount === 1;
  }

  /**
   * Conditionally release reserved stock for an embedded variant product.
   * Atomic condition: variant exists and variant.stockReserved >= quantity.
   */
  async releaseVariantStock(
    productId: string | Types.ObjectId,
    variantId: string,
    quantity: number,
    ctx?: RepositoryContext,
  ): Promise<boolean> {
    const objectId = typeof productId === 'string' ? new Types.ObjectId(productId) : productId;
    const res = await ProductModel.updateOne(
      {
        _id: objectId,
        hasVariants: true,
        'variants.variantId': variantId,
        'variants.stockReserved': { $gte: quantity },
      },
      {
        $inc: {
          'variants.$.stockReserved': -quantity,
          'variants.$.inventoryVersion': 1,
          inventoryVersion: 1,
        },
      },
      { session: ctx?.session || undefined },
    );

    return res.modifiedCount === 1;
  }

  /**
   * Conditionally deduct total and reserved stock upon fulfillment for a non-variant product.
   * Invariants: stockTotal >= quantity AND stockReserved >= quantity.
   */
  async deductProductStock(
    productId: string | Types.ObjectId,
    quantity: number,
    ctx?: RepositoryContext,
  ): Promise<boolean> {
    const objectId = typeof productId === 'string' ? new Types.ObjectId(productId) : productId;
    const res = await ProductModel.updateOne(
      {
        _id: objectId,
        hasVariants: false,
        stockTotal: { $gte: quantity },
        stockReserved: { $gte: quantity },
      },
      {
        $inc: {
          stockTotal: -quantity,
          stockReserved: -quantity,
          inventoryVersion: 1,
        },
      },
      { session: ctx?.session || undefined },
    );

    return res.modifiedCount === 1;
  }

  /**
   * Conditionally deduct total and reserved stock upon fulfillment for a variant product.
   * Invariants: variant.stockTotal >= quantity AND variant.stockReserved >= quantity.
   */
  async deductVariantStock(
    productId: string | Types.ObjectId,
    variantId: string,
    quantity: number,
    ctx?: RepositoryContext,
  ): Promise<boolean> {
    const objectId = typeof productId === 'string' ? new Types.ObjectId(productId) : productId;
    const res = await ProductModel.updateOne(
      {
        _id: objectId,
        hasVariants: true,
        'variants.variantId': variantId,
        'variants.stockTotal': { $gte: quantity },
        'variants.stockReserved': { $gte: quantity },
      },
      {
        $inc: {
          'variants.$.stockTotal': -quantity,
          'variants.$.stockReserved': -quantity,
          'variants.$.inventoryVersion': 1,
          inventoryVersion: 1,
        },
      },
      { session: ctx?.session || undefined },
    );

    return res.modifiedCount === 1;
  }

  /**
   * Optimistically adjust stock for a non-variant product with version checking.
   */
  async adjustProductStockWithVersion(
    productId: string | Types.ObjectId,
    expectedVersion: number,
    deltaStockTotal: number,
    deltaStockReserved: number,
    ctx?: RepositoryContext,
  ): Promise<boolean> {
    const objectId = typeof productId === 'string' ? new Types.ObjectId(productId) : productId;
    const query: Record<string, unknown> = {
      _id: objectId,
      hasVariants: false,
      inventoryVersion: expectedVersion,
    };

    // Prevent negative stock invariants in the filter
    if (deltaStockTotal < 0) {
      query.stockTotal = { $gte: Math.abs(deltaStockTotal) };
    }
    if (deltaStockReserved < 0) {
      query.stockReserved = { $gte: Math.abs(deltaStockReserved) };
    }

    const res = await ProductModel.updateOne(
      query,
      {
        $inc: {
          stockTotal: deltaStockTotal,
          stockReserved: deltaStockReserved,
          inventoryVersion: 1,
        },
      },
      { session: ctx?.session || undefined },
    );

    return res.modifiedCount === 1;
  }

  /**
   * Optimistically adjust stock for a variant with version checking.
   */
  async adjustVariantStockWithVersion(
    productId: string | Types.ObjectId,
    variantId: string,
    expectedVersion: number,
    deltaStockTotal: number,
    deltaStockReserved: number,
    ctx?: RepositoryContext,
  ): Promise<boolean> {
    const objectId = typeof productId === 'string' ? new Types.ObjectId(productId) : productId;
    const elemFilter: Record<string, unknown> = {
      variantId,
      inventoryVersion: expectedVersion,
    };

    if (deltaStockTotal < 0) {
      elemFilter.stockTotal = { $gte: Math.abs(deltaStockTotal) };
    }
    if (deltaStockReserved < 0) {
      elemFilter.stockReserved = { $gte: Math.abs(deltaStockReserved) };
    }

    const res = await ProductModel.updateOne(
      {
        _id: objectId,
        hasVariants: true,
        variants: {
          $elemMatch: elemFilter,
        },
      },
      {
        $inc: {
          'variants.$.stockTotal': deltaStockTotal,
          'variants.$.stockReserved': deltaStockReserved,
          'variants.$.inventoryVersion': 1,
          inventoryVersion: 1,
        },
      },
      { session: ctx?.session || undefined },
    );

    return res.modifiedCount === 1;
  }
}

export const inventoryRepository = new InventoryRepository();
