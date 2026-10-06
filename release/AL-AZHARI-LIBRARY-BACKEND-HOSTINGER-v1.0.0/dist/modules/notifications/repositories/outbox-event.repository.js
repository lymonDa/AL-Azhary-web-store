"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outboxEventRepository = exports.OutboxEventRepository = void 0;
const outbox_event_model_1 = require("../models/outbox-event.model");
class OutboxEventRepository {
    async create(data, session) {
        const docs = await outbox_event_model_1.OutboxEventModel.create([data], { session });
        return docs[0];
    }
    async findByDedupeKey(dedupeKey, session) {
        return outbox_event_model_1.OutboxEventModel.findOne({ dedupeKey }).session(session ?? null);
    }
    async findById(id, session) {
        return outbox_event_model_1.OutboxEventModel.findById(id).session(session ?? null);
    }
    async findPending(limit = 50) {
        return outbox_event_model_1.OutboxEventModel.find({
            status: 'pending',
            availableAt: { $lte: new Date() },
        })
            .sort({ availableAt: 1 })
            .limit(limit)
            .exec();
    }
    /**
     * Atomically claims the next eligible outbox event for processing.
     * Matches pending events whose availableAt has arrived OR processing events whose lease has expired.
     */
    async claimNext(leaseDurationMs, workerId, now = new Date()) {
        const leaseUntil = new Date(now.getTime() + leaseDurationMs);
        return outbox_event_model_1.OutboxEventModel.findOneAndUpdate({
            $or: [
                { status: 'pending', availableAt: { $lte: now } },
                { status: 'processing', leaseUntil: { $lt: now } },
            ],
        }, {
            $set: {
                status: 'processing',
                leaseUntil,
                claimedBy: workerId,
            },
            $inc: { attempts: 1 },
        }, {
            sort: { availableAt: 1 },
            new: true,
        }).exec();
    }
    /**
     * Atomically claims up to batchSize eligible events.
     */
    async claimBatch(batchSize, leaseDurationMs, workerId, now = new Date()) {
        const claimed = [];
        for (let i = 0; i < batchSize; i++) {
            const event = await this.claimNext(leaseDurationMs, workerId, now);
            if (!event)
                break;
            claimed.push(event);
        }
        return claimed;
    }
    /**
     * Marks an event as successfully delivered.
     */
    async markAsSent(id, processedAt = new Date()) {
        return outbox_event_model_1.OutboxEventModel.findByIdAndUpdate(id, {
            $set: {
                status: 'sent',
                processedAt,
                leaseUntil: null,
                claimedBy: null,
            },
        }, { new: true }).exec();
    }
    /**
     * Re-schedules an event for retry with exponential backoff timestamp.
     */
    async scheduleRetry(id, nextAvailableAt, lastError) {
        return outbox_event_model_1.OutboxEventModel.findByIdAndUpdate(id, {
            $set: {
                status: 'pending',
                availableAt: nextAvailableAt,
                lastError,
                leaseUntil: null,
                claimedBy: null,
            },
        }, { new: true }).exec();
    }
    /**
     * Transitions an event to terminal failure.
     */
    async markAsFailed(id, lastError, processedAt = new Date()) {
        return outbox_event_model_1.OutboxEventModel.findByIdAndUpdate(id, {
            $set: {
                status: 'failed',
                processedAt,
                lastError,
                leaseUntil: null,
                claimedBy: null,
            },
        }, { new: true }).exec();
    }
    /**
     * Periodic recovery of processing events whose lease has expired without completion.
     * Resets them to pending status so they can be reclaimed.
     */
    async recoverExpiredLeases(now = new Date()) {
        const result = await outbox_event_model_1.OutboxEventModel.updateMany({
            status: 'processing',
            leaseUntil: { $lt: now },
        }, {
            $set: {
                status: 'pending',
                leaseUntil: null,
                claimedBy: null,
                availableAt: new Date(Math.min(now.getTime(), Date.now())),
            },
        }).exec();
        return result.modifiedCount;
    }
    /**
     * Returns operational backlog statistics for worker observability.
     */
    async getBacklogStats() {
        const [counts, oldestPending] = await Promise.all([
            outbox_event_model_1.OutboxEventModel.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            outbox_event_model_1.OutboxEventModel.findOne({ status: 'pending' })
                .sort({ availableAt: 1 })
                .select({ availableAt: 1 })
                .lean(),
        ]);
        const stats = {
            pending: 0,
            processing: 0,
            failed: 0,
            sent: 0,
            oldestPendingAgeMs: oldestPending
                ? Math.max(0, Date.now() - new Date(oldestPending.availableAt).getTime())
                : null,
        };
        for (const c of counts) {
            if (c._id in stats) {
                stats[c._id] = c.count;
            }
        }
        return stats;
    }
}
exports.OutboxEventRepository = OutboxEventRepository;
exports.outboxEventRepository = new OutboxEventRepository();
//# sourceMappingURL=outbox-event.repository.js.map