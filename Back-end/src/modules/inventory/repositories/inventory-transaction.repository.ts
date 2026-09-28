import { Types, FilterQuery } from 'mongoose';
import { InventoryTransactionModel } from '../models/inventory-transaction.model';
import {
  IInventoryTransaction,
  IInventoryTransactionDocument,
} from '../types/inventory.types';
import { RepositoryContext } from '../../../common/types';

export interface LedgerQueryOptions {
  page?: number;
  limit?: number;
}

export class InventoryTransactionRepository {
  async create(
    data: Partial<IInventoryTransaction>,
    ctx?: RepositoryContext,
  ): Promise<IInventoryTransactionDocument> {
    const docs = await InventoryTransactionModel.create([data], { session: ctx?.session || undefined });
    return docs[0];
  }

  async findByProduct(
    productId: string | Types.ObjectId,
    variantId?: string | null,
    options: LedgerQueryOptions = {},
    ctx?: RepositoryContext,
  ): Promise<{ items: IInventoryTransactionDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const objectId = typeof productId === 'string' ? new Types.ObjectId(productId) : productId;
    const filter: FilterQuery<IInventoryTransactionDocument> = { productId: objectId };

    if (variantId !== undefined) {
      filter.variantId = variantId;
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const query = InventoryTransactionModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const countQuery = InventoryTransactionModel.countDocuments(filter);

    if (ctx?.session) {
      query.session(ctx.session);
      countQuery.session(ctx.session);
    }

    const [items, total] = await Promise.all([query.exec(), countQuery.exec()]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

export const inventoryTransactionRepository = new InventoryTransactionRepository();
