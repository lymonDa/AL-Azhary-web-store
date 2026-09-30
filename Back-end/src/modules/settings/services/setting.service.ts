import { SettingModel } from '../models/setting.model';
import { ISettingDocument, UpdateSettingInput } from '../types/setting.types';
import { auditService, AuditService } from '../../audit/services/audit.service';
import { Types } from 'mongoose';

export class SettingService {
  constructor(private readonly audit: AuditService = auditService) {}

  async getSettingByKey(key: string): Promise<ISettingDocument | null> {
    return SettingModel.findOne({ key: key.trim() }).exec();
  }

  async updateSetting(
    input: UpdateSettingInput,
    actor?: { id: string; role: string; requestId?: string; ipHash?: string },
  ): Promise<ISettingDocument> {
    const key = input.key.trim();
    const existing = await SettingModel.findOne({ key }).exec();

    const previousValue = existing ? existing.value : null;

    const updated = (await SettingModel.findOneAndUpdate(
      { key },
      {
        $set: {
          value: input.value,
          description: input.description ?? existing?.description ?? null,
          updatedBy: actor?.id ? new Types.ObjectId(actor.id) : null,
        },
      },
      { upsert: true, new: true },
    ).exec()) as ISettingDocument;

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

export const settingService = new SettingService();
