import { Types } from 'mongoose';
import { IContentModule, IContentModuleDocument } from '../types/content.types';
export declare class ContentRepository {
    findActive(now?: Date): Promise<IContentModule[]>;
    findById(id: string | Types.ObjectId): Promise<IContentModuleDocument | null>;
    findByKey(key: string): Promise<IContentModuleDocument | null>;
    findAllAdmin(): Promise<IContentModule[]>;
    create(data: Partial<IContentModule>): Promise<IContentModuleDocument>;
    update(id: string | Types.ObjectId, data: Partial<IContentModule>): Promise<IContentModuleDocument | null>;
    delete(id: string | Types.ObjectId): Promise<boolean>;
}
export declare const contentRepository: ContentRepository;
