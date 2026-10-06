"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingService = exports.SettingService = void 0;
const setting_model_1 = require("../models/setting.model");
const audit_service_1 = require("../../audit/services/audit.service");
const mongoose_1 = require("mongoose");
class SettingService {
    audit;
    constructor(audit = audit_service_1.auditService) {
        this.audit = audit;
    }
    async getSettingByKey(key) {
        return setting_model_1.SettingModel.findOne({ key: key.trim() }).exec();
    }
    async updateSetting(input, actor) {
        const key = input.key.trim();
        const existing = await setting_model_1.SettingModel.findOne({ key }).exec();
        const previousValue = existing ? existing.value : null;
        const updated = (await setting_model_1.SettingModel.findOneAndUpdate({ key }, {
            $set: {
                value: input.value,
                description: input.description ?? existing?.description ?? null,
                updatedBy: actor?.id ? new mongoose_1.Types.ObjectId(actor.id) : null,
            },
        }, { upsert: true, new: true }).exec());
        // Audit settings mutation
        await this.audit.record({
            actorId: actor?.id,
            actorRole: actor?.role ?? 'admin',
            action: 'settings.updated',
            entityType: 'Setting',
            entityId: key,
            previousState: previousValue ? { value: previousValue } : null,
            newState: { value: input.value },
            requestId: actor?.requestId,
            ipHash: actor?.ipHash,
        });
        return updated;
    }
}
exports.SettingService = SettingService;
exports.settingService = new SettingService();
//# sourceMappingURL=setting.service.js.map