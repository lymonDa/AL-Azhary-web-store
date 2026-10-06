"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preorderRepository = exports.PreorderRepository = void 0;
const mongoose_1 = require("mongoose");
const preorder_model_1 = require("../models/preorder.model");
class PreorderRepository {
    /**
     * Creates a new preorder document atomically.
     */
    async create(data, ctx) {
        const docs = await preorder_model_1.PreorderModel.create([data], { session: ctx?.session || undefined });
        return docs[0];
    }
    /**
     * Finds a pre-order by unique public reference.
     */
    async findByReference(reference, ctx) {
        const query = preorder_model_1.PreorderModel.findOne({ reference: reference.trim() });
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query.exec();
    }
    /**
     * Finds a pre-order by internal ObjectId.
     */
    async findById(id, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        const query = preorder_model_1.PreorderModel.findById(objectId);
        if (ctx?.session) {
            query.session(ctx.session);
        }
        return query.exec();
    }
    /**
     * Retrieves paginated pre-orders owned by a specific customer.
     */
    async findCustomerPreorders(customerId, filter, pagination, ctx) {
        const userObjectId = typeof customerId === 'string' ? new mongoose_1.Types.ObjectId(customerId) : customerId;
        const queryFilter = {
            customerId: userObjectId,
        };
        if (filter.status) {
            if (Array.isArray(filter.status)) {
                queryFilter.status = { $in: filter.status };
            }
            else {
                queryFilter.status = filter.status;
            }
        }
        if (filter.productId) {
            queryFilter.productId =
                typeof filter.productId === 'string' ? new mongoose_1.Types.ObjectId(filter.productId) : filter.productId;
        }
        if (filter.variantId !== undefined) {
            queryFilter.variantId = filter.variantId;
        }
        if (filter.reference) {
            queryFilter.reference = filter.reference.trim();
        }
        const [preorders, total] = await Promise.all([
            preorder_model_1.PreorderModel.find(queryFilter)
                .sort({ createdAt: -1, _id: -1 })
                .skip(pagination.skip)
                .limit(pagination.limit)
                .session(ctx?.session || null)
                .exec(),
            preorder_model_1.PreorderModel.countDocuments(queryFilter).session(ctx?.session || null).exec(),
        ]);
        return { preorders, total };
    }
    /**
     * Retrieves paginated pre-orders for admin with multi-criteria filtering.
     */
    async findAdminPreorders(filter, pagination, ctx) {
        const queryFilter = {};
        if (filter.customerId) {
            queryFilter.customerId =
                typeof filter.customerId === 'string' ? new mongoose_1.Types.ObjectId(filter.customerId) : filter.customerId;
        }
        if (filter.status) {
            if (Array.isArray(filter.status)) {
                queryFilter.status = { $in: filter.status };
            }
            else {
                queryFilter.status = filter.status;
            }
        }
        if (filter.productId) {
            queryFilter.productId =
                typeof filter.productId === 'string' ? new mongoose_1.Types.ObjectId(filter.productId) : filter.productId;
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
            preorder_model_1.PreorderModel.find(queryFilter)
                .sort({ createdAt: -1, _id: -1 })
                .skip(pagination.skip)
                .limit(pagination.limit)
                .session(ctx?.session || null)
                .exec(),
            preorder_model_1.PreorderModel.countDocuments(queryFilter).session(ctx?.session || null).exec(),
        ]);
        return { preorders, total };
    }
    /**
     * Atomically updates preorder status and fields with optimistic version checking.
     */
    async updateStatusWithVersion(reference, fromStatus, toStatus, updateData, expectedVersion, ctx) {
        const filter = {
            reference: reference.trim(),
            status: Array.isArray(fromStatus) ? { $in: fromStatus } : fromStatus,
        };
        if (expectedVersion !== undefined) {
            filter.version = expectedVersion;
        }
        const update = {
            ...updateData,
            status: toStatus,
            $inc: { version: 1 },
        };
        return preorder_model_1.PreorderModel.findOneAndUpdate(filter, update, {
            new: true,
            session: ctx?.session || undefined,
        }).exec();
    }
    /**
     * Updates an existing preorder by ID with session support.
     */
    async updateById(id, updateData, ctx) {
        const objectId = typeof id === 'string' ? new mongoose_1.Types.ObjectId(id) : id;
        return preorder_model_1.PreorderModel.findByIdAndUpdate(objectId, updateData, {
            new: true,
            session: ctx?.session || undefined,
        }).exec();
    }
    /**
     * Counts active (non-terminal) pre-orders for a given product and variant.
     */
    async countActiveByProductAndVariant(productId, variantId, session) {
        const filter = {
            productId,
            variantId: variantId ?? null,
            status: { $in: ['requested', 'admin_review', 'accepted', 'payment_pending', 'confirmed'] },
        };
        return preorder_model_1.PreorderModel.countDocuments(filter).session(session || null).exec();
    }
}
exports.PreorderRepository = PreorderRepository;
exports.preorderRepository = new PreorderRepository();
//# sourceMappingURL=preorder.repository.js.map