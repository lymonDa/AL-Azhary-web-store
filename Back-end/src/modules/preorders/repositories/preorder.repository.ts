import { Types, FilterQuery, ClientSession } from 'mongoose';
import { PreorderModel } from '../models/preorder.model';
import {
  IPreorder,
  IPreorderDocument,
  PreorderFilter,
  PreorderStatus,
} from '../types/preorder.types';
import { RepositoryContext } from '../../../common/types';

export class PreorderRepository {
  /**
   * Creates a new preorder document atomically.
   */
  async create(data: Partial<IPreorder>, ctx?: RepositoryContext): Promise<IPreorderDocument> {
    const docs = await PreorderModel.create([data], { session: ctx?.session || undefined });
    return docs[0];
  }

  /**
   * Finds a pre-order by unique public reference.
   */
  async findByReference(
    reference: string,
    ctx?: RepositoryContext,
  ): Promise<IPreorderDocument | null> {
    const query = PreorderModel.findOne({ reference: reference.trim() });
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query.exec();
  }

  /**
   * Finds a pre-order by internal ObjectId.
   */
  async findById(
    id: string | Types.ObjectId,
    ctx?: RepositoryContext,
  ): Promise<IPreorderDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const query = PreorderModel.findById(objectId);
    if (ctx?.session) {
      query.session(ctx.session);
    }
    return query.exec();
  }

  /**
   * Retrieves paginated pre-orders owned by a specific customer.
   */
  async findCustomerPreorders(
    customerId: string | Types.ObjectId,
    filter: PreorderFilter,
    pagination: { skip: number; limit: number },
    ctx?: RepositoryContext,
  ): Promise<{ preorders: IPreorderDocument[]; total: number }> {
    const userObjectId = typeof customerId === 'string' ? new Types.ObjectId(customerId) : customerId;
    const queryFilter: FilterQuery<IPreorderDocument> = {
      customerId: userObjectId,
    };

    if (filter.status) {
      if (Array.isArray(filter.status)) {
        queryFilter.status = { $in: filter.status };
      } else {
        queryFilter.status = filter.status;
      }
    }

    if (filter.productId) {
      queryFilter.productId =
        typeof filter.productId === 'string' ? new Types.ObjectId(filter.productId) : filter.productId;
    }

    if (filter.variantId !== undefined) {
      queryFilter.variantId = filter.variantId;
    }

    if (filter.reference) {
      queryFilter.reference = filter.reference.trim();
    }

    const [preorders, total] = await Promise.all([
      PreorderModel.find(queryFilter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .session(ctx?.session || null)
        .exec(),
      PreorderModel.countDocuments(queryFilter).session(ctx?.session || null).exec(),
    ]);

    return { preorders, total };
  }

  /**
   * Retrieves paginated pre-orders for admin with multi-criteria filtering.
   */
  async findAdminPreorders(
    filter: PreorderFilter,
    pagination: { skip: number; limit: number },
    ctx?: RepositoryContext,
  ): Promise<{ preorders: IPreorderDocument[]; total: number }> {
    const queryFilter: FilterQuery<IPreorderDocument> = {};

    if (filter.customerId) {
      queryFilter.customerId =
        typeof filter.customerId === 'string' ? new Types.ObjectId(filter.customerId) : filter.customerId;
    }

    if (filter.status) {
      if (Array.isArray(filter.status)) {
        queryFilter.status = { $in: filter.status };
      } else {
        queryFilter.status = filter.status;
      }
    }

    if (filter.productId) {
      queryFilter.productId =
        typeof filter.productId === 'string' ? new Types.ObjectId(filter.productId) : filter.productId;
    }

    if (filter.variantId !== undefined) {
      queryFilter.variantId = filter.variantId;
    }

    if (filter.reference) {
      queryFilter.reference = filter.reference.trim();
    }

    if (filter.dateFrom || filter.dateTo) {
      queryFilter.createdAt = {};
      if (filter.dateFrom) {
        queryFilter.createdAt.$gte = filter.dateFrom;
      }
      if (filter.dateTo) {
        queryFilter.createdAt.$lte = filter.dateTo;
      }
    }

    const [preorders, total] = await Promise.all([
      PreorderModel.find(queryFilter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .session(ctx?.session || null)
        .exec(),
      PreorderModel.countDocuments(queryFilter).session(ctx?.session || null).exec(),
    ]);

    return { preorders, total };
  }

  /**
   * Atomically updates preorder status and fields with optimistic version checking.
   */
  async updateStatusWithVersion(
    reference: string,
    fromStatus: PreorderStatus | PreorderStatus[],
    toStatus: PreorderStatus,
    updateData: Partial<IPreorder>,
    expectedVersion?: number,
    ctx?: RepositoryContext,
  ): Promise<IPreorderDocument | null> {
    const filter: FilterQuery<IPreorderDocument> = {
      reference: reference.trim(),
      status: Array.isArray(fromStatus) ? { $in: fromStatus } : fromStatus,
    };

    if (expectedVersion !== undefined) {
      filter.version = expectedVersion;
    }

    const update: Record<string, unknown> = {
      ...updateData,
      status: toStatus,
      $inc: { version: 1 },
    };

    return PreorderModel.findOneAndUpdate(filter, update, {
      new: true,
      session: ctx?.session || undefined,
    }).exec();
  }

  /**
   * Updates an existing preorder by ID with session support.
   */
  async updateById(
    id: string | Types.ObjectId,
    updateData: Partial<IPreorder>,
    ctx?: RepositoryContext,
  ): Promise<IPreorderDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    return PreorderModel.findByIdAndUpdate(objectId, updateData, {
      new: true,
      session: ctx?.session || undefined,
    }).exec();
  }

  /**
   * Counts active (non-terminal) pre-orders for a given product and variant.
   */
  async countActiveByProductAndVariant(
    productId: Types.ObjectId,
    variantId?: string | null,
    session?: ClientSession,
  ): Promise<number> {
    const filter: FilterQuery<IPreorderDocument> = {
      productId,
      variantId: variantId ?? null,
      status: { $in: ['requested', 'admin_review', 'accepted', 'payment_pending', 'confirmed'] },
    };
    return PreorderModel.countDocuments(filter).session(session || null).exec();
  }
}

export const preorderRepository = new PreorderRepository();
