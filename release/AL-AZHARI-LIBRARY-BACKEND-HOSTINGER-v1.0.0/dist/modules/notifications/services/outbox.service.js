"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outboxService = exports.OutboxService = void 0;
const outbox_event_model_1 = require("../models/outbox-event.model");
class OutboxService {
    /**
     * Persists an outbox event atomically within a MongoDB session/transaction.
     */
    async record(input, session) {
        const docs = await outbox_event_model_1.OutboxEventModel.create([
            {
                eventType: input.eventType,
                aggregateType: input.aggregateType,
                aggregateId: input.aggregateId,
                payload: input.payload,
                dedupeKey: input.dedupeKey ?? null,
                status: 'pending',
                attempts: 0,
                availableAt: new Date(),
            },
        ], { session });
        return docs[0];
    }
}
exports.OutboxService = OutboxService;
exports.outboxService = new OutboxService();
//# sourceMappingURL=outbox.service.js.map