import { ClientSession } from 'mongoose';
import { IRoleDocument } from '../types/user.types';
export declare class RolesRepository {
    findByKey(key: string, options?: {
        session?: ClientSession;
    }): Promise<IRoleDocument | null>;
    upsertRole(data: {
        key: string;
        displayName: string;
        permissionKeys?: string[];
        isSystem?: boolean;
        active?: boolean;
    }, options?: {
        session?: ClientSession;
    }): Promise<IRoleDocument>;
    listAll(options?: {
        session?: ClientSession;
    }): Promise<IRoleDocument[]>;
}
export declare const rolesRepository: RolesRepository;
