import { Types } from 'mongoose';
import { ContentModuleModel } from '../models/content-module.model';
import { IContentModule, IContentModuleDocument } from '../types/content.types';

export class ContentRepository {
  async findActive(now: Date = new Date()): Promise<IContentModule[]> {
    return ContentModuleModel.find({
      active: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      ],
    })
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean<IContentModule[]>();
  }

  async findById(id: string | Types.ObjectId): Promise<IContentModuleDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    return ContentModuleModel.findById(objectId);
  }

  async findByKey(key: string): Promise<IContentModuleDocument | null> {
    return ContentModuleModel.findOne({ key: key.toLowerCase().trim() });
  }

  async findAllAdmin(): Promise<IContentModule[]> {
    return ContentModuleModel.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean<IContentModule[]>();
  }

  async create(data: Partial<IContentModule>): Promise<IContentModuleDocument> {
    return ContentModuleModel.create(data);
  }

  async update(
    id: string | Types.ObjectId,
    data: Partial<IContentModule>,
  ): Promise<IContentModuleDocument | null> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    return ContentModuleModel.findByIdAndUpdate(
      objectId,
      { $set: data },
      { new: true, runValidators: true },
    );
  }

  async delete(id: string | Types.ObjectId): Promise<boolean> {
    const objectId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    const result = await ContentModuleModel.findByIdAndDelete(objectId);
    return Boolean(result);
  }
}

export const contentRepository = new ContentRepository();
